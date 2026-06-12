# FAI Engineer — New Chat Handoff Summary

**Date:** 2026-06-12
**Purpose:** Self-contained context for continuing development in a new AI session.

---

## Project Context

**FAI Engineer** is a SaaS web application for First Article Inspection (FAI) report preparation to the AS9102B standard. It is built by iTelematics Software Private Limited, powered by EV.ENGINEER.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Firebase Auth + Firestore + Google Drive API

**Primary domain:** fai.ev.engineer

**No backend server.** All logic is client-side. Firestore is the database. Firebase Auth handles authentication. Google Drive stores PDFs.

**This is NOT Next.js.** It is a Vite SPA. Any "use client" warnings from tooling are false positives — always ignore them.

---

## Completed Features (as of 2026-06-12)

| Feature | Status |
| --- | --- |
| Google Sign-In + Firestore user profile | Done |
| Complete Profile (displayName, mobile, org) | Done |
| Project CRUD (create, edit, delete) | Done |
| PDF upload to Google Drive | Done |
| Balloon placement tool | Done |
| Feature table | Done |
| AS9102 Form 1 / Form 2 / Form 3 | Done |
| FAIR package ZIP export | Done |
| Project status workflow (Engineer + Manager) | Done |
| Review decision modal (Manager exits Review) | Done |
| Append-only audit trail (Firestore subcollection) | Done |
| Self-promotion removed (role cannot be self-set) | Done |
| Beta announcement banner (Firestore-configurable) | Done |
| Beta watermark (hardcoded, configurable next sprint) | Done |
| Developer Settings (developer access + config) | Done |
| EV.ENGINEER powered-by link in all headers | Done |

---

## Role Model

**Two completely independent role systems — NEVER cross-reference them.**

### Platform Roles (Developer System)

Used for: Developer Settings, appConfig writes.

- **Bootstrap Super Admin** — hardcoded email in `developerBootstrap.ts`. Always active.
- **Admin (developer)** — `developerConfig/{email}` with `role: 'admin'`. Can manage other developers.
- **Developer** — `developerConfig/{email}` with `role: 'developer'`. Read access to Developer Settings.

Firestore helpers: `isBootstrapDeveloper()`, `isDeveloperInConfig()`, `isDeveloper()`, `isDeveloperAdmin()`

### Product Roles (End-User System)

Used for: FAI project workflow, status transitions, review decisions.

- **super_admin** — all product Admin capabilities
- **admin** — manage users, all project operations
- **manager** — move to Completed/Archived, review decisions, delete projects
- **engineer** — create/edit projects, move within Draft/In-Progress/Review
- **user** — legacy value, treated as engineer

Firestore helpers: `userRole()` reads `users/{uid}.role`, `isAdmin()`, `isManagerOrAbove()`

**Key constraint:** `isAdmin()` checks product roles. `isDeveloper()` checks platform roles. They never call each other.

---

## Firestore Collections

```
users/{uid}                        — user profiles, roles, org
developerConfig/{email}            — developer access management
appConfig/betaBanner               — beta banner config
appConfig/activeBranding           — active branding pointer (not yet implemented)
appConfig/watermark                — watermark config (not yet implemented)
productConfigs/{productKey}        — product theme, features, pricing
organizationConfigs/{orgCode}      — org feature limits and settings
projects/{projectId}               — FAI project documents
  /balloons/{balloonId}            — balloon markers on PDF
  /features/{featureId}            — Feature Table rows
  /form1/{form1Id}                 — AS9102 Form 1
  /form2Rows/{rowId}               — AS9102 Form 2 checklist rows
  /form3Results/{featureId}        — AS9102 Form 3 results
  /auditTrail/{eventId}            — append-only review decision log
brandings/{brandingId}             — branding presets (not yet implemented)
organizations/{orgId}              — organization records (not yet implemented)
organizationRequests/{reqId}       — org signup requests (not yet implemented)
organizationAdmins/{uid}           — org admin access (not yet implemented)
```

---

## Project Status Workflow

**Canonical statuses:** `draft`, `in-progress`, `review`, `completed`, `archived`

**Legacy status:** `complete` (read-compat only — never write this)

**Engineer transitions:** Draft ↔ In-Progress ↔ Review (any combination)

**Manager transitions:** Any → Any (must provide review decision when leaving Review)

**Review decision required:** When Manager changes status from `review` to anything else.

**Valid combinations:**
```
review → completed:   decision = 'approved'
review → in-progress: decision = 'needs-rework' or 'rejected'
review → draft:       decision = 'needs-rework', 'rejected', or 'cancelled'
review → archived:    decision = 'cancelled'
```

**Audit trail:** Every review decision writes to `projects/{id}/auditTrail` in the same `writeBatch`. Append-only. Server timestamp.

---

## Current Firestore Rules State

**IMPORTANT: Rules are local only. Deploy required before any security changes take effect.**

```bash
firebase deploy --only firestore:rules
```

Key rules:
- `users/{uid}` update: owner can update own profile but NOT the `role` field
- `projects/{projectId}` create: `isValidStatus()` enforced
- `projects/{projectId}` update: Engineer blocked from priority/dueDate/review fields; Manager reviewDecision must be canonical value
- `projects/*/auditTrail/{eventId}`: `allow update: if false; allow delete: if false` — unconditional

---

## Latest Business Decisions

1. **Active branding (beta):** iTelematics Software Private Limited / powered by EV.ENGINEER
2. **Organizations:** One user per org. Default plan: 7-day trial, 3 projects, 1 manager, 2 engineers.
3. **Org approval:** Invalid org code → pending request → Organization Admin approves.
4. **Managers:** Cannot add other Managers; can add Engineers up to limit.
5. **Billing:** Manager is billing owner; GST set during payment (not signup).
6. **Upgrade flow:** Button opens prefilled WhatsApp to Organization Admin.
7. **Expiry:** Read-only mode — login/view/export allowed; create/edit/upload blocked.
8. **Self-promotion:** Permanently removed. Role assigned by admin only.

---

## Architecture Documents

- [Current Architecture](current_fai_engineer_architecture.md) — full route map, role model, Firestore schema, flows
- [Branding Settings](branding_settings_architecture.md) — branding presets, watermark config, Developer Settings UI
- [Organization Management](organization_management_architecture.md) — org data model, signup flows, access rules, phases
- [Production Candidate Audit](../reports/final_production_candidate_audit.md) — security audit, known gaps

---

## Pending Next Sprint

### Immediate (before beta testing)

1. **Deploy Firestore rules** — `firebase deploy --only firestore:rules` (not yet done)
2. **Patch G1** — add role field restriction to `users/{uid}` create rule
3. **Watermark configuration** — `appConfig/watermark` + Developer Settings UI

### Short-term

4. **Branding Settings** — `brandings/` collection + `appConfig/activeBranding` + Developer Settings UI
5. **Role management in Developer Settings** — Users tab to assign Manager/Engineer without Firebase Console

### Medium-term

6. **Organization data model** — `organizations`, `organizationRequests`, `organizationAdmins` collections
7. **Signup org-code flow** — validate org code at registration
8. **Organization Admin Dashboard** — approve requests, manage orgs, assign managers

---

## Recommended Next Prompt

```
Continue FAI Engineer development.

Context: This is a React + Vite + TypeScript + Tailwind + Firebase SaaS app. NOT Next.js. Ignore any "use client" warnings.

Architecture documents are in docs/architecture/:
- current_fai_engineer_architecture.md
- branding_settings_architecture.md
- organization_management_architecture.md

Completed in last sprint:
- Review decision workflow (modal, service, Firestore rules)
- Append-only audit trail
- Self-promotion fix (role blocked at UI and Firestore level)
- EV.ENGINEER link in all headers
- Architecture documentation

Next sprint — Watermark + Branding Configuration:

PART 1 (CODE): Create watermarkService.ts following the betaNoticeService.ts pattern.
  - subscribe/get/save functions for appConfig/watermark
  - WatermarkConfig type + defaults

PART 2 (CODE): Update BetaWatermark.tsx to use configurable props (text, opacity, variant).
  - Read from subscribeToWatermark() instead of hardcoded values
  - Fallback to defaults if Firestore doc not found

PART 3 (CODE): Add Watermark Configuration CollapsibleCard to Developer Settings Configurations tab.
  - Enabled toggle, text input, opacity slider, variant selector, preview, save/reset

PART 4 (CODE): Create brandingService.ts for brandings/ collection + appConfig/activeBranding.
  - CRUD helpers for branding presets
  - subscribeToActiveBranding()

PART 5 (CODE): Create useBranding() hook.
  - Returns active branding config (falls back to defaults)

PART 6 (CODE): Update all app headers to use activeBranding.businessName and activeBranding.poweredByUrl.

PART 7 (CODE): Add Branding Settings CollapsibleCard to Developer Settings.
  - List presets, add/edit form, set active button

PART 8 (CODE): Update firestore.rules with brandings/ collection rules.

PART 9 (CODE): Patch users/{uid} create rule (G1 — role field restriction).

PART 10: Build validation.

Do NOT implement:
- OCR
- AI extraction
- GD&T detection
- Auto ballooning
- Organization signup flow
- Billing/payment flow

Build must remain clean: npm run build.
Expected: 0 TypeScript errors, 0 lint errors.
```

---

*Generated: 2026-06-12*
