import os

import pytest
from fastapi.testclient import TestClient


class _FakeEntitlement:
    def __init__(self, enabled_products, product_access_enabled=None, allowed_emails=None, allowed_roles=None):
        self.enabled_products = enabled_products
        self.product_access_enabled = product_access_enabled
        self.allowed_emails = allowed_emails
        self.allowed_roles = allowed_roles


class _FakeEntitlementRepository:
    def __init__(self, membership=None, entitlement=None):
        self._membership = membership
        self._entitlement = entitlement

    async def get_membership(self, uid):
        return self._membership

    async def get_entitlement(self, organisation_id):
        return self._entitlement


@pytest.fixture
def real_auth_client(monkeypatch):
    """A client with the dev bypass OFF, so every request must present a
    bearer token and pass through the (mockable) entitlement repository."""
    monkeypatch.setenv("SIM003_DEV_AUTH_BYPASS", "false")
    monkeypatch.setenv("SIM003_TRANSPORT", "in_memory")

    from sim_003.settings import reset_settings_cache
    reset_settings_cache()

    import sim_003.api.auth as auth_module

    async def _fake_verify(authorization, settings):
        if not authorization:
            raise auth_module.AuthenticationError("Missing bearer token")
        return "test-uid", "engineer@example.com"

    monkeypatch.setattr(auth_module, "_verify_firebase_token", _fake_verify)

    from sim_003.api.app import create_app
    app = create_app()

    def _make_client(entitlement_repo):
        with TestClient(app) as c:
            app.state.entitlement_repository = entitlement_repo
            yield c

    return app, _make_client


def _client_with_repo(app, repo):
    from fastapi.testclient import TestClient
    client = TestClient(app)
    client.__enter__()
    app.state.entitlement_repository = repo
    return client


def test_missing_bearer_token_is_denied(real_auth_client):
    app, _ = real_auth_client
    client = _client_with_repo(app, _FakeEntitlementRepository())
    resp = client.get("/api/v1/simulators/sim-003/scenarios")
    assert resp.status_code == 401
    client.__exit__(None, None, None)


def test_no_organisation_membership_is_denied(real_auth_client):
    app, _ = real_auth_client
    client = _client_with_repo(app, _FakeEntitlementRepository(membership=None))
    resp = client.get(
        "/api/v1/simulators/sim-003/scenarios", headers={"Authorization": "Bearer faketoken"},
    )
    assert resp.status_code == 403
    client.__exit__(None, None, None)


def test_missing_entitlement_document_is_denied(real_auth_client):
    app, _ = real_auth_client
    repo = _FakeEntitlementRepository(membership=("org-1", "engineer"), entitlement=None)
    client = _client_with_repo(app, repo)
    resp = client.get(
        "/api/v1/simulators/sim-003/scenarios", headers={"Authorization": "Bearer faketoken"},
    )
    assert resp.status_code == 403
    client.__exit__(None, None, None)


def test_product_not_in_enabled_products_is_denied(real_auth_client):
    app, _ = real_auth_client
    repo = _FakeEntitlementRepository(
        membership=("org-1", "engineer"),
        entitlement=_FakeEntitlement(enabled_products=["fai_reports"]),
    )
    client = _client_with_repo(app, repo)
    resp = client.get(
        "/api/v1/simulators/sim-003/scenarios", headers={"Authorization": "Bearer faketoken"},
    )
    assert resp.status_code == 403
    client.__exit__(None, None, None)


def test_explicit_false_entitlement_override_is_denied(real_auth_client):
    app, _ = real_auth_client
    repo = _FakeEntitlementRepository(
        membership=("org-1", "engineer"),
        entitlement=_FakeEntitlement(enabled_products=["battery_trust"], product_access_enabled=False),
    )
    client = _client_with_repo(app, repo)
    resp = client.get(
        "/api/v1/simulators/sim-003/scenarios", headers={"Authorization": "Bearer faketoken"},
    )
    assert resp.status_code == 403
    client.__exit__(None, None, None)


def test_role_not_in_allowlist_is_denied(real_auth_client):
    app, _ = real_auth_client
    repo = _FakeEntitlementRepository(
        membership=("org-1", "viewer"),
        entitlement=_FakeEntitlement(enabled_products=["battery_trust"], allowed_roles=["admin"]),
    )
    client = _client_with_repo(app, repo)
    resp = client.get(
        "/api/v1/simulators/sim-003/scenarios", headers={"Authorization": "Bearer faketoken"},
    )
    assert resp.status_code == 403
    client.__exit__(None, None, None)


def test_entitled_organisation_and_role_is_allowed(real_auth_client):
    app, _ = real_auth_client
    repo = _FakeEntitlementRepository(
        membership=("org-1", "engineer"),
        entitlement=_FakeEntitlement(enabled_products=["battery_trust"]),
    )
    client = _client_with_repo(app, repo)
    resp = client.get(
        "/api/v1/simulators/sim-003/scenarios", headers={"Authorization": "Bearer faketoken"},
    )
    assert resp.status_code == 200
    client.__exit__(None, None, None)


def test_execution_role_not_permitted_is_denied(real_auth_client):
    """A role that IS on the org's allowlist but isn't an execution role
    (e.g. a bare 'viewer' with no allowed_roles restriction at all) is
    still denied simulator execution."""
    app, _ = real_auth_client
    repo = _FakeEntitlementRepository(
        membership=("org-1", "viewer"),
        entitlement=_FakeEntitlement(enabled_products=["battery_trust"]),
    )
    client = _client_with_repo(app, repo)
    resp = client.get(
        "/api/v1/simulators/sim-003/scenarios", headers={"Authorization": "Bearer faketoken"},
    )
    assert resp.status_code == 403
    client.__exit__(None, None, None)
