# FAI Engineer — Current Architecture

**Date:** 2026-06-12
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Firebase (Auth + Firestore) + Google Drive API
**Deployment target:** fai.ev.engineer

---

## 1. Application Overview

FAI Engineer is a SaaS web application for First Article Inspection (FAI) report preparation to the AS9102B standard. It allows engineering teams to annotate technical drawings with balloon markers, capture dimensional measurement results, and generate structured AS9102 form packages for submission to customers or auditors.

### Core Capabilities

| Capability | Status | Description |
| --- | --- | --- |
| **Balloon Drawing** | Implemented | Place numbered balloon markers on PDF drawings. Balloons link to features in the Feature Table. |
| **Feature Table** | Implemented | Structured list of drawing characteristics (dimension, tolerance, type). One feature per balloon. |
| **AS9102 Form 1** | Implemented | Part/drawing identification form. Saved per project, exportable to XLSX. |
| **AS9102 Form 2** | Implemented | Design documentation / authority checklist. Saved per project, exportable to XLSX. |
| **AS9102 Form 3** | Implemented | Dimensional/functional results entry per feature. Measurement values against tolerances. Exportable to XLSX. |
| **FAIR Package Export** | Implemented | ZIP containing ballooned drawing PDF + Form 1/2/3 XLSX + Features XLSX. |
| **Review Decision Workflow** | Implemented | Manager must provide a formal decision and comment when moving a project out of Review status. |
| **Audit Trail** | Implemented (v1) | Append-only Firestore subcollection recording every review decision event. |
| **Google Drive integration** | Implemented | Source PDFs are stored in user's Google Drive under `FAI.EV.ENGINEER/{uid}/{projectId}/`. |
| **Beta banner** | Implemented | Configurable announcement banner controlled from Developer Settings. |
| **Beta watermark** | Implemented | Fixed overlay watermark on dashboard/projects/PDF editor. |

---

## 2. Route Map

### Public Routes (no authentication required)

| Route | File | Purpose |
| --- | --- | --- |
| `/` | [LandingPage.tsx](../../src/pages/LandingPage.tsx) | Marketing landing page with features, pricing, FAQ |
| `/login` | [LoginPage.tsx](../../src/pages/LoginPage.tsx) | Google Sign-In entry point |
| `/register` | [LoginPage.tsx](../../src/pages/LoginPage.tsx) | Same component as `/login`; CTA text differs |
| `/roadmap` | [RoadmapPage.tsx](../../src/pages/RoadmapPage.tsx) | Public product roadmap |
| `/Fortius` | [FortiusPage.tsx](../../src/pages/FortiusPage.tsx) | Partner landing page (Fortius Machining Solutions) |
| `/fortius/*` | [pages/fortius/](../../src/pages/fortius/) | Fortius service sub-pages (CNC, aerospace, etc.) |

### Auth Flow Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/complete-profile` | [CompleteProfilePage.tsx](../../src/pages/CompleteProfilePage.tsx) | Profile completion after first Google sign-in. Collects: displayName, mobile, org code, org name. Sets `profileCompleted = true` in Firestore. |

### Protected Routes (require Firebase auth + `profileCompleted === true`)

| Route | File | Purpose | Data loaded | Role requirement |
| --- | --- | --- | --- | --- |
| `/dashboard` | [DashboardPage.tsx](../../src/pages/DashboardPage.tsx) | Project list with stats, filters, kanban/table view. Quick actions: create, edit, delete. | `getUserProjects(uid)` — all projects for authenticated user | Any authenticated user |
| `/projects` | [ProjectsPage.tsx](../../src/pages/ProjectsPage.tsx) | Alternative project list view | `getUserProjects(uid)` | Any authenticated user |
| `/projects/new` | [CreateProjectPage.tsx](../../src/pages/CreateProjectPage.tsx) | Create a new FAI project. Collects name, customer, part number, material, etc. Sets status=draft. | None (create only) | Any authenticated user |
| `/projects/:projectId` | [ProjectDetailPage.tsx](../../src/pages/ProjectDetailPage.tsx) | Project metadata summary + PDF status + links to all forms + review decision display. | `getProjectById(projectId)` | Project owner or Manager+ |
| `/projects/:projectId/edit` | [EditProjectPage.tsx](../../src/pages/EditProjectPage.tsx) | Edit project metadata + status transition. Manager: full. Engineer: limited fields. | `getProjectById(projectId)` | Project owner (Engineer or Manager) |
| `/projects/:projectId/pdf` | [ProjectPdfViewerPage.tsx](../../src/pages/ProjectPdfViewerPage.tsx) | Full PDF workspace: viewer, balloon tool, feature table, Form 1/2/3, exports. | Project + all subcollections (balloons, features, form1, form2Rows, form3Results) | Project owner |
| `/profile` | [ProfilePage.tsx](../../src/pages/ProfilePage.tsx) | View/edit display name, mobile, org details. Read-only role display. | Current `user` from auth context | Any authenticated user |
| `/developer-settings` | [DeveloperSettingsPage.tsx](../../src/pages/DeveloperSettingsPage.tsx) | Developer access management + app config (beta banner). | `developerConfig` real-time subscription | Developer role only (platform) |

---

## 3. Role Model

There are **two completely independent role systems** in this application. They share no data, no helpers, and no Firestore paths.

### 3.1 Platform Roles (Developer System)

Used to control access to Developer Settings and appConfig writes. This is an internal engineering tool, not visible to end users.

| Role | Mechanism | Capabilities |
| --- | --- | --- |
| **Bootstrap Super Admin** | Hardcoded email list in `developerBootstrap.ts` + `isBootstrapDeveloper()` Firestore helper | All developer + admin capabilities. Always active. Cannot be disabled. |
| **Admin (developer)** | `developerConfig/{email}` with `role: 'admin'` | Can add/remove/enable/disable other developers. Can change developer roles. Can write appConfig. |
| **Developer** | `developerConfig/{email}` with `role: 'developer'` | Can access Developer Settings (read). Can update own non-role fields in developerConfig. Can write appConfig. Cannot manage other developers. |

**Relevant helpers (firestore.rules):**
- `isBootstrapDeveloper()` — checks Firebase Auth token email against hardcoded list
- `isDeveloperInConfig()` — checks `developerConfig/{email}.enabled === true`
- `isDeveloper()` — either of the above
- `isDeveloperAdmin()` — bootstrap OR (in config + enabled + role === 'admin')

**Key files:**
- [src/config/developerBootstrap.ts](../../src/config/developerBootstrap.ts)
- [src/services/developerConfigService.ts](../../src/services/developerConfigService.ts)
- [src/services/useDeveloperAccess.ts](../../src/services/useDeveloperAccess.ts)

### 3.2 Product Roles (End-User System)

Used to control the FAI project workflow: who can create projects, transition statuses, approve work, delete, etc.

| Role | UserRole value | Where set | Capabilities |
| --- | --- | --- | --- |
| **Super Admin** | `'super_admin'` | Firebase Console or Admin SDK | Everything an Admin can do |
| **Admin** | `'admin'` | Firebase Console or Admin SDK | Manage users, all project operations |
| **Manager** | `'manager'` | Admin only (self-promotion removed) | Set priority/due date, move project to Completed/Archived, provide review decisions, delete projects |
| **Engineer** | `'engineer'` | Default on registration | Create projects, edit basic metadata, move between Draft/In-Progress/Review |
| **User** (legacy) | `'user'` | Pre-existing accounts | Treated as Engineer in current code |

**Role helpers (firestore.rules):**
- `userRole()` — reads `users/{uid}.role` from Firestore
- `isAdmin()` — `userRole() in ['admin', 'super_admin']`
- `isManagerOrAbove()` — `userRole() in ['admin', 'super_admin', 'manager']`

**Key files:**
- [src/auth/AuthTypes.ts](../../src/auth/AuthTypes.ts) — `UserRole` type, `EVEngineerUser` interface
- [src/auth/EVEngineerAuthService.ts](../../src/auth/EVEngineerAuthService.ts) — `getUserProfile`, `updateUserProfile`

### 3.3 Role Matrix

| Action | Engineer | Manager | Admin / Super Admin | Developer (platform) |
| --- | --- | --- | --- | --- |
| Create project | ✅ | ✅ | ✅ | — |
| Edit basic project metadata | ✅ | ✅ | ✅ | — |
| Set priority / due date | ✗ | ✅ | ✅ | — |
| Move to In-Progress / Review | ✅ | ✅ | ✅ | — |
| Move to Completed (requires review decision) | ✗ | ✅ | ✅ | — |
| Move to Archived (requires review decision) | ✗ | ✅ | ✅ | — |
| Provide review decision + comment | ✗ | ✅ | ✅ | — |
| Write review metadata fields | ✗ | ✅ | ✅ | — |
| Delete project | ✗ | ✅ | ✅ | — |
| View own projects | ✅ | ✅ | ✅ | — |
| View all projects | ✗ | ✅ | ✅ | — |
| Edit own profile (non-role fields) | ✅ | ✅ | ✅ | — |
| Change own role | ✗ | ✗ | ✗ | — |
| Assign/change other users' roles | ✗ | ✗ | ✅ | — |
| Access Developer Settings | ✗ | ✗ | ✗ | ✅ |
| Write appConfig / betaBanner | ✗ | ✗ | ✗ | ✅ |
| Write productConfigs | ✗ | ✗ | ✅ | ✗ |
| Write organizationConfigs | ✗ | ✗ | ✅ | ✗ |
| Add/remove developers | ✗ | ✗ | ✗ | Admin developer only |

---

## 4. Firestore Collections

### 4.1 `users/{userId}`

**Document ID:** Firebase Auth UID

**Shape:**
```ts
{
  uid: string
  displayName: string
  email: string
  photoURL: string
  mobileNumber: string
  organizationCode: string      // e.g. 'itelematics'
  organizationName: string
  gstNumber: string
  role: 'engineer' | 'manager' | 'admin' | 'super_admin' | 'user'
  profileCompleted: boolean
  subscriptionPlan: 'trial' | 'monthly' | 'annual'
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt: Timestamp
}
```

**Rules:**
- Read: own doc or `isAdmin()`
- Create: own doc only
- Update: own doc (role field blocked) or `isAdmin()` (unrestricted)
- Delete: `isAdmin()` only

**Purpose:** Holds all user identity, contact, org association, role, and subscription state.

---

### 4.2 `developerConfig/{email}`

**Document ID:** Developer email address

**Shape:**
```ts
{
  email: string
  displayName: string
  role: 'developer' | 'admin'
  enabled: boolean
  addedBy: string    // email of admin who added
  addedAt: Timestamp
  updatedAt: Timestamp
}
```

**Rules:**
- Read: self-read always; any developer can read all entries
- Create: `isDeveloperAdmin()` only; email field must match document ID
- Update: admin developer (any field) or developer (own entry, cannot change role/enabled)
- Delete: `isDeveloperAdmin()` only

**Purpose:** Manages the list of authorised developers for Developer Settings access.

---

### 4.3 `appConfig/{document}`

**Documents:**
- `appConfig/betaBanner` — beta notice config (enabled, title, message, severity, dismissible, nonce, updatedAt)

**Rules:**
- Read: any authenticated user
- Write: any developer (platform role)

**Purpose:** Runtime configuration that is pushed to all connected clients via Firestore real-time listeners. No app restart required for config changes.

---

### 4.4 `productConfigs/{productKey}`

**Document ID:** Product key, e.g. `'fai'`

**Shape:** See `ProductConfig` in [productConfig.types.ts](../../src/config/productConfig.types.ts)

Includes: productName, brandName, domain, theme (colours), pricing (trialDays, monthly/annual price), features (per-key boolean), isActive.

**Rules:**
- Read: any authenticated user
- Write: `isAdmin()` (product Admin/Super Admin)

**Purpose:** Defines product-level branding, theme, and feature availability. Read at startup by `ProductConfigProvider`.

---

### 4.5 `organizationConfigs/{organizationCode}`

**Document ID:** Organization code slug, e.g. `'itelematics'`

**Shape:** See `OrganizationConfig` in [productConfig.types.ts](../../src/config/productConfig.types.ts)

Includes: organizationCode, organizationName, productKey, gstNumber, plan, status (active/inactive/suspended), enabledFeatures (per-key boolean), limits (maxProjects, maxUsers, maxExportsPerMonth), settings (defaultDueDays).

**Rules:**
- Read: any authenticated user
- Write: `isAdmin()` only

**Purpose:** Per-organization feature overrides and usage limits. Loaded by `ProductConfigProvider` using `user.organizationCode`.

---

### 4.6 `projects/{projectId}`

**Document ID:** Auto-generated Firestore ID

**Shape (abridged):**
```ts
{
  projectId: string
  uid: string              // owner Firebase UID
  productKey: string
  organizationCode: string
  organizationName: string
  projectName: string
  customerName: string
  partNumber: string
  partName: string
  drawingNumber: string
  drawingRevision: string
  material: string
  description: string
  status: 'draft'|'in-progress'|'review'|'completed'|'archived'
  version: number
  priority?: 'low'|'medium'|'high'|'critical'
  dueDate?: Timestamp
  pdfStatus?: 'none'|'uploaded'
  sourcePdfName: string
  sourcePdfSize?: number
  googleDriveFileId: string
  googleDriveViewUrl?: string
  googleDriveProjectFolderId?: string
  reviewDecision?: 'approved'|'rejected'|'cancelled'|'needs-rework'
  reviewComment?: string
  reviewedBy?: string      // uid
  reviewedAt?: Timestamp
  completedAt?: Timestamp
  completedBy?: string     // uid
  archivedAt?: Timestamp
  archivedBy?: string      // uid
  createdAt: Timestamp
  updatedAt: Timestamp
  updatedBy: string        // uid
}
```

**Rules:**
- Read: project owner or `isManagerOrAbove()`
- Create: project owner; status must be canonical; `isValidStatus()` enforced
- Update: Manager+ (any field, canonical status only) or Engineer-owner (limited fields, status within draft/in-progress/review only)
- Delete: `isManagerOrAbove()` only

---

### 4.7 `projects/{projectId}/balloons/{balloonId}`

**Shape:**
```ts
{
  id: string
  number: number           // balloon number (1-N)
  x: number                // normalised 0–1 position on PDF
  y: number
  page: number             // PDF page index (0-based)
  type: 'circle'|'filled-arrow'|...
  createdBy: string        // uid
  createdAt: Timestamp
}
```

**Rules:** Project owner only (read/create/update/delete). Creator must match `uid()` on create.

---

### 4.8 `projects/{projectId}/features/{featureId}`

**Shape:**
```ts
{
  id: string
  balloonNumber: number
  characteristicType: string
  nominalValue: string
  upperTolerance: string
  lowerTolerance: string
  unit: string
  gaugeType: string
  notes?: string
  createdBy: string
  createdAt: Timestamp
}
```

**Rules:** Project owner only.

---

### 4.9 `projects/{projectId}/form1/{form1Id}`

**Shape:** Corresponds to `Form1Data` type. All AS9102 Form 1 fields (partNumber, partName, drawingNumber, drawingRevision, fairIdentifier, supplier, contractNumber, etc.).

**Rules:** Project owner only.

---

### 4.10 `projects/{projectId}/form2Rows/{rowId}`

**Shape:** Corresponds to `Form2Row` type. Individual checklist rows for the AS9102 Form 2 design documentation checklist.

**Rules:** Project owner only.

---

### 4.11 `projects/{projectId}/form3Results/{featureId}`

**Shape:** Corresponds to `Form3Row` type. Measurement result per feature (balloon number, actual measurement, pass/fail status, notes).

**Rules:** Project owner only.

---

### 4.12 `projects/{projectId}/auditTrail/{eventId}`

**Document ID:** Auto-generated Firestore ID

**Shape:**
```ts
{
  eventType: 'review_decision'
  fromStatus: string       // always 'review'
  toStatus: string
  decision: 'approved'|'rejected'|'cancelled'|'needs-rework'
  comment: string          // reviewer comment, min 5 chars
  changedBy: string        // uid
  changedAt: Timestamp     // serverTimestamp()
  role: UserRole
  projectId: string
}
```

**Rules:**
- Read: authenticated project owner or Manager+
- Create: Manager+ only
- Update: **never** (`if false`)
- Delete: **never** (`if false`)

**Purpose:** Tamper-proof audit log. Written atomically with the project status change in a `writeBatch`. Server timestamp prevents client-side time forgery.

---

## 5. Workflow Flows

### 5.1 Login / Profile Creation

```
User visits /login
  → clicks "Sign in with Google"
  → Firebase signInWithPopup
  → onAuthStateChanged fires
  → getUserProfile(uid) — reads users/{uid}
    if exists → set user in context → route to /dashboard
    if missing → route to /complete-profile
  → CompleteProfilePage:
    user fills displayName, mobile, orgCode, orgName
    → EVEngineerAuthService.completeProfile()
    → setDoc(users/{uid}, { role: 'engineer', profileCompleted: true, ... })
    → refreshProfile() in context
    → navigate to /dashboard
```

### 5.2 Project Creation

```
User at /projects/new
  → fills form (name, customer, part#, material, status=draft)
  → createProject(data, uid, user)
  → setDoc(projects/{newId}, { uid, status:'draft', version:1, updatedAt, ... })
  → navigate to /projects/{newId}
```

### 5.3 PDF Upload

```
ProjectDetailPage → "Upload PDF" button
  → Google Drive OAuth (if not already authenticated)
  → reads file from device
  → creates Drive folder: FAI.EV.ENGINEER/{uid}/{projectId}/
  → uploads PDF to Drive → gets fileId + viewUrl
  → updateDoc(projects/{projectId}, { googleDriveFileId, pdfStatus:'uploaded', sourcePdfName, ... })
  → reloads project
```

### 5.4 Balloon Placement (PDF workspace)

```
/projects/:id/pdf → PdfViewerPage
  → loads PDF from Google Drive (blob URL)
  → render pages on HTML Canvas via pdf.js
  → user clicks on canvas in "Place Balloon" mode
  → normalised (x, y, page) calculated
  → addDoc(projects/{id}/balloons, { number, x, y, page, createdBy, ... })
  → BalloonLayer re-renders new marker on canvas
```

### 5.5 Feature Creation

```
Feature Table panel (PDF workspace)
  → "Add Feature" → FeatureEditor form
  → user fills characteristic type, nominal, tolerances, gauge
  → addDoc(projects/{id}/features, { ... })
  → feature appears in table, balloon number visible on PDF
```

### 5.6 Form 1 Save

```
Form1Panel (PDF workspace)
  → user edits fields (partNumber, drawingRevision, supplier, ...)
  → auto-save or manual save
  → form1Service.saveForm1(projectId, data)
  → setDoc(projects/{id}/form1/main, { ...form1Data })
```

### 5.7 Form 2 Save

```
Form2Panel (PDF workspace)
  → user checks/unchecks checklist items
  → form2Service.saveForm2Rows(projectId, rows)
  → batch writes to projects/{id}/form2Rows
```

### 5.8 Form 3 Save

```
Form3Panel (PDF workspace)
  → user enters actual measurement values per feature
  → form3Service.saveForm3Result(projectId, featureId, result)
  → setDoc(projects/{id}/form3Results/{featureId}, { ... })
```

### 5.9 FAIR Package Export

```
ExportActions panel → "Export FAIR Package"
  → FairPackageModal opens (shows checklist of included items)
  → user confirms
  → fairPackageExportService.exportFairPackage({ form1, form2Rows, form3Rows, features, balloons, pdfBlobUrl })
    1. Fetch PDF from Drive blob URL
    2. createBalloonedPdf(pdfBuffer, balloons, form3Status) — draws balloon circles on PDF
    3. buildForm1WorkbookBytes → Form1.xlsx
    4. buildForm2WorkbookBytes → Form2.xlsx
    5. buildForm3WorkbookBytes → Form3.xlsx
    6. buildFeaturesWorkbookBytes → Features.xlsx
    7. JSZip.generateAsync → FAIR_Package_{part}_{fair}.zip
    8. Trigger browser download
```

### 5.10 Review Decision Flow

```
Engineer: moves project to 'review' (Edit Project)
  → no gate, saves immediately

Manager: opens Edit Project, changes status from 'review' to 'completed'
  → handleSave intercepts
  → shows ReviewDecisionModal (decision + comment)
  → Manager selects 'Approved', writes comment
  → handleReviewConfirm → doSave(decision='approved', comment)
  → updateProject() in service:
    1. getDoc(project) → currentStatus = 'review'
    2. validates: decision='approved' valid for target='completed' ✅
    3. sets patch: reviewDecision, reviewComment, reviewedBy, reviewedAt, completedAt, completedBy
    4. needsAuditEvent = true
    5. writeBatch: update project + setDoc auditTrail event (atomic)
  → project shows as 'Completed'
  → audit trail record written (immutable)
```

### 5.11 Beta Banner Configuration

```
Developer Settings → Configurations tab → Banner Configuration
  → getBetaNotice() loads from appConfig/betaBanner
  → user edits title, message, severity, dismissible
  → saveBetaNotice(config):
    → setDoc(appConfig/betaBanner, { ...config, nonce: randomUUID(), updatedAt })
  → subscribeToBetaNotice() triggers on all open sessions
  → BetaTestingBanner re-renders with new config live
```

### 5.12 Developer Settings Access

```
User navigates to /developer-settings
  → useDeveloperAccess() hook runs:
    if email in BOOTSTRAP_DEVELOPER_EMAILS → isDeveloper=true, isBootstrap=true
    else getDoc(developerConfig/{email}):
      if exists && enabled → isDeveloper=true
      if role==='admin' → isDeveloperAdmin=true
  → if !isDeveloper → <AccessDenied /> rendered
  → else → DeveloperSettingsPage rendered
```

---

## 6. Export Architecture

All exports are **client-side only** (no server-side rendering). No watermarks appear in exported files.

| Export | Format | Library | File |
| --- | --- | --- | --- |
| Ballooned Drawing PDF | PDF | pdf-lib | [balloonedPdfExportService.ts](../../src/features/export/services/balloonedPdfExportService.ts) |
| Feature Table | XLSX | xlsx (SheetJS) | [excelExportService.ts](../../src/features/export/services/excelExportService.ts) |
| Form 1 | XLSX | xlsx | [form1ExportService.ts](../../src/features/as9102/services/form1ExportService.ts) |
| Form 2 | XLSX | xlsx | [form2ExportService.ts](../../src/features/as9102/services/form2ExportService.ts) |
| Form 3 | XLSX | xlsx | [form3ExportService.ts](../../src/features/as9102/services/form3ExportService.ts) |
| FAIR Package | ZIP (all of above) | jszip | [fairPackageExportService.ts](../../src/features/export/services/fairPackageExportService.ts) |

**Ballooned PDF pipeline:**
1. Fetch original PDF from Google Drive blob URL
2. Load with `pdf-lib` (PDFDocument.load)
3. For each balloon: draw circle + number at normalised (x,y) → absolute coordinates based on page dimensions
4. Colour-coded by Form 3 status (pass/fail/measured)
5. Save and trigger browser download

**FAIR Package structure:**
```
FAIR_Package_{partNumber}_{fairIdentifier}.zip
  Ballooned_Drawing.pdf
  Form1.xlsx
  Form2.xlsx
  Form3.xlsx
  Features.xlsx
  Certificates/       (empty placeholder)
  Supplier_FAIRs/     (empty placeholder)
  Attachments/        (empty placeholder)
```

---

## 7. Security Architecture

### Firestore Rule Helpers

| Function | Reads Firestore | Purpose |
| --- | --- | --- |
| `isAuth()` | No | Request has a valid Firebase Auth token |
| `uid()` | No | Current user's Firebase UID |
| `isOwner(uid)` | No | Request UID matches provided UID |
| `userRole()` | Yes — `users/{uid}` | Reads product role from users collection |
| `isAdmin()` | Via `userRole()` | Product admin gate |
| `isManagerOrAbove()` | Via `userRole()` | Project workflow gate |
| `isProjectOwner(pid)` | Yes — `projects/{pid}` | Subcollection ownership check |
| `isBootstrapDeveloper()` | No — Auth token only | Developer bootstrap gate |
| `isDeveloperInConfig()` | Yes — `developerConfig/{email}` | Managed developer gate |
| `isDeveloper()` | Via above | Either developer type |
| `isDeveloperAdmin()` | Via above | Developer admin gate |
| `isValidStatus(s)` | No | Validates status is canonical |

### Role System Separation

**No function from the Platform/Developer system calls into the Product role system, and vice versa.**

- Product rules (`users`, `projects`, `productConfigs`, `organizationConfigs`) use only: `isAuth`, `isOwner`, `userRole`, `isAdmin`, `isManagerOrAbove`, `isProjectOwner`
- Developer rules (`developerConfig`, `appConfig`) use only: `isAuth`, `isOwner`, `isBootstrapDeveloper`, `isDeveloperInConfig`, `isDeveloper`, `isDeveloperAdmin`

This separation means a product Super Admin cannot access Developer Settings, and a Developer with admin role cannot access product data beyond what any authenticated user can read.

### Three-Layer Security Pattern

For all critical operations, enforcement exists at three independent layers:

1. **UI layer** — component validates and prevents invalid actions (e.g., review decision modal)
2. **Service layer** — `project.service.ts` validates business rules before any Firestore write
3. **Firestore rules layer** — database rejects writes that violate rules, even from direct SDK access

---

## 8. Current Production Readiness

### Production Candidate Status

As of 2026-06-12, the application is a **Production Candidate** — ready for controlled beta deployment to trusted users, subject to one mandatory prerequisite:

> **Deploy Firestore rules before any user access:**
> `firebase deploy --only firestore:rules`

Until deployed, all Firestore rule changes from Sprints 1–3 are local only.

### What Is Production Candidate

| Feature | Status |
| --- | --- |
| Project creation, edit, delete | ✅ Production-ready |
| PDF upload to Google Drive | ✅ Production-ready |
| Balloon placement | ✅ Production-ready |
| Feature table | ✅ Production-ready |
| Form 1/2/3 | ✅ Production-ready |
| FAIR package export | ✅ Production-ready |
| Review decision workflow | ✅ Production-ready (three-layer enforcement) |
| Audit trail (write) | ✅ Production-ready (append-only, atomic) |
| Role security | ✅ Production-ready (self-promotion blocked) |
| Beta banner | ✅ Production-ready (live config) |

### What Is Still Beta

| Feature | Status |
| --- | --- |
| Audit trail (read/display in UI) | 🔴 Not built — data captured, no read view |
| Role assignment UI | 🔴 Not built — requires Firebase Console |
| Organization management | 🔴 Not built — single-org model only |
| Subscription / billing | 🔴 Not built — trial plan only |
| Branding settings | 🔴 Not built — hardcoded EV.ENGINEER |
| Watermark configuration | 🔴 Not built — hardcoded |
| OCR extraction | 🔴 Not planned for current sprint |

### Known Risks

1. **G1 — Account creation role injection:** `users/{uid}` create rule has no role field restriction. Pre-existing; not exploitable via UI.
2. **G2 — Firestore review decision combination:** Firestore validates decision value but not combination with target status. Service layer is authoritative. Acceptable for beta.
3. **G3 — Role assignment manual:** Managers can only be assigned via Firebase Console until role management UI is built.

### Next Recommended Sprint

1. Deploy Firestore rules (`firebase deploy --only firestore:rules`)
2. Branding settings model and Developer Settings UI
3. Watermark configuration in Developer Settings
4. Role management in Developer Settings (Users tab)
5. Account creation role restriction (G1 patch — 1 line)

---

*Full security audit: [docs/reports/final_production_candidate_audit.md](../reports/final_production_candidate_audit.md)*
