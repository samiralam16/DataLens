import pandas as pd
import numpy as np

async def load_dataset(file_path: str, file_type: str):
    """Load a dataset into a Pandas DataFrame."""
    if file_type == 'csv':
        return pd.read_csv(file_path)
    elif file_type == 'json':
        return pd.read_json(file_path)
    elif file_type in ['xlsx', 'xls']:
        return pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


async def get_data_preview(file_path: str, file_type: str, rows: int = 10):
    """Get preview of the dataset including columns and sample rows."""
    try:
        df = await load_dataset(file_path, file_type)

        preview_df = df.head(rows)

        return {
            "columns": list(preview_df.columns),
            "rows": preview_df.to_dict(orient="records"),
            "total_rows": len(df)
        }
    except Exception as e:
        print(f"Error getting data preview: {e}")
        return {
            "columns": [],
            "rows": [],
            "total_rows": 0
        }
