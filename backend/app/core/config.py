"""Application configuration for RESQ Backend."""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "RESQ Disaster Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Host & Port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    # Mapbox configuration
    MAPBOX_ACCESS_TOKEN: str = os.getenv("MAPBOX_ACCESS_TOKEN", "")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    
    # OSM Service URLs
    OSM_OVERPASS_URL: str = os.getenv("OSM_OVERPASS_URL", "https://overpass-api.de/api/interpreter")
    OSM_NOMINATIM_URL: str = os.getenv("OSM_NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    
    # AI Decision Support
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("AI_API_KEY", ""))
    
    # Data directory
    DATA_DIR: Path = BASE_DIR / "data"
    OSM_DATA_DIR: Path = BASE_DIR / "data" / "osm"

settings = Settings()
