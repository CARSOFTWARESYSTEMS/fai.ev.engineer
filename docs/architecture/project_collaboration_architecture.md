# FAI Engineer — Project Collaboration Architecture

**Date:** 2026-06-15
**Status:** Architecture — Frozen for Implementation Planning
**Sprint:** Multi-Tenant Foundation

---

## 1. Problem Statement

Current model: one project owner. If the engineer is unavailable, no one else can
continue work. This is a production risk for aerospace/defense customers where
inspection deadlines are non-negotiable.

Required model: shared project access within an organization, with role-appropriate
permissions per operation.

---

## 2. Two-Engineer Minimum Requirement

Every project that enters active work (`in-progress`) must have at least two engineers
assigned. This is enforced at the application layer (not Firestore rules) at the
point of assignment creation or project status change.

**Enforcement point:** When a Manager or Org Admin moves a project from `draft` to
`in-progress`, the system checks `projectAssignments/{assignmentId}.assignedEngineerUids.length >= 2`.
If the check fails, the transition is blocked with a clear error.

**Rationale:**
- One engineer on leave → project continues
- Aerospace/defense customers require continuity plan
- Prevents knowledge silos

---

## 3. Project Access Model

### 3.1 Firestore Document

```ts
// projects/{projectId} — additional fields added in Phase 2

interface Project {
  // — existing fields (unchanged) —
  uid:             string    // Legacy creator uid — kept for compat
  name:            string
  status:          ProjectStatus
  // ... all current fields ...

  // — new fields (Phase 2) —
  organizationId?: string
  partnerId?:      string
  createdByUid:    string    // Explicit creator (replaces uid usage)
}
```

Project assignment details live in `projectAssignments/{assignmentId}`:

```ts
interface ProjectAssignment {
  assignmentId:         string
  projectId:            string
  organizationId:       string
  partnerId:            string

  createdByUid:         string           // Engineer who created the project
  assignedBy:           string           // Manager/OrgAdmin who set up assignment
  assignedAt:           Timestamp
  updatedAt:            Timestamp

  assignedEngineerUids: string[]         // MINIMUM 2 — enforced at app layer
  reviewerUid?:         string
  approverUid?:         string
  inspectorUids?:       string[]
  managerUids?:         string[]         // Managers with explicit project visibility

  visibility:           'organization' | 'assigned-users'
  // 'organization' = all org members can view (managers/admin always see all)
  // 'assigned-users' = only listed uids + admin/manager
}
```

---

### 3.2 Who Can Access a Project?

| Actor | Read | Edit | Review | Approve | Inspect | Delete |
|---|---|---|---|---|---|---|
| Platform Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Organization Admin | ✓ | ✓ | — | — | — | ✓ |
| Manager (org) | ✓ | ✓ | — | — | — | ✓ |
| Assigned Engineer | ✓ | ✓ | — | — | — | — |
| Reviewer | ✓ | — | ✓ | — | — | — |
| Approver | ✓ | — | — | ✓ | — | — |
| Inspector (assigned) | ✓ | limited | — | — | ✓ | — |
| Other org members | ✓ (if visibility=org) | — | — | — | — | — |

**"Edit"** means: add/edit balloons, features, form data, upload new PDF revision.
**"limited edit"** for Inspector means: update inspection-specific form fields only.

---

### 3.3 Workflow Assignments

Workflow responsibilities are separate from role access. A Reviewer may be the same
user as the Approver.

```ts
workflowAssignments: {
  createdByUid:         string
  assignedEngineerUids: string[]    // Min 2
  reviewerUid?:         string      // May be same as approverUid
  approverUid?:         string      // May be same as reviewerUid
}
```

**Reviewer responsibilities:**
- Inspect the FAI package for completeness
- Provide review decision (approve for next stage / rework required)
- Must leave a comment with every decision

**Approver responsibilities:**
- Final approval signature on the FAI report
- Approves the FAIR package for customer submission

**Note:** In small organizations, one person may hold both Reviewer and Approver roles.
The data model allows `reviewerUid === approverUid`.

---

## 4. Inspection Signatories

Signatories are document-level identities that appear on the printed/exported FAI.
They are NOT the same as access-control roles.

```ts
interface InspectionSignatories {
  inspectedBy?: {
    name:    string
    email:   string
    title?:  string
    date?:   Timestamp
    uid?:    string    // Optional link to Firebase user
  }
  reviewedBy?: {
    name:    string
    email:   string
    title?:  string
    date?:   Timestamp
    uid?:    string
  }
  approvedBy?: {
    name:    string
    email:   string
    title?:  string
    date?:   Timestamp
    uid?:    string
  }
}
```

Storage: `projects/{projectId}/form1/{form1Id}.signatories` or as a top-level
field on the project document. Recommendation: top-level on `projects/{projectId}`
for easier access during export.

**Appearances in export:**
- Form 1: Part/Drawing Identification → `inspectedBy`, `reviewedBy`, `approvedBy`
- Form 3: Dimensional Results → `inspectedBy` date block
- FAIR Package export → signature block on all three forms

**Entry method (Phase 3):**
- Manually entered by Org Admin / Manager during project setup
- Pre-populated from the `organizationMembers` record if the assigned user matches

---

## 5. Project Status Transitions

```
draft
  ↓ (Engineer assigns self + 1 other engineer)
in-progress
  ↓ (Engineer submits for review)
review
  ↓ (Reviewer approves)      ↓ (Reviewer requests rework)
approved                  in-progress (rework)
  ↓ (Approver signs off)
completed
  ↓ (Manager archives)
archived
```

**Guards per transition:**

| Transition | Guard |
|---|---|
| `draft → in-progress` | `assignedEngineerUids.length >= 2` |
| `in-progress → review` | Assigned engineer only |
| `review → approved` | `reviewerUid` only |
| `review → in-progress` | `reviewerUid` only (rework decision) |
| `approved → completed` | `approverUid` only |
| `* → archived` | Manager or Org Admin only |

---

## 6. Backward Compatibility

Phase 1 (current): `projects/{projectId}.uid` is the sole owner. No `organizationId`.

Phase 2 migration:
- Projects created before Phase 2 will have no `organizationId`
- These are treated as personal projects: owner-only access
- A migration button in Developer Settings will allow Org Admin to "claim" personal
  projects into an organization (sets `organizationId`, creates `projectAssignments`)
- No automatic migration — opt-in only

---

## 7. Firestore Security Rules Strategy (Phase 2)

```js
match /projects/{projectId} {
  // Read: owner OR org member with access
  allow read: if isProjectOwner(projectId)
               || isOrgMemberWithAccess(projectId)
               || isManagerOrAbove()
               || isAdmin()

  // Write: assigned engineer OR manager/admin
  allow update: if isAssignedEngineer(projectId)
                 || isManagerOrAbove()
                 || isAdmin()
}

match /projectAssignments/{assignmentId} {
  allow read: if isOrgMember(resource.data.organizationId)
  allow write: if isOrgManager(resource.data.organizationId)
                || isOrgAdmin(resource.data.organizationId)
                || isAdmin()
}
```

Full rule implementation deferred to Phase 2 sprint.

---

## 8. Phase Delivery Plan

| Phase | Deliverable |
|---|---|
| Phase 2 | `projectAssignments` collection, two-engineer enforcement, org-scoped project list |
| Phase 3 | Reviewer/Approver workflow, review decision tied to assignment |
| Phase 4 | Inspector assignment, inspection signatory fields on forms/export |
| Phase 5 | Full Firestore security rules for multi-tenant isolation |
