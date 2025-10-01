from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from extensions import get_db
from models import Dataset
from utils import load_dataset

router = APIRouter()


@router.get("/data/{dataset_id}")
async def get_chart_data(
    dataset_id: int,
    chart_type: str = Query("bar"),
    x_column: Optional[str] = Query(None),
    y_column: Optional[str] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = await load_dataset(dataset.file_path, dataset.file_type)
    if len(df) > limit:
        df = df.head(limit)

    return {
        "chart_type": chart_type,
        "columns": list(df.columns),
        "total_rows": len(df)
    }
