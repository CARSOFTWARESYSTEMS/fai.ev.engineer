# FAI_ENGINEER_MASTER_PLAN_FINAL.md

# FAI.EV.ENGINEER — Final Master Development Plan

## Final Product Strategy

Build a reusable EV.ENGINEER SaaS Platform and implement FAI Toolkit as the first product.

```text
EV.ENGINEER Platform
│
├── Authentication
├── Subscription Engine
├── Product Key Engine
├── User Management
├── Analytics
├── Google Drive Integration
├── Theme Engine
├── Feature Flags
│
└── FAI Toolkit
      ├── Dashboard
      ├── Project Management
      ├── PDF Viewer
      ├── Ballooning
      ├── OCR (Sprint 2)
      ├── Feature Table
      ├── AS9102 Form 3
      ├── Form 1 (Phase 2)
      └── Form 2 (Phase 2)
```

## Domain

https://fai.ev.engineer

## Product Name

FAI Engineer

## Core Principles

- Web-only SaaS
- Browser-first PDF processing
- Firebase Hosting
- Firebase Authentication
- Firestore
- Google Drive Integration
- Multi-tenant using Product Keys
- Trial / Monthly / Annual subscription
- Do not copy Balloonist.io UI, branding, code, or content
- Build incrementally with verification after every phase

---

# Architecture

## Platform Layer

- Authentication
- Product Configuration
- Subscription Management
- User Profiles
- Analytics
- Feature Flags
- Google Drive Integration

## Application Layer

- Dashboard
- Project Management
- PDF Viewer
- Balloon Tool
- Feature Table
- Export Engine

## Future Layer

- OCR
- Dimension Parsing
- GD&T Parsing
- AI Characteristic Assistant
- Admin Portal
- Billing

---

# Product Key Design

Examples:

```text
https://fai.ev.engineer?pk=default
https://fai.ev.engineer?pk=customer-a
https://fai.ev.engineer?pk=airbus
```

Configurable:

- Product Name
- Theme
- Logo
- Pricing
- Feature Flags

---

# Subscription Plans

## Trial

7 Days

## Monthly

$29/month

## Annual

$299/year

Initial MVP can simulate subscriptions using Firestore.

---

# Project Versioning

Every project must contain:

```json
{
  "version": 1
}
```

Future:

- Revision A
- Revision B
- Revision C

---

# Audit Trail

Every significant action should be recorded.

Example:

```json
{
  "action": "BALLOON_CREATED",
  "timestamp": ""
}
```

---

# Feature Type Enumeration

```text
Linear
Diameter
Radius
Angle
Thread
GD&T
Datum
Surface Finish
Note
``

---

# 10-Day MVP Plan

## Day 1

Foundation

- React
- TypeScript
- Vite
- Tailwind
- Firebase Hosting
- Firestore
- Folder Structure
- README

Deliverable:

Running application

---

## Day 2

Authentication

- Email Login
- Google Login
- Forgot Password
- Protected Routes

Deliverable:

Secure login flow

---

## Day 3

Product Key Engine

- Theme Configuration
- Logo Configuration
- Feature Flags
- Pricing Configuration

Deliverable:

Multi-tenant platform

---

## Day 4

Subscription Engine

- Trial
- Monthly
- Annual

Deliverable:

Subscription Guard

---

## Day 5

Dashboard + Project Metadata

- Create Project
- Project List
- Open Project

Deliverable:

Project workflow

---

## Day 6

PDF Viewer

- Upload PDF
- Zoom
- Pan
- Navigation

Deliverable:

Drawing visible in browser

---

## Day 7

Balloon Tool

- Add
- Move
- Delete
- Renumber
- Leader Lines

Deliverable:

Manual ballooning complete

---

## Day 8

Feature Table

Columns:

- Feature Number
- Nominal
- Min
- Max
- Tolerance
- Units
- Type
- Comments

Deliverable:

Editable characteristic table

---

## Day 9

AS9102 Form 3

- Excel Export
- CSV Export

Deliverable:

Customer demo ready

---

## Day 10

Persistence

- Local Storage
- Google Drive
- Project JSON
- Deployment

Deliverable:

End-to-end MVP

---

# Sprint 2

Not part of first 10 days:

- OCR
- Dimension Parsing
- GD&T Parsing
- Form 1
- Form 2
- Billing
- Admin Portal
- Team Accounts
- AI Assistant

---

# Definition of MVP Success

User can:

1. Login
2. Create Project
3. Upload PDF
4. Add Balloons
5. Maintain Feature Table
6. Export AS9102 Form 3
7. Save and Reload Project

---

# Definition of Production V1

Everything in MVP plus:

- OCR
- Form 1
- Form 2
- Billing
- Admin Portal
- Team Accounts
- Audit History
- Version History

---

# Session Tracking Template

Current Phase:

```text
Day X
```

Completed:

```text
✅ Day 1
✅ Day 2
```

In Progress:

```text
🚧 Current Day
```

Next:

```text
Day N
```

---

# Standard Verification Checklist

## Build

- npm install
- npm run dev
- npm run build

## Security

- No secrets committed
- Environment variables configured
- Firestore rules validated

## UX

- Desktop verified
- Mobile verified

## Functionality

- Happy path tested
- Error path tested

## Documentation

- README updated
- Master Plan updated

## Git

- Commit completed
- Meaningful commit message

---

# Final Rule

Build small.
Verify.
Commit.
Then move to the next phase.

The first success milestone:

A user logs in, creates a project, uploads a PDF, places balloons, creates features, and exports AS9102 Form 3.


# FAI Engineer - Known Limitations & Technical Debt Register

## PDF Viewer Foundation

### PDF-001

Issue:
iOS Safari fullscreen is not supported.

Impact:
Fullscreen button may do nothing on iOS Safari.

Status:
Accepted limitation.

Future:
Provide iOS-specific fullscreen fallback.

---

### PDF-002

Issue:
PDF.js increases bundle size by approximately 1 MB.

Impact:
Larger initial application load.

Status:
Accepted limitation.

Future:
Lazy load PDF Viewer route using React.lazy().

---

### PDF-003

Issue:
Direct navigation to PDF page may trigger Google Drive OAuth popup.

Impact:
Popup blockers can interfere with authentication.

Status:
Accepted limitation.

Future:
Improve token acquisition flow.

---

## Ballooning Foundation

### BAL-001

Issue:
Deleting Balloon #2 from [1,2,3] results in [1,3].

Impact:
Number gaps remain.

Status:
Out of scope.

Future:
Implement renumbering tool.

---

### BAL-002

Issue:
Balloon numbering is client-side.

Impact:
Two users could create duplicate numbers.

Status:
Not relevant for single-user MVP.

Future:
Server-side numbering.

---

### BAL-003

Issue:
Mobile scrolling and balloon placement share touch gestures.

Impact:
Users may accidentally place balloons while scrolling.

Status:
Accepted limitation.

Future:
Separate placement mode from scrolling mode.

---

### BAL-004

Issue:
No collaborative editing.

Impact:
Single-user ownership model only.

Status:
Accepted.

Future:
Team collaboration.

---

## Feature Table Foundation

### FT-001

Issue:
Deleting a balloon does not delete linked feature rows.

Impact:
Orphaned feature records remain.

Status:
Known limitation.

Future:
Cascade delete or warning dialog.

Priority:
High

---

### FT-002

Issue:
Features are stored separately from balloons.

Impact:
Link integrity depends on balloonId.

Status:
Acceptable architecture.

Future:
Add validation and cleanup tools.

---

### FT-003

Issue:
Feature table does not export anywhere yet.

Impact:
Data remains internal.

Status:
Expected.

Future:
AS9102 Form 3 Export.

---

## Firestore

### FS-001

Issue:
Firestore rules must be manually published.

Impact:
Local rule changes do not automatically become active.

Status:
Operational process.

Future:
CI/CD deployment pipeline.

---

### FS-002

Issue:
Firebase CLI deployment blocked for some accounts.

Impact:
Rules may require Console publishing.

Status:
Known environment issue.

Future:
Grant proper Firebase permissions.

---

## MVP Scope Items Not Yet Implemented

### MVP-001

Leader Lines

Status:
Not started.

---

### MVP-002

Balloon Renumbering

Status:
Not started.

---

### MVP-003

Multi-Select Balloons

Status:
Not started.

---

### MVP-004

AS9102 Form 3 Export

Status:
Not started.

---

### MVP-005

Project Revisioning

Status:
Not started.

---

### MVP-006

Audit History

Status:
Not started.

---

### MVP-007

Team Collaboration

Status:
Not started.

---

### MVP-008

OCR

Status:
Explicitly deferred.

---

### MVP-009

Dimension Parsing

Status:
Explicitly deferred.

---

### MVP-010

GD&T Parsing

Status:
Explicitly deferred.

---

### MVP-011

AI Characteristic Extraction

Status:
Explicitly deferred.

---

## Architecture Decisions To Preserve

1. Browser-first PDF processing.
2. Google Drive used for PDF storage.
3. Firestore used for metadata only.
4. Balloon coordinates stored as normalized percentages.
5. Balloons and Features stored in separate collections.
6. Single-user ownership model for MVP.
7. OCR and AI features excluded from MVP.
8. Incremental delivery approach.
