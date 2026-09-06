"""FastAPI Main Entrypoint for RESQ Backend."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .core.config import settings
from .core.logging import logger
from .api.routes import cities, scenarios, simulations, map as map_routes
from .api import websocket

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Authoritative real-time disaster simulation platform."
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root status & health check
@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Configuration endpoint (supplies Mapbox access token to frontend dynamically)
@app.get(f"{settings.API_V1_STR}/config")
def get_client_config():
    return {
        "mapboxAccessToken": settings.MAPBOX_ACCESS_TOKEN,
        "version": settings.VERSION,
        "supportedCities": ["Delhi", "Chennai"]
    }

# Register API Routers
app.include_router(cities.router, prefix=settings.API_V1_STR)
app.include_router(scenarios.router, prefix=settings.API_V1_STR)
app.include_router(simulations.router, prefix=settings.API_V1_STR)
app.include_router(map_routes.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router)

# Custom Standardized Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "details": {}
            }
        }
    )
