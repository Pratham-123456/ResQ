"""City infrastructure and metadata routes."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ....app.geospatial.osm import OSMLoader
from ....app.schemas.schemas import CityInfo

router = APIRouter(prefix="/cities", tags=["cities"])

@router.get("", response_model=List[CityInfo])
def get_cities():
    """List all supported cities with boundaries and disaster capabilities."""
    return OSMLoader.list_supported_cities()

@router.get("/{city_id}")
def get_city(city_id: str):
    """Get complete static infrastructure for a specific city."""
    try:
        return OSMLoader.get_city_infrastructure(city_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found.")
