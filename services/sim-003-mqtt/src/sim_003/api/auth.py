"""Authentication + entitlement resolution.

Mirrors the frontend's deny-by-default BatteryTrustRoute logic so a
single organisation/entitlement model governs both the React app and this
backend: `organisations/{id}.enabledProducts` must include `battery_trust`,
and any `productAccess.battery_trust` override (enabled/allowedEmails/
allowedRoles) is honoured exactly as it is client-side.

Missing/unknown entitlement data must never fail open — every branch below
defaults to denial.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol

from fastapi import Header, HTTPException, Request, status

from ..settings import Settings, get_settings

logger = logging.getLogger("sim_003.auth")

REQUIRED_PRODUCT_KEY = "battery_trust"
ALLOWED_EXECUTION_ROLES = {"engineer", "manager", "admin", "owner"}


@dataclass
class AuthContext:
    uid: str
    email: str | None
    organisation_slug: str
    role: str | None
    is_dev_bypass: bool = False


class OrgEntitlement(Protocol):
    enabled_products: list[str]
    product_access_enabled: bool | None  # None = no override present
    allowed_emails: list[str] | None
    allowed_roles: list[str] | None


class EntitlementRepository(Protocol):
    async def get_membership(self, uid: str) -> tuple[str, str] | None:
        """Returns (organisation_id/slug, role) for this user, or None."""
        ...

    async def get_entitlement(self, organisation_id: str) -> OrgEntitlement | None: ...


class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class EntitlementDeniedError(HTTPException):
    def __init__(self, detail: str = "Battery Trust Platform entitlement is not enabled for your organisation"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def _is_loopback(request: Request) -> bool:
    host = request.client.host if request.client else None
    return host in ("127.0.0.1", "::1", "testclient")


async def _verify_firebase_token(authorization: str | None, settings: Settings) -> tuple[str, str | None]:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise AuthenticationError("Empty bearer token")

    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth

        if not firebase_admin._apps:
            if settings.firebase_service_account_path:
                cred = firebase_admin.credentials.Certificate(settings.firebase_service_account_path)
                firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
            else:
                firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})

        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"], decoded.get("email")
    except AuthenticationError:
        raise
    except Exception as exc:  # noqa: BLE001 — any verification failure denies access
        logger.warning("Firebase ID token verification failed: %s", exc)
        raise AuthenticationError("Invalid or expired token") from exc


async def get_auth_context(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthContext:
    settings = get_settings()

    if settings.sim003_dev_auth_bypass:
        if not _is_loopback(request):
            # Impossible-to-activate-in-production guard: even if the flag is
            # somehow set, refuse the bypass for any non-loopback caller.
            raise AuthenticationError("Dev auth bypass is only permitted from loopback")
        logger.warning("SIM003_DEV_AUTH_BYPASS is enabled — do not use outside local development")
        return AuthContext(
            uid=settings.sim003_dev_bypass_uid,
            email=None,
            organisation_slug=settings.sim003_dev_bypass_org,
            role=settings.sim003_dev_bypass_role,
            is_dev_bypass=True,
        )

    uid, email = await _verify_firebase_token(authorization, settings)

    repo: EntitlementRepository = request.app.state.entitlement_repository
    membership = await repo.get_membership(uid)
    if membership is None:
        raise EntitlementDeniedError("No organisation membership found for this user")
    organisation_id, role = membership

    entitlement = await repo.get_entitlement(organisation_id)
    if entitlement is None:
        # Unknown entitlement state must not fail open.
        raise EntitlementDeniedError("Organisation entitlement configuration not found")

    if REQUIRED_PRODUCT_KEY not in entitlement.enabled_products:
        raise EntitlementDeniedError()

    if entitlement.product_access_enabled is False:
        raise EntitlementDeniedError()

    if entitlement.allowed_emails and (email or "").lower() not in [e.lower() for e in entitlement.allowed_emails]:
        raise EntitlementDeniedError("Your email is not on the Battery Trust Platform access list")

    if entitlement.allowed_roles and role not in entitlement.allowed_roles:
        raise EntitlementDeniedError("Your organisation role does not have Battery Trust Platform access")

    if role not in ALLOWED_EXECUTION_ROLES:
        raise EntitlementDeniedError("Your role is not permitted to execute simulators")

    return AuthContext(uid=uid, email=email, organisation_slug=organisation_id, role=role)
