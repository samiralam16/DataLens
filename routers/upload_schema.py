# upload_schema.py

import os
import json
import time
from dotenv import load_dotenv
import pinecone
from pinecone import Pinecone, ServerlessSpec
import google.generativeai as genai

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Gemini Embedding
def get_gemini_embedding(text):
    response = genai.embed_content(
        model="gemini-embedding-001",
        content=text,
        task_type="retrieval_document"
    )
    return response["embedding"]

# Flatten schema.json
def flatten_schema(schema_json):
    flat_schema = []
    for table_name, columns in schema_json.items():  # schema.json is a flat dict now
        table_text = f"Table: {table_name}\n"
        for col, dtype in columns.items():
            table_text += f" - {col} ({dtype})\n"
        flat_schema.append({
            "id": table_name,
            "text": table_text
        })
    return flat_schema

# Upload to Pinecone
def upload_schema_to_pinecone(flat_schema):
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Check if index exists
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        print("Creating Pinecone index...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=3072,  # Gemini embedding dimension
            metric="cosine",
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
        time.sleep(5)  # Wait for index to be ready
    else:
        print("Pinecone index already exists — vectors will be upserted (updated or added).")

    index = pc.Index(PINECONE_INDEX_NAME)

    vectors = []
    for item in flat_schema:
        embedding = get_gemini_embedding(item["text"])
        vectors.append({
            "id": item["id"],
            "values": embedding,
            "metadata": {"text": item["text"]}
        })

    print(f"Upserting {len(vectors)} vectors to Pinecone...")
    index.upsert(vectors=vectors)
    print("✅ Schema embeddings upserted to Pinecone.")

# Main function to be called
def upload_schema_from_file(schema_file_path="schema.json"):
    if not os.path.exists(schema_file_path):
        raise FileNotFoundError("schema.json file not found")

    with open(schema_file_path) as f:
        schema = json.load(f)

    flat_schema = flatten_schema(schema)
    upload_schema_to_pinecone(flat_schema)
