from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ..core.repository import InMemoryRunRepository
from ..settings import get_settings
from ..transports.in_memory import InMemoryTransport
from ..transports.mosquitto import MosquittoTransport
from .routes import router

logger = logging.getLogger("sim_003.api")

MAX_CONCURRENT_RUNS = 10
MAX_REQUEST_BODY_BYTES = 64 * 1024  # 64 KiB — requests are small JSON scenario configs


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    transport = MosquittoTransport(settings) if settings.sim003_transport == "mqtt" else InMemoryTransport()
    try:
        await transport.connect()
    except Exception as exc:  # noqa: BLE001 — start up in a truthfully-degraded state, never crash silently
        logger.warning("Transport failed to connect at startup: %s", exc)

    app.state.transport = transport
    app.state.repository = InMemoryRunRepository()
    app.state.run_tasks = {}
    app.state.run_queues = {}

    if not settings.sim003_dev_auth_bypass:
        from .firestore_entitlement import FirestoreEntitlementRepository
        try:
            app.state.entitlement_repository = FirestoreEntitlementRepository()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Firestore entitlement repository unavailable: %s", exc)
            app.state.entitlement_repository = None

    yield

    for task in list(app.state.run_tasks.values()):
        task.cancel()
    await transport.disconnect()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="SIM-003 MQTT Telemetry Simulator",
        version="0.1.0",
        description="Synthetic, educational-only BMS telemetry simulator for the Battery Trust Platform.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def limit_body_size(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None and int(content_length) > MAX_REQUEST_BODY_BYTES:
            return JSONResponse(status_code=413, content={"detail": "Request body too large"})
        return await call_next(request)

    @app.middleware("http")
    async def limit_concurrent_runs(request: Request, call_next):
        if request.url.path.endswith("/runs") and request.method == "POST":
            active = len([t for t in request.app.state.run_tasks.values() if not t.done()])
            if active >= MAX_CONCURRENT_RUNS:
                return JSONResponse(status_code=429, content={"detail": "Too many concurrent runs — try again shortly"})
        return await call_next(request)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Invalid request", "errors": jsonable_encoder(exc.errors())},
        )

    app.include_router(router)
    return app
