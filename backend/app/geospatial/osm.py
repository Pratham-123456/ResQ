"""OpenStreetMap infrastructure data loader and cache manager."""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import settings
from ..core.logging import logger

class OSMLoader:
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_city_infrastructure(cls, city_name: str) -> Dict[str, Any]:
        normalized = city_name.lower().strip()
        if normalized in cls._cache:
            return cls._cache[normalized]

        filename = f"{normalized}_infrastructure.json"
        filepath = settings.OSM_DATA_DIR / filename

        if not filepath.exists():
            logger.warning(f"OSM infrastructure file not found for {city_name} at {filepath}")
            # Fallback to delhi or chennai if name contains keyword
            if "delhi" in normalized:
                filepath = settings.OSM_DATA_DIR / "delhi_infrastructure.json"
            elif "chennai" in normalized:
                filepath = settings.OSM_DATA_DIR / "chennai_infrastructure.json"
            else:
                raise FileNotFoundError(f"No OSM data available for city: {city_name}")

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        cls._cache[normalized] = data
        logger.info(f"Loaded OSM infrastructure for {city_name} ({len(data.get('roads', []))} roads, {len(data.get('hospitals', []))} hospitals, {len(data.get('shelters', []))} shelters)")
        return data

    @classmethod
    def list_supported_cities(cls) -> list[Dict[str, Any]]:
        cities = []
        for file in settings.OSM_DATA_DIR.glob("*_infrastructure.json"):
            with open(file, "r", encoding="utf-8") as f:
                d = json.load(f)
                cities.append({
                    "id": d["city"].lower(),
                    "name": d["city"],
                    "country": d.get("country", "India"),
                    "countryCode": d.get("countryCode", "IN"),
                    "type": d.get("type", "coastal"),
                    "latitude": d.get("latitude", 0.0),
                    "longitude": d.get("longitude", 0.0),
                    "population": d.get("population", 0),
                    "supportedDisasters": d.get("supportedDisasters", []),
                    "bbox": d.get("bbox", [])
                })
        return cities
