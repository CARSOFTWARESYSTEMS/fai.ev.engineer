# ADR-0002 — Core architecture decisions

**Status:** Accepted
**Date:** 2026-07-13

## Local Mosquitto + in-memory fallback, both first-class

**Decision:** `EventTransport` is a Protocol with two real implementations, selected by `SIM003_TRANSPORT` env var or per-request `transport` override. Neither is a stub — `InMemoryTransport` is a genuine deterministic broker-free bus (used by all 51 unit tests and 5 CLI tests), and `MosquittoTransport` is a real `aiomqtt`-backed client (used by all 8 integration tests against an actually-running local broker).

**Why:** The original requirement's offline capability must survive the Mosquitto integration, per the master prompt: "Do not remove the fallback." Keeping both real (not one real + one stub) means CI and quick local iteration never need a broker, while the actual security/reconciliation guarantees are still verified against real MQTT semantics (ACL enforcement, QoS acknowledgement timing, connection loss) in the integration suite.

## Backend-mediated MQTT, never browser-to-broker

**Decision:** The browser only ever talks to the FastAPI backend (HTTP + SSE). There is no Mosquitto WebSocket listener, and none is planned for this milestone.

**Why:** A browser-reachable broker listener would require exposing broker credentials (or an anonymous-access mode) to client-side JavaScript, defeating the ACL/authentication model entirely. Routing everything through FastAPI means the server always resolves the organisation-scoped topic and enforces entitlement before any MQTT traffic is touched.

## Canonical, organisation-scoped, injection-safe topic namespace

**Decision:** `ev-engineer/v1/sim/{organisation_slug}/battery/{battery_id}/telemetry`, built server-side only, with every segment validated against a conservative allowlist (`^[A-Za-z0-9_-]{1,64}$`) that explicitly rejects `+`, `#`, control characters, empty segments, and traversal-like values.

**Why:** A client-supplied topic (or even a client-supplied *segment* of a topic) is an injection surface — a battery ID containing `#` could subscribe a "publisher" to the entire broker's traffic. Building the topic entirely server-side from validated, already-authenticated inputs closes that off. The organisation slug specifically comes from the resolved entitlement context, never from the request body (`GenerateEventsRequest` has no `organisation_id` field at all — the Pydantic schema physically cannot accept one, `extra="forbid"`).

## Ephemeral, bounded, in-memory run storage — no Firestore for telemetry

**Decision:** `InMemoryRunRepository` caps at 200 runs (LRU eviction) and is process-local; nothing about a run or its observed events is written to Firestore.

**Why:** High-frequency telemetry does not belong in a document database — this mirrors the existing FAI.EV.ENGINEER principle (Firestore for metadata, not high-volume technical data) and avoids an unbounded-cost/unbounded-growth failure mode for a POC. A future pilot milestone would introduce a real time-series adapter behind the same `RunRepository` Protocol rather than writing raw events to Firestore.

## Replay-vs-duplicate timing, made explicit rather than clock-dependent

**Decision:** The generator computes the replayed event's `sent_at` directly as `original.timestamp + replay_window_seconds + 30s`, rather than letting the injected clock's per-event step size determine it.

**Why:** With a small, uniform clock step (needed elsewhere for readable, fast-running tests), "one tick later" and "300+ seconds later" look identical if left to the clock alone — duplicate and replay would be indistinguishable to the detector. Computing the replay gap explicitly keeps both determinism (same seed → same output) and semantic correctness (a replay really is "much later," not "immediately again") without requiring tests to wait 300 real seconds.

## Firebase-based auth mirrored from the existing frontend model, not reinvented

**Decision:** `api/auth.py` replicates the frontend's `BatteryTrustRoute` deny-by-default sequence exactly (org membership → `enabledProducts` → `productAccess` override → email/role allowlists), rather than inventing a parallel authorization model for this backend.

**Why:** Two different entitlement models for the same product would be a correctness and maintenance hazard — an org enabled in one system but not the other produces confusing, hard-to-audit access. See known-limitations report for what remains unverified against real Firestore data in this development environment.
