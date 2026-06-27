# Work Package Standard — Battery EOS

## Definition

A Work Package (WP) is the primary unit of engineering delivery inside a Mission. Each WP maps to a specific product capability and is decomposed into Milestones and Stories.

## Work Package Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workPackageId` | string | ✅ | Unique ID, format: `WP-NNN` |
| `productKey` | string | ✅ | Always `battery_pm` for Battery Intelligence |
| `missionId` | string | ✅ | Parent mission, e.g. `MISSION-ALPHA` |
| `missionName` | string | ✅ | Human name: `Mission Alpha — Trusted Battery Identity` |
| `title` | string | ✅ | Short WP title |
| `definition` | string | ✅ | One-sentence capability definition |
| `scope` | string[] | ✅ | List of in-scope capability tags |
| `status` | EosWpStatus | ✅ | `planned \| in_progress \| complete \| on_hold \| cancelled` |
| `priority` | EosPriority | ✅ | `low \| medium \| high \| critical` |
| `progressPercent` | number | ✅ | 0–100, computed from approved stories |
| `dueDate` | string | — | ISO date string |
| `milestones` | EosMilestone[] | ✅ | Ordered list of milestones |
| `stories` | EosStory[] | ✅ | Flat list of all stories in this WP |
| `owner` | string | — | Owner email or name |
| `partnerId` | string | — | Partner context if applicable |
| `organisationId` | string | — | Org context if applicable |

## Milestone Structure

Each WP must have **at minimum 3 milestones**, each tracking a logical phase of delivery:

```
Milestone 1 — Foundation / Setup
Milestone 2 — Core Implementation
Milestone 3 — Verification & Reporting
```

### Milestone Fields

| Field | Type | Description |
|-------|------|-------------|
| `milestoneId` | string | Format: `WP-NNN-MN` |
| `workPackageId` | string | Parent WP reference |
| `title` | string | Short milestone title |
| `description` | string | What this milestone covers |
| `status` | EosMilestoneStatus | `planned \| in_progress \| complete \| blocked` |
| `dueDate` | string | ISO date |
| `storyIds` | string[] | Story IDs that belong to this milestone |

## Active Work Packages

### WP-001 — Battery Aadhaar Platform

- **Mission**: Mission Alpha — Trusted Battery Identity
- **Definition**: Create a trusted digital identity layer for every mission-critical battery
- **Milestones**: M1 Identity Foundation · M2 Custody & Ownership · M3 Verification & Reporting
- **Stories**: S1 Aadhaar ID Schema · S2 QR Code · S3 Custody Transfer · S4 Registry Search · S5 Identity Report

### WP-005 — Battery Cybersecurity Platform

- **Mission**: Mission Bravo — Secure Battery Operations
- **Definition**: Establish a cybersecurity threat model and detection architecture for battery systems
- **Milestones**: M1 Threat Model · M2 Detection Concepts · M3 Security Event Logging
- **Stories**: S1 Threat Model Doc · S2 Telemetry Trust Architecture · S3 Replay Detection · S4 Security Checklist · S5 Security Event Log

## Progress Calculation

Progress is computed as: `approvedStories / totalStories × 100`

A story is "approved" when its status is `approved` or `released`.
