from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from extensions import get_db
from models import Dashboard
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

router = APIRouter()

# ----------------------------
# Pydantic Schemas
# ----------------------------
class ChartConfig(BaseModel):
    id: str
    type: str
    title: str
    data: list
    x: Optional[str] = ""
    y: Optional[str] = ""
    position: Dict[str, int]
    size: Dict[str, int]
    filters: Dict[str, Any] = {}

class DashboardIn(BaseModel):
    dataset_id: int
    name: str
    config: List[ChartConfig]

class DashboardOut(BaseModel):
    id: int
    dataset_id: int
    name: str
    config: List[ChartConfig]

    class Config:
        orm_mode = True

# ----------------------------
# Routes
# ----------------------------

@router.post("", response_model=DashboardOut)
def save_dashboard(dashboard: DashboardIn, db: Session = Depends(get_db)):
    """
    Save a new dashboard (always creates a new row, allows multiple per dataset).
    """
    # Store config as JSON string
    config_json = json.dumps([chart.dict() for chart in dashboard.config])
    db_obj = Dashboard(
        dataset_id=dashboard.dataset_id,
        name=dashboard.name,
        config=config_json,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.get("/list", response_model=List[DashboardOut])
def list_dashboards(dataset_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    List all dashboards.
    Optionally filter by dataset_id.
    """
    query = db.query(Dashboard)
    if dataset_id:
        query = query.filter(Dashboard.dataset_id == dataset_id)

    dashboards = query.all()

    results = []
    for d in dashboards:
        try:
            parsed_config = json.loads(d.config)
        except Exception:
            parsed_config = []
        results.append(
            DashboardOut(
                id=d.id,
                dataset_id=d.dataset_id,
                name=d.name,
                config=parsed_config,
            )
        )
    return results


@router.get("/{dashboard_id}", response_model=DashboardOut)
def get_dashboard(dashboard_id: int, db: Session = Depends(get_db)):
    """
    Fetch a dashboard by its ID.
    """
    db_obj = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    try:
        parsed_config = json.loads(db_obj.config)
    except Exception:
        parsed_config = []

    return DashboardOut(
        id=db_obj.id,
        dataset_id=db_obj.dataset_id,
        name=db_obj.name,
        config=parsed_config,
    )
