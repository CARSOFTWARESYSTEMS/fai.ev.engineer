"""ASGI entrypoint: `uvicorn sim_003.main:app --reload --port 8003`"""
from .api.app import create_app

app = create_app()
