import pandas as pd
from sqlalchemy import inspect
from extensions import engine

def list_tables():
    """List all tables in SQLite database."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Available tables:")
    for i, t in enumerate(tables, 1):
        print(f"{i}. {t}")
    return tables

def preview_table(table_name, limit=10):
    """Preview a table from SQLite."""
    try:
        df = pd.read_sql(f"SELECT * FROM {table_name} LIMIT {limit}", con=engine)
        print(f"\nPreview of '{table_name}' (first {limit} rows):")
        print(df)
    except Exception as e:
        print(f"Error reading table '{table_name}': {e}")

if __name__ == "__main__":
    tables = list_tables()
    if not tables:
        print("No tables found in the database.")
        exit()

    choice = input("Enter table name to preview (or number): ")

    # Allow choosing by number
    if choice.isdigit():
        index = int(choice) - 1
        if 0 <= index < len(tables):
            choice = tables[index]
        else:
            print("Invalid number.")
            exit()

    preview_table(choice)
