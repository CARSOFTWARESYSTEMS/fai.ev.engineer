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
