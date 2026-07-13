"""Canonical, organisation-scoped MQTT topic construction and validation.

The backend always builds the final topic. The browser/CLI caller never
supplies a complete topic — only a battery_id and (server-resolved)
organisation context, both of which are validated here before being placed
into a topic string.
"""
from __future__ import annotations

import re

_SEGMENT_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_MAX_TOPIC_LENGTH = 256


class InvalidTopicSegmentError(ValueError):
    pass


def validate_segment(value: str, *, field_name: str) -> str:
    """Validate a single topic segment against a conservative allowlist.

    Rejects: empty segments, '+', '#', null bytes / control characters,
    path-traversal-like values, and excessive length.
    """
    if not value:
        raise InvalidTopicSegmentError(f"{field_name} must not be empty")
    if "\x00" in value or any(ord(c) < 0x20 for c in value):
        raise InvalidTopicSegmentError(f"{field_name} contains control characters")
    if value in ("+", "#") or "+" in value or "#" in value:
        raise InvalidTopicSegmentError(f"{field_name} must not contain MQTT wildcards")
    if ".." in value or value in (".", ".."):
        raise InvalidTopicSegmentError(f"{field_name} must not contain path-traversal sequences")
    if not _SEGMENT_RE.match(value):
        raise InvalidTopicSegmentError(
            f"{field_name} must match ^[A-Za-z0-9_-]{{1,64}}$, got {value!r}"
        )
    return value


def build_telemetry_topic(*, topic_root: str, organisation_slug: str, battery_id: str) -> str:
    """Build ev-engineer/v1/sim/{organisation_slug}/battery/{battery_id}/telemetry."""
    org = validate_segment(organisation_slug, field_name="organisation_slug")
    bid = validate_segment(battery_id, field_name="battery_id")
    topic = f"{topic_root}/{org}/battery/{bid}/telemetry"
    if len(topic) > _MAX_TOPIC_LENGTH:
        raise InvalidTopicSegmentError(f"Constructed topic exceeds {_MAX_TOPIC_LENGTH} characters")
    return topic


def resolve_compatibility_prefix(topic_prefix: str | None, *, default_root: str) -> str:
    """Map a client-supplied logical `topic_prefix` (compat field) to the
    canonical namespace root. Never concatenates raw client input into a
    broker topic — only a small, validated allowlist of known aliases is
    honoured; anything else falls back to the canonical default.
    """
    if not topic_prefix:
        return default_root
    known_aliases = {
        "battery/telemetry": default_root,
    }
    return known_aliases.get(topic_prefix, default_root)
