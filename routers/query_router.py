from typing import List
import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from werkzeug.utils import secure_filename
from extensions import get_db, engine
from models import Dataset
from utils import load_dataset, get_data_preview

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

@router.post("/query")
async def run_query(sql: str):
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

