from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ---------- Snapshot ----------
class SnapshotRequest(BaseModel):
    snapshot_name: str
    sql_query: str


class SnapshotResponse(BaseModel):
    id: int
    snapshot_name: str
    sql_query: str
    result_table: str
    created_at: datetime

    class Config:
        orm_mode = True

