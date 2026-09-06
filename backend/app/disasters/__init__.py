"""Disaster model registry and factory."""

from typing import Dict, Any
from .base import BaseDisaster
from .flood import FloodDisaster, DEFAULT_FLOOD_PROPS
from .earthquake import EarthquakeDisaster, DEFAULT_QUAKE_PROPS
from .cyclone import CycloneDisaster, DEFAULT_CYCLONE_PROPS
from .tsunami import TsunamiDisaster, DEFAULT_TSUNAMI_PROPS

DISASTER_MODELS = {
    "flood": FloodDisaster,
    "earthquake": EarthquakeDisaster,
    "cyclone": CycloneDisaster,
    "tsunami": TsunamiDisaster,
}

DISASTER_SCHEMAS = {
    "flood": DEFAULT_FLOOD_PROPS,
    "earthquake": DEFAULT_QUAKE_PROPS,
    "cyclone": DEFAULT_CYCLONE_PROPS,
    "tsunami": DEFAULT_TSUNAMI_PROPS,
}

def create_disaster_model(disaster_name: str, properties: Dict[str, float] = None) -> BaseDisaster:
    name = disaster_name.lower().strip()
    if name not in DISASTER_MODELS:
        raise ValueError(f"Unsupported disaster type: {disaster_name}. Must be one of {list(DISASTER_MODELS.keys())}")
    
    cls = DISASTER_MODELS[name]
    return cls(properties or {})
