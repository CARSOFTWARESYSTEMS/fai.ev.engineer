# Daily Engineering Check-in Standard — Battery EOS

## Purpose

The daily check-in is the primary accountability mechanism for engineers working in the Battery EOS workspace. It must be submitted once per calendar day to unlock the Engineering workspace for that day.

## Check-in Gate Logic

```
Engineer logs in to /products/battery-intelligence
    │
    ├── useDailyCheckin() checks Firestore for today's check-in
    │       doc ID: {uid}_{YYYY-MM-DD}
    │
    ├── hasCheckedIn = false ──► Show DailyCheckinPanel (gate)
    │       Engineer fills in form and submits
    │       Check-in saved to Firestore
    │       Gate clears, workspace unlocks
    │
    └── hasCheckedIn = true  ──► Workspace shown directly
```

## Check-in Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `checkinId` | string | ✅ | Auto-generated Firestore doc ID |
| `uid` | string | ✅ | Firebase UID of the engineer |
| `userEmail` | string | ✅ | Engineer's email |
| `userName` | string | ✅ | Display name |
| `date` | string | ✅ | `YYYY-MM-DD` format |
| `organisationId` | string | — | Org context |
| `partnerId` | string | — | Partner context |
| `productKey` | string | ✅ | Always `battery_pm` |
| `workPackageId` | string | — | WP being worked on (optional) |
| `storyId` | string | — | Story being worked on (optional) |
| `yesterdayWork` | string | ✅ | Free-text: what was completed yesterday |
| `todayPlan` | string | ✅ | Free-text: what is planned today |
| `hasBlocker` | boolean | ✅ | Whether the engineer has a blocker |
| `blockerDescription` | string | — | Required if `hasBlocker` is true |
| `estimatedHoursToday` | number (1–8) | ✅ | Engineering hours planned |
| `submittedAt` | string | ✅ | ISO datetime of submission |
| `createdAt` | string | ✅ | ISO datetime |

## Firestore Schema

```
Collection: engineeringCheckins
  Document ID: {uid}_{YYYY-MM-DD}
  Fields: all EosDailyCheckin fields
```

The compound document ID (uid + date) ensures at most one check-in per engineer per day, with efficient lookup by `getTodayCheckin(uid)`.

## Visibility

| Role | Can See Own Check-in | Can See Team Check-ins |
|------|---------------------|----------------------|
| Engineer | ✅ (My Work tab) | ❌ |
| Manager / Owner | ✅ | ✅ (Team tab, today's check-ins) |
| Developer / Admin | ✅ | ✅ |
| Partner Admin | ✅ | ✅ |
| Inspector / Auditor / Viewer / Approver | ❌ | ❌ |

## Manager View

The Team tab's `ManagerDashboard` shows today's check-ins for the organisation. Blockers are highlighted in amber with a prompt to follow up.

## Non-Engineer Behaviour

Users who are not engineers (`access.isEngineer === false`) bypass the check-in gate entirely. The workspace is shown directly on load.
