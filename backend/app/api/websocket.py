"""Real-time WebSocket endpoint for low-latency simulation stream."""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..simulation.engine import SimulationManager
from ..core.logging import logger

router = APIRouter()

@router.websocket("/ws/simulations/{sim_id}")
async def websocket_simulation_endpoint(websocket: WebSocket, sim_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected to simulation {sim_id}")

    sim = SimulationManager.get_simulation(sim_id)
    if not sim:
        await websocket.send_json({
            "event": "error",
            "message": f"Simulation {sim_id} not found."
        })
        await websocket.close()
        return

    sim.subscribers.add(websocket)

    # Immediately push current baseline state
    try:
        await websocket.send_json({
            "event": "simulation.init",
            "simulationId": sim.simulation_id,
            "state": sim.current_state
        })

        while True:
            # Handle incoming client commands via WebSocket
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                action = msg.get("action")

                if action == "start":
                    sim.start()
                elif action == "pause":
                    sim.pause()
                elif action == "resume":
                    sim.resume()
                elif action == "reset":
                    sim.reset()
                    await websocket.send_json({
                        "event": "simulation.reset",
                        "state": sim.current_state
                    })
                elif action == "speed":
                    sim.set_speed(int(msg.get("value", 1)))
                elif action == "properties":
                    sim.update_properties(msg.get("value", {}))
                elif action == "origin":
                    sim.set_origin(float(msg.get("latitude")), float(msg.get("longitude")))
                    await sim._broadcast_tick()

            except json.JSONDecodeError:
                logger.warning("Received invalid JSON over WebSocket")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from simulation {sim_id}")
    except Exception as e:
        logger.error(f"WebSocket unexpected error: {e}")
    finally:
        sim.subscribers.discard(websocket)
