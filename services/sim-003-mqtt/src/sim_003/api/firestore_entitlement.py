"""Real Firestore-backed EntitlementRepository.

Mirrors src/services/organisationService.ts exactly: membership lives in the
top-level `organisationMembers` collection (queried by `userUid`), and the
product entitlement lives on the `organisations/{organisationId}` document's
`enabledProducts` / `productAccess` fields.

Not exercised by an end-to-end integration test in this milestone — it
requires a real Firebase service account and populated Firestore data that
are not available in the development sandbox. See known-limitations report.
"""
from __future__ import annotations

from dataclasses import dataclass

from .auth import REQUIRED_PRODUCT_KEY


@dataclass
class _OrgEntitlement:
    enabled_products: list[str]
    product_access_enabled: bool | None
    allowed_emails: list[str] | None
    allowed_roles: list[str] | None


class FirestoreEntitlementRepository:
    def __init__(self) -> None:
        from firebase_admin import firestore

        self._db = firestore.client()

    async def get_membership(self, uid: str) -> tuple[str, str] | None:
        query = (
            self._db.collection("organisationMembers")
            .where("userUid", "==", uid)
            .limit(1)
        )
        docs = list(query.stream())
        if not docs:
            return None
        data = docs[0].to_dict() or {}
        organisation_id = data.get("organisationId")
        role = data.get("role")
        if not organisation_id:
            return None
        return organisation_id, role

    async def get_entitlement(self, organisation_id: str):
        doc = self._db.collection("organisations").document(organisation_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict() or {}
        enabled_products = data.get("enabledProducts") or []
        product_access = (data.get("productAccess") or {}).get(REQUIRED_PRODUCT_KEY)
        return _OrgEntitlement(
            enabled_products=enabled_products,
            product_access_enabled=(product_access or {}).get("enabled") if product_access else None,
            allowed_emails=(product_access or {}).get("allowedEmails") if product_access else None,
            allowed_roles=(product_access or {}).get("allowedRoles") if product_access else None,
        )
