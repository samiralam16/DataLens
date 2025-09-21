from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
from extensions import get_db, engine
from models import Dataset

# This must be named 'router'
router = APIRouter()

@router.get("/dataset/{dataset_id}/view")
async def view_dataset(dataset_id: int, db: Session = Depends(get_db), limit: int = 100):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    table_name = dataset.name.replace(" ", "_").lower()
    try:
        df = pd.read_sql(f"SELECT * FROM {table_name} LIMIT {limit}", con=engine)
        return {
            "dataset_id": dataset_id,
            "table_name": table_name,
            "total_rows": len(df),
            "columns": list(df.columns),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading table: {str(e)}")
