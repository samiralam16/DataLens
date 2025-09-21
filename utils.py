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
    """Get preview of the dataset as list of dicts."""
    try:
        df = await load_dataset(file_path, file_type)
        if len(df) > rows:
            df = df.head(rows)
        return df.to_dict('records')
    except Exception as e:
        print(f"Error getting data preview: {e}")
        return []
