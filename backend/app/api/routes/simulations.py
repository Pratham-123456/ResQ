"""Simulation execution, control, and state telemetry routes."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from ....app.schemas.schemas import SimulationStateResponse, SpeedChange, PropertyUpdate, OriginUpdate
from ....app.simulation.engine import SimulationManager

router = APIRouter(prefix="/simulations", tags=["simulations"])

class SimCreateRequest(BaseModel):
    scenarioId: str

@router.post("")
async def create_simulation(req: SimCreateRequest):
    """Instantiate a new simulation from a configured scenario."""
    try:
        sim = SimulationManager.create_simulation(req.scenarioId)
        return sim.current_state
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{sim_id}/state")
async def get_simulation_state(sim_id: str):
    """Fetch current comprehensive simulation state."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    return sim.current_state

@router.post("/{sim_id}/start")
async def start_simulation(sim_id: str):
    """Start or resume the simulation clock."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.start()
    return {"status": sim.status, "elapsedSeconds": sim.elapsed_seconds}

@router.post("/{sim_id}/pause")
async def pause_simulation(sim_id: str):
    """Pause the simulation clock."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.pause()
    return {"status": sim.status, "elapsedSeconds": sim.elapsed_seconds}

@router.post("/{sim_id}/resume")
async def resume_simulation(sim_id: str):
    """Resume the simulation clock."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.resume()
    return {"status": sim.status, "elapsedSeconds": sim.elapsed_seconds}

@router.post("/{sim_id}/reset")
async def reset_simulation(sim_id: str):
    """Reset the simulation back to initial scenario state (t=0)."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.reset()
    return sim.current_state

@router.post("/{sim_id}/stop")
async def stop_simulation(sim_id: str):
    """Stop the simulation."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.stop()
    return {"status": sim.status}

@router.patch("/{sim_id}/speed")
async def change_speed(sim_id: str, req: SpeedChange):
    """Update simulation acceleration factor (1x, 2x, 5x)."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.set_speed(req.speed)
    return {"speed": sim.speed}

@router.patch("/{sim_id}/properties")
async def update_properties(sim_id: str, req: PropertyUpdate):
    """Update live disaster dynamic parameters."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.update_properties(req.properties)
    return sim.current_state

@router.patch("/{sim_id}/origin")
async def update_origin(sim_id: str, req: OriginUpdate):
    """Update disaster starting origin / epicenter coordinates."""
    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation {sim_id} not found.")
    sim.set_origin(req.latitude, req.longitude)
    return sim.current_state
