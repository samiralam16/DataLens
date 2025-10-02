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
            conn.execute(text(f"DROP TABLE IF EXISTS {snapshot.result_table}"))

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

