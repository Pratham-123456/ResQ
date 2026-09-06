"""Disaster scenario configuration and origin selection routes."""

from fastapi import APIRouter, HTTPException
from ....app.schemas.schemas import ScenarioCreate, ScenarioResponse, OriginUpdate, StandardErrorResponse
from ....app.simulation.engine import SimulationManager

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.post("", response_model=ScenarioResponse)
def create_scenario(req: ScenarioCreate):
    """Create a validated disaster scenario."""
    try:
        origin_lat = req.origin.latitude if req.origin else None
        origin_lng = req.origin.longitude if req.origin else None
        return SimulationManager.create_scenario(
            city=req.city,
            disaster=req.disaster,
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            properties=req.properties,
            seed=req.seed or 42
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_SCENARIO", "message": str(e)}
        )

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: str):
    """Retrieve an existing disaster scenario."""
    sc = SimulationManager.get_scenario(scenario_id)
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found.")
    return sc

@router.patch("/{scenario_id}/origin", response_model=ScenarioResponse)
def update_scenario_origin(scenario_id: str, origin: OriginUpdate):
    """Update scenario starting origin / epicenter coordinates."""
    sc = SimulationManager.get_scenario(scenario_id)
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found.")
    sc["origin"] = {"latitude": origin.latitude, "longitude": origin.longitude}
    return sc
