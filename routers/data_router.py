from typing import List
import os
import json
import time
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from werkzeug.utils import secure_filename
from extensions import get_db, engine
from models import Dataset
from utils import load_dataset,get_data_preview
from sqlalchemy import text
from .upload_schema import upload_schema_from_file
from pinecone import Pinecone, ServerlessSpec



router = APIRouter()

SCHEMA_FILE_PATH = "schema.json"

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# @router.post("/upload-multiple")
# async def upload_multiple_data(
#     files: List[UploadFile] = File(...),
#     db: Session = Depends(get_db)
# ):
#     if not files:
#         raise HTTPException(status_code=400, detail="No files selected")

#     allowed_extensions = {"csv", "json", "xlsx", "xls"}
#     uploaded_datasets = []

#     for file in files:
#         if not file.filename:
#             continue

#         dataset_name = file.filename.rsplit(".", 1)[0]
#         file_ext = file.filename.rsplit(".", 1)[1].lower()
#         if file_ext not in allowed_extensions:
#             continue

#         # Save file
#         os.makedirs("uploads", exist_ok=True)
#         filename = secure_filename(file.filename)
#         file_path = os.path.join("uploads", filename)
#         with open(file_path, "wb") as buffer:
#             buffer.write(await file.read())

#         # Load into pandas
#         df = await load_dataset(file_path, file_ext)

#         # Save to SQLite
#         table_name = dataset_name.replace(" ", "_").lower()
#         df.to_sql(table_name, con=engine, if_exists="replace", index=False)

#         # Store metadata in DB
#         dataset = Dataset(
#             name=dataset_name,
#             filename=filename,
#             file_path=file_path,
#             file_type=file_ext,
#             file_size=os.path.getsize(file_path),
#             columns_info=str(list(df.columns)),
#             row_count=len(df),
#             is_processed=True
#         )
#         db.add(dataset)
#         db.commit()
#         db.refresh(dataset)

#         # Append metadata for this file to the list
#         uploaded_datasets.append(dataset.to_dict())

#     if not uploaded_datasets:
#         raise HTTPException(status_code=400, detail="No valid files uploaded")

#     # Return metadata for all successfully uploaded files
#     return {"message": "Files uploaded successfully", "datasets": uploaded_datasets}


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

    data_preview = await get_data_preview(dataset.file_path, dataset.file_type)
    result = dataset.to_dict()
    result.update(data_preview)  # merges columns, rows, total_rows
    return result


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Drop table in SQLite
    try:
        with engine.connect() as conn:
            conn.execute(text(f'DROP TABLE IF EXISTS "{dataset.name}"'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to drop table: {str(e)}")

    # Remove the dataset file
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)

    # Remove from schema.json
    if os.path.exists(SCHEMA_FILE_PATH):
        try:
            with open(SCHEMA_FILE_PATH, "r") as f:
                schema_data = json.load(f)

            if dataset.name in schema_data:
                del schema_data[dataset.name]
                with open(SCHEMA_FILE_PATH, "w") as f:
                    json.dump(schema_data, f, indent=4)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update schema.json: {str(e)}")
        
    #Remove schema from Pinecone
    try:
        index.delete(ids=[dataset.name])
        # You can optionally check delete_response for confirmation
        print(f"Deleted vector for dataset '{dataset.name}' from Pinecone.")
    except Exception as e:
        # Log this error but do not block the deletion process
        print(f"⚠️ Failed to delete vector from Pinecone: {str(e)}")

    # Delete from DB
    db.delete(dataset)
    db.commit()

    return {"message": f"Dataset '{dataset.name}' deleted successfully"}

@router.get("/{dataset_id}/preview")
async def preview_dataset(dataset_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Return schema and sample rows for a dataset by ID."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        table_name = dataset.name.replace(" ", "_").lower()
        df = pd.read_sql(f'SELECT * FROM "{table_name}" LIMIT {limit}', con=engine)

        schema = [{"name": col, "dtype": str(dtype)} for col, dtype in zip(df.columns, df.dtypes)]
        rows = df.to_dict(orient="records")

        return {
            "dataset": dataset.to_dict(),
            "columns": schema,
            "rows": rows,
            "total_rows": dataset.row_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview dataset: {str(e)}")


# Utility function to check if file exists
def file_exists(file_name: str) -> bool:
    # Check if a file with the same name already exists in the uploads folder
    return os.path.exists(os.path.join("uploads", file_name))

# Utility function to generate schema
def generate_schema(df: pd.DataFrame) -> dict:
    schema = {}
    for col in df.columns:
        schema[col] = str(df[col].dtype)
    return schema

# Utility function to save schema to schema.json
def save_schema_to_json(dataset_name: str, schema: dict):
    schema_file_path = "schema.json"
    
    # Check if schema.json exists
    if os.path.exists(schema_file_path):
        with open(schema_file_path, "r") as f:
            existing_schemas = json.load(f)
    else:
        existing_schemas = {}

    # Add new schema for this dataset
    existing_schemas[dataset_name] = schema

    # Write back to schema.json
    with open(schema_file_path, "w") as f:
        json.dump(existing_schemas, f, indent=4)

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

        # Restrict same file name upload
        if file_exists(file.filename):
            raise HTTPException(status_code=400, detail=f"File with name {file.filename} already exists")

        if file_ext not in allowed_extensions:
            continue

        # Save the file
        os.makedirs("uploads", exist_ok=True)
        filename = secure_filename(file.filename)
        file_path = os.path.join("uploads", filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Load into pandas based on file type
        df = None
        if file_ext == "csv":
            df = pd.read_csv(file_path)
        elif file_ext == "json":
            df = pd.read_json(file_path)
        elif file_ext in {"xlsx", "xls"}:
            df = pd.read_excel(file_path)

        if df is None:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Generate schema and save to schema.json
        schema = generate_schema(df)
        save_schema_to_json(dataset_name, schema)

        try:
            upload_schema_from_file("schema.json")
        except Exception as e:
            print(f"⚠️ Failed to upload schema to Pinecone: {str(e)}")

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


