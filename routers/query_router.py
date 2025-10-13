import os
import pandas as pd
from fastapi import APIRouter, Body, HTTPException, Depends, File, UploadFile, Form,Query
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from werkzeug.utils import secure_filename
from extensions import get_db, engine
from models import Dataset
from utils import load_dataset, get_data_preview
from typing import List
from models import Snapshot
from schema import SnapshotRequest, SnapshotResponse
from pydantic import BaseModel
from pinecone import Pinecone
import google.generativeai as genai
import requests
import psycopg2
import json
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


# Get environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()


@router.get("/tables")
async def list_tables():
    """Return all available tables in SQLite."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return {"tables": tables, "total": len(tables)}


@router.get("/preview/{table_name}")
async def preview_table(table_name: str, limit: int = 10):
    """Preview the first rows of a table."""
    try:
        df = pd.read_sql(f"SELECT * FROM {table_name} LIMIT {limit}", con=engine)
        return {
            "table": table_name,
            "rows": len(df),
            "columns": list(df.columns),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading table '{table_name}': {str(e)}")
    

@router.get("")
async def run_query(sql: str = Query(...)):
    """Run a raw SQL query (only SELECT)."""
    if not sql.strip().lower().startswith("select"):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed")
    try:
        df = pd.read_sql(text(sql), con=engine)
        return {
            "rows_returned": len(df),
            "columns": list(df.columns),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing query: {str(e)}")

@router.post("/snapshots", response_model=SnapshotResponse)
async def create_snapshot(request: SnapshotRequest, db: Session = Depends(get_db)):
    """Create a snapshot: save query + results into a new table."""
    sql_query = request.sql_query.strip()
    snapshot_name = request.snapshot_name

    if not sql_query.lower().startswith("select"):
        raise HTTPException(status_code=400, detail="Only SELECT queries can be snapshotted")

    try:
        # Run query
        df = pd.read_sql(text(sql_query), con=engine)

        # Generate snapshot table name
        safe_name = snapshot_name.replace(" ", "_").lower()
        result_table = f"{safe_name}"

        # Save result into SQLite
        df.to_sql(result_table, con=engine, if_exists="replace", index=False)

        # Save metadata
        snapshot = Snapshot(
            snapshot_name=snapshot_name,
            sql_query=sql_query,
            result_table=result_table
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        return snapshot
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating snapshot: {str(e)}")

@router.get("/snapshots", response_model=List[SnapshotResponse])
async def list_snapshots(db: Session = Depends(get_db)):
    """Get metadata of all snapshots."""
    snapshots = db.query(Snapshot).order_by(Snapshot.created_at.desc()).all()
    return snapshots

@router.get("/snapshots/{snapshot_id}/preview")
async def preview_snapshot(snapshot_id: int, db: Session = Depends(get_db), limit: int = 10):
    """Preview data from snapshot table."""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    try:
        df = pd.read_sql(f"SELECT * FROM {snapshot.result_table} LIMIT {limit}", con=engine)
        return {
            "snapshot": snapshot.to_dict(),
            "preview": df.to_dict(orient="records"),
            "rows": len(df),
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading snapshot table: {str(e)}")


@router.delete("/snapshots/{snapshot_id}")
async def delete_snapshot(snapshot_id: int, db: Session = Depends(get_db)):
    """Delete snapshot metadata + drop its result table."""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    try:
        # Drop table
        with engine.connect() as conn:
            conn.execute(text(f"DROP TABLE IF EXISTS '{snapshot.result_table}'"))

        db.delete(snapshot)
        db.commit()
        return {"message": f"Snapshot '{snapshot.snapshot_name}' deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting snapshot: {str(e)}")

@router.get("/all-sources")
async def list_all_sources(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).all()
    snapshots = db.query(Snapshot).all()

    # Format datasets
    dataset_sources = [
        {
            "id": d.id,
            "name": d.name,
            "type": "dataset",
            "rows": d.row_count,
            "file_type": d.file_type
        }
        for d in datasets
    ]

    # Format snapshots (calculate row count from snapshot.result_table)
    snapshot_sources = []
    for s in snapshots:
        try:
            df = pd.read_sql(f'SELECT COUNT(*) as cnt FROM "{s.result_table}"', con=engine)
            row_count = int(df["cnt"].iloc[0])
        except Exception:
            row_count = 0

        snapshot_sources.append({
            "id": s.id,
            "name": s.snapshot_name,
            "type": "snapshot",
            "rows": row_count,
            "file_type": "snapshot",
            "result_table": s.result_table 
        })

    return {"sources": dataset_sources + snapshot_sources}

def get_gemini_embedding(text):
    """Generate embeddings using Gemini"""
    response = genai.embed_content(
        model="gemini-embedding-001",
        content=text,
        task_type="retrieval_document"
    )
    return response["embedding"]

def search_relevant_schema(user_query, top_k=3, score_threshold=0.70):
    """Search Pinecone for relevant schema"""
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)

    query_embedding = get_gemini_embedding(user_query)
    results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)

    return [match['metadata']['text'] for match in results['matches'] if match['score'] >= score_threshold]

def generate_sql_query(user_query, relevant_schema):
    """Call Gemini to generate SQL query"""
    context = "\n\n".join(relevant_schema)
    prompt = f"""
        You are an expert SQL query generator. Your ONLY task is to analyze the provided database schema and generate a valid SQL query to answer the user question.

        Behavior:
        - If no SQL dialect is specified, default to PostgreSQL.
        - If a different SQL dialect is mentioned, use that.

        Instructions:
        - DO NOT answer general questions, provide explanations, or respond outside your task.
        - DO NOT include comments or special formatting characters like [.,\\,n,t] in the SQL.
        - ONLY generate SQL if it is clearly supported by the schema.
        - If no schema is provided in the context, attempt to extract schema details from the user query (e.g., if the user says "schema: column1, column2" or mentions table/field names).
        - If neither context nor user query includes a valid schema, or if the question is irrelevant to the schema, return a clear reason in the "sql_query" field.

        Schema detection:
        - First, check if the schema is provided in the 'Schema' section.
        - If the 'Schema' section is empty or not provided, inspect the user question for any embedded schema or column/table definitions.
        - If schema can be reasonably extracted from the user query, proceed to generate SQL based on that.

        You must always respond in the following strict JSON format:

        {{
        "token_usage": [number of tokens used in the response] : integer,
        "cost": [estimated cost of the response in USD] : float,
        "tables_used": [list of relevant table names from the schema],
        "filters": [list of conditions or filters used, if any],
        "columns": [list of columns selected or referenced],
        "sql_query": "SQL query. Otherwise, a reason such as: 'No schema provided to generate SQL query' or 'My capabilities are limited to generating SQL based only on the provided schema'"
        }}

        Schema:
        {context}

        User Question:
        {user_query}
        """


    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    body = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    response = requests.post(url, headers=headers, params=params, json=body)
    response.raise_for_status()

    candidates = response.json().get("candidates", [])
    if not candidates:
        return {"error": "No response from Gemini"}

    content = candidates[0]['content']['parts'][0]['text']

    # Clean up markdown code block
    if content.startswith("```json") or content.startswith("```"):
        content = content.strip("`")
        content = content.replace("json", "", 1).strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"error": "Failed to parse Gemini response", "raw": content}

def log_query_to_postgres(user_query, relevant_tables_with_scores, gemini_response):
    """Log query to PostgreSQL database"""
    try:
        token_usage = gemini_response.get("token_usage")
        cost = gemini_response.get("cost")
        tables_used = gemini_response.get("tables_used", [])
        filters = gemini_response.get("filters", [])
        columns = gemini_response.get("columns", [])
        sql_query = gemini_response.get("sql_query")

        table_names = [item["table_name"] for item in relevant_tables_with_scores]
        scores = [item["score"] for item in relevant_tables_with_scores]

        conn = psycopg2.connect(
            dbname=os.getenv("PG_DB"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD"),
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT")
        )
        cursor = conn.cursor()

        insert_query = """
            INSERT INTO query_logs (
                user_query,
                relevant_tables,
                relevant_scores,
                tables_used,
                filters,
                columns,
                sql_query,
                token_usage,
                cost
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(insert_query, (
            user_query,
            table_names,
            scores,
            tables_used,
            filters,
            columns,
            sql_query,
            token_usage,
            cost
        ))

        conn.commit()
        cursor.close()
        conn.close()

        print("Query log saved to PostgreSQL.", file=sys.stderr)
    except Exception as e:
        print(f"Failed to log query: {e}", file=sys.stderr)

def process_user_query(user_query):
    """Main function to process user query and return SQL"""
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        query_embedding = get_gemini_embedding(user_query)
        pinecone_results = index.query(vector=query_embedding, top_k=3, include_metadata=True)

        relevant_schema = search_relevant_schema(user_query)
        relevant_tables_with_scores = extract_table_scores_from_results(pinecone_results, score_threshold=0.70)
        
        result = generate_sql_query(user_query, relevant_schema)
        
        log_query_to_postgres(user_query, relevant_tables_with_scores, result)
        
        return {
            "success": True,
            "sql_query": result.get("sql_query"),
            "error": result.get("error")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def extract_table_scores_from_results(results, score_threshold=0.70):
    """
    Extracts clean table names and their scores from Pinecone query results.

    Args:
        results (dict): Pinecone query results (with 'matches' list).
        score_threshold (float): Minimum score to include.

    Returns:
        List of dicts with 'table_name' and 'score', where 'table_name' is cleaned.
    """
    def extract_table_name(table_str):
        if not table_str:
            return None
        first_line = table_str.split("\n")[0]
        if first_line.startswith("Table: "):
            return first_line[len("Table: "):].strip()
        return table_str

    table_scores = []
    for match in results.get('matches', []):
        score = match.get('score', 0)
        raw_table_name = match.get('metadata', {}).get('text', 'unknown_table')
        if score >= score_threshold:
            clean_table_name = extract_table_name(raw_table_name)
            table_scores.append({"table_name": clean_table_name, "score": score})
    return table_scores

class QueryRequest(BaseModel):
    user_query: str

@router.post("/generate-sql")
def generate_sql(request: QueryRequest):
    result = process_user_query(request.user_query)
    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
