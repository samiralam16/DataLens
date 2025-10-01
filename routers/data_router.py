from typing import List
import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from werkzeug.utils import secure_filename
from extensions import get_db, engine
from models import Dataset
from utils import load_dataset,get_data_preview

router = APIRouter()


@router.post("/upload-multiple")
async def upload_multiple_data(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files selected")

    allowed_extensions = {"csv", "json", "xlsx", "xls"}
    uploaded_datasets = []

    for file in files:
        if not file.filename:
            continue

        dataset_name = file.filename.rsplit(".", 1)[0]
        file_ext = file.filename.rsplit(".", 1)[1].lower()
        if file_ext not in allowed_extensions:
            continue

        # Save file
        os.makedirs("uploads", exist_ok=True)
        filename = secure_filename(file.filename)
        file_path = os.path.join("uploads", filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Load into pandas
        df = await load_dataset(file_path, file_ext)

        # Save to SQLite
        table_name = dataset_name.replace(" ", "_").lower()
        df.to_sql(table_name, con=engine, if_exists="replace", index=False)

        # Store metadata in DB
        dataset = Dataset(
            name=dataset_name,
            filename=filename,
            file_path=file_path,
            file_type=file_ext,
            file_size=os.path.getsize(file_path),
            columns_info=str(list(df.columns)),
            row_count=len(df),
            is_processed=True
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        # Append metadata for this file to the list
        uploaded_datasets.append(dataset.to_dict())

    if not uploaded_datasets:
        raise HTTPException(status_code=400, detail="No valid files uploaded")

    # Return metadata for all successfully uploaded files
    return {"message": "Files uploaded successfully", "datasets": uploaded_datasets}


@router.get("/")
async def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    return {"datasets": [d.to_dict() for d in datasets], "total": len(datasets)}


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    try:
        data_preview = await get_data_preview(dataset.file_path, dataset.file_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset preview: {str(e)}")

    result = dataset.to_dict()
    result['data_preview'] = data_preview
    return result


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}
