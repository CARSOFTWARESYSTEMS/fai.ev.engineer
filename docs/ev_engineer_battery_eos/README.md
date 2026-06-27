# EV.ENGINEER Battery EOS — Engineering Operating System

## Overview

The Battery EOS is a free-cost, deterministic, JSON-driven Engineering Operating System embedded inside the Battery Intelligence & Cybersecurity product (`battery_pm`). It provides structure for engineering work across the product lifecycle — from mission definition to story-level review and release.

## Hierarchy

```
Mission
  └── Work Package (WP)
        └── Milestone
              └── Story
                    └── Task (planned)
                    └── Verification
                    └── Technical Review
                    └── Release
```

## Active Work Packages

| ID     | Title                        | Mission                              | Priority |
|--------|------------------------------|--------------------------------------|----------|
| WP-001 | Battery Aadhaar Platform     | Mission Alpha — Trusted Battery Identity | High |
| WP-005 | Battery Cybersecurity Platform | Mission Bravo — Secure Battery Operations | Critical |

## Engineering Standard

Every story follows a fixed effort standard:
- **Engineering**: 8 hours
- **QA / Verification**: 2 hours
- **Technical Review**: 2 hours
- **Total per story**: 12 hours

## Workspace Access

| Role | Info | Demo | Engineering | My Work | Team | Reviews |
|------|------|------|-------------|---------|------|---------|
| Developer / Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Partner Admin | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Org Owner / Manager | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Org Engineer | ✅ | ✅ | ✅ | ✅ | — | — |
| Org Approver | ✅ | ✅ | — | — | — | ✅ |
| Inspector / Auditor / Viewer | ✅ | ✅ | — | — | — | — |

## Daily Check-in Gate

Engineers must submit a daily check-in before the workspace is unlocked each day. Check-ins are persisted in Firestore at:

```
engineeringCheckins/{uid}_{YYYY-MM-DD}
```

## Documentation Index

| File | Description |
|------|-------------|
| [work_package_standard.md](work_package_standard.md) | WP definition, scope, milestone structure |
| [story_standard.md](story_standard.md) | Story fields, effort standard, required arrays |
| [daily_checkin_standard.md](daily_checkin_standard.md) | Check-in fields, gate logic, Firestore schema |
| [review_scoring_standard.md](review_scoring_standard.md) | 7-category review scoring, decision matrix |
| [manual_verification_flows.md](manual_verification_flows.md) | Step-by-step manual test flows |

## Constraints

- **No paid AI**: No OpenAI, Anthropic, Gemini, or any LLM API calls in the EOS layer
- **No file uploads to Firestore**: Documents are linked as URLs, not stored as binary
- **No GitHub API**: GitHub references are stored as static strings in seed data
- **No MQTT / real battery backend**: All data is from seed constants or Firestore user actions
- **FAI Reports must remain functional**: EOS changes must not affect `/projects` routes
