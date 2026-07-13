import os

import pytest
from fastapi.testclient import TestClient

os.environ["SIM003_TRANSPORT"] = "in_memory"
os.environ["SIM003_DEV_AUTH_BYPASS"] = "true"
os.environ["SIM003_ALLOWED_ORIGINS"] = "http://localhost:5173"

from sim_003.api.app import create_app  # noqa: E402
from sim_003.settings import reset_settings_cache  # noqa: E402


@pytest.fixture
def client():
    reset_settings_cache()
    app = create_app()
    with TestClient(app) as c:
        yield c
