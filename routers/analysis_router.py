from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from extensions import get_db
from models import Dataset
from utils import load_dataset
from typing import Optional
import numpy as np

router = APIRouter()


@router.get("/{dataset_id}")
async def get_data_analysis(
    dataset_id: int,
    analysis_type: str = Query("overview"),
    column: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = await load_dataset(dataset.file_path, dataset.file_type)
    if df.empty:
        raise HTTPException(status_code=400, detail="No data found")

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

    return {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols
    }
