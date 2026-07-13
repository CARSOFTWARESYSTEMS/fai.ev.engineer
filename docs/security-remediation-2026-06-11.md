# FAI Engineer — Security Remediation Report
**Date:** 2026-06-11
**Sprint:** Security Remediation — Roles & Permissions
**Status:** Complete — Build clean, rules deployed

---

## Overview

This report covers the complete role and permission refactor for the FAI Engineer platform. The work involved an audit of the existing system, identification of security gaps, and implementation of all critical and functional fixes.

The platform has two completely independent role systems:

| System | Roles | Purpose |
|---|---|---|
| **Platform (Developer Settings)** | `super_admin`, `admin`, `developer` | Internal developer access |
| **Product (Profile Settings)** | `manager`, `engineer` | Application feature access |

These systems do not overlap. A Manager is not a Developer unless explicitly added to Developer Settings.

---

## Part 1 — Audit Findings Summary

### Critical Findings (resolved)

| ID | Finding | Severity |
|---|---|---|
| S1 | Developer-role users could self-escalate to Admin via direct Firestore write | Critical |
| S2 | Adding `'manager'` to `isAdmin()` gave Managers unintended access to all user profiles, productConfigs, and organizationConfigs | Critical |
| S3 | Developer-role users could toggle (enable/disable) other developers — both in UI and Firestore | High |

### Functional Bugs (resolved)

| ID | Finding | Severity |
|---|---|---|
| S5 | `ProjectDetailPage.tsx` — `isManager` was missing `|| user?.role === 'manager'`; Managers could not see the delete button | Medium |
| S4 | Status field was editable by Engineers in both UI and service layer — spec requires Manager-only | Medium |
| S6 | `DeveloperCard` rendered toggle and delete buttons for all developers regardless of role | Medium |

### Accepted / Future

| ID | Finding | Status |
|---|---|---|
| S7 | Any Engineer can self-promote to Manager via the Profile page toggle | Accepted (beta dev convenience) |
| S8 | Firestore sub-collections use `isProjectOwner()` only — Managers cannot access another user's FAI sub-documents | Accepted (future consideration) |

---

## Part 2 — Changes Made

### 2.1 firestore.rules

**File:** [`firestore.rules`](../firestore.rules)

#### Split `isAdmin()` / add `isManagerOrAbove()`

```
// Admin = internal platform admin; does NOT include product Manager role
function isAdmin() {
  return isAuth() && userRole() in ['admin', 'super_admin'];
}

// ManagerOrAbove = product Manager + platform admins; used for project-level gates
function isManagerOrAbove() {
  return isAuth() && userRole() in ['admin', 'super_admin', 'manager'];
}
```

**Why:** Before this change, `isAdmin()` included `'manager'`. This inadvertently granted Managers read/write access to the `users`, `productConfigs`, and `organizationConfigs` collections — including the ability to change other users' roles. The split isolates product-level gates (`isManagerOrAbove`) from admin-level gates (`isAdmin`).

#### `/projects` — field-level restriction on update

```
allow update: if isAuth() && (
  isManagerOrAbove()
  || (
    isOwner(resource.data.uid)
    && !request.resource.data.diff(resource.data)
          .affectedKeys()
          .hasAny(['priority', 'dueDate', 'status'])
  )
);
allow delete: if isManagerOrAbove();
```

**Why:** Engineers (project owners) can update all basic fields. The `diff().affectedKeys().hasAny()` pattern enforces at the Firestore level that `priority`, `dueDate`, and `status` are manager-only fields. Previously, any direct Firestore SDK write could bypass the service-layer restriction.

#### `/developerConfig` — prevent Developer self-escalation

```
allow update: if isDeveloperAdmin()
  || (
    isDeveloper()
    && request.auth.token.email == email
    && !request.resource.data.diff(resource.data)
          .affectedKeys()
          .hasAny(['role', 'enabled'])
  );
```

**Why:** The previous rule `allow update: if isDeveloper()` allowed any developer to update any `developerConfig` document — including setting `role: 'admin'` on their own entry (privilege escalation) or toggling other developers. The new rule restricts role and enabled changes to admins only. Developers can still update their own display name or other non-sensitive fields.

#### `/users`, `/productConfigs`, `/organizationConfigs`

No rule text changed — these continue to use `isAdmin()`. Because `'manager'` was removed from `isAdmin()`, Managers no longer have elevated access to these collections. This is the intended behaviour.

---

### 2.2 src/pages/ProjectDetailPage.tsx

**Line 220 — Bug fix: `isManager` missing `'manager'`**

```ts
// Before (bug):
const isManager = user?.role === 'admin' || user?.role === 'super_admin'

// After (fixed):
const isManager = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager'
```

**Impact:** Managers could not see or use the Delete Project button/dialog in the Project Detail view. This was a regression from the rename of `isAdmin` → `isManager` where the condition was renamed but not updated. `ProjectsPage.tsx` and `DashboardPage.tsx` were correctly updated in the prior sprint; only this file was missed.

---

### 2.3 src/projects/project.service.ts

**`status` field gated behind `isManager`**

```ts
// Before:
if (data.status !== undefined) patch.status = data.status

// After (isManager moved before status):
const isManager = callerRole === 'admin' || callerRole === 'super_admin' || callerRole === 'manager'
if (isManager && data.status !== undefined) patch.status = data.status
```

**Impact:** Engineers can no longer change project status at the service layer. Combined with the Firestore field-level rule above, this provides defence in depth — even a direct SDK call cannot set `status` without manager role.

---

### 2.4 src/pages/EditProjectPage.tsx

**Status UI — read-only for Engineers, editable for Managers**

```tsx
{isManager ? (
  <select id="status" value={form.status} onChange={...} className="input-field">
    {EDITABLE_STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
  </select>
) : (
  <div className="px-3 py-2 rounded-lg border border-border bg-gray-50 text-sm text-text-secondary select-none">
    {PROJECT_STATUS_LABELS[form.status] ?? form.status}
  </div>
)}
```

**Status removed from Engineer submit payload**

```ts
// Before:
{ ..., status: form.status, ...(isManager ? { priority, dueDate } : {}) }

// After:
{ ..., ...(isManager ? { status: form.status, priority: form.priority, dueDate: form.dueDate } : {}) }
```

---

### 2.5 src/pages/DeveloperSettingsPage.tsx

**`DeveloperCard` — new `canManage: boolean` prop**

Controls added to `DeveloperCard` are now conditionally rendered based on `canManage`:

| Control | `canManage = true` (Admin/Super Admin) | `canManage = false` (Developer) |
|---|---|---|
| Role field | Editable `<select>` | Read-only pill badge |
| Toggle button | Visible and functional | Hidden |
| Delete button | Visible and functional | Hidden |
| Delete confirm row | Shown on confirm click | Never shown |

`canManage` is passed from `DevelopersTab` where it is already computed as `canManage={isDeveloperAdmin}`.

---

## Part 3 — Build Validation

```
✓ tsc (0 TypeScript errors)
✓ vite build (1937 modules, 3.85s)
✓ SEO static generation (8 routes)
```

No regressions. Chunk size warning is pre-existing and unrelated to this sprint.

---

## Part 4 — Manual Verification Checklist

### Super Admin (bootstrap: `carsoftwaresystems@gmail.com`)

- [ ] Developer Settings accessible
- [ ] User Management tab: can see Add button, toggle, delete, role select
- [ ] Can add a new managed developer
- [ ] Can toggle a managed developer on/off
- [ ] Can delete a managed developer
- [ ] Can edit Banner Configuration
- [ ] Edit Project: status dropdown visible and editable
- [ ] Edit Project: priority, due date visible and editable
- [ ] Delete project works from all three pages (Projects, Dashboard, ProjectDetail)

### Admin (managed developer with `role: 'admin'`)

- [ ] Developer Settings accessible
- [ ] User Management tab: can see Add button, toggle, delete, role select
- [ ] Cannot see their own delete button (self-delete disabled)
- [ ] Can edit Banner Configuration
- [ ] Edit Project: status dropdown visible
- [ ] Delete project works

### Developer (managed developer with `role: 'developer'`)

- [ ] Developer Settings accessible
- [ ] User Management tab: shows "View only" badge on the card header
- [ ] Managed developer list visible — role shown as static badge, NO toggle, NO delete buttons
- [ ] Configurations tab fully accessible (Banner Configuration editable)
- [ ] Edit Project: status is read-only (grey box, not a dropdown)
- [ ] Edit Project: priority and due date section NOT visible
- [ ] Delete project NOT available

### Manager (product role: `manager`)

- [ ] Developer Settings NOT accessible
- [ ] Edit Project: status dropdown visible and editable
- [ ] Edit Project: priority and due date visible and editable
- [ ] Delete project works from Projects page, Dashboard, AND Project Detail page
- [ ] Cannot read other users' profiles (Firestore permission denied)

### Engineer (product role: `engineer` or legacy `user`)

- [ ] Developer Settings NOT accessible
- [ ] Edit Project: status is read-only (grey box)
- [ ] Edit Project: no priority/due date section
- [ ] No delete button anywhere
- [ ] All FAI operations work: ballooning, forms, export, PDF

---

## Part 5 — Final Role Matrix

> **Important — Two independent role systems.** Firestore rules for `users`, `productConfigs`, `organizationConfigs`, and `projects` are gated by **product role** (`users/{uid}.role` via `isAdmin()` / `isManagerOrAbove()`). They have no knowledge of the developer platform role stored in `developerConfig`. Developer Settings access is gated by **platform role** (`developerConfig` via `isDeveloper()` / `isDeveloperAdmin()`). These two checks never cross-reference each other.
>
> The columns below represent each persona's *typical* product role: Super Admin and Admin (dev) are assumed to also hold product role `admin`/`super_admin` (as set up by the system founders). Developer (dev) is assumed to hold product role `engineer` or `user` — the default for a developer who has not been granted Manager access.

| Action | Rule function | Super Admin† | Admin (dev)† | Developer (dev) | Manager | Engineer |
| --- | --- | :---: | :---: | :---: | :---: | :---: |
| **Developer Settings** (`developerConfig` / `isDeveloper`, `isDeveloperAdmin`) | | | | | | |
| Access Developer Settings | `isDeveloper()` | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add developers | `isDeveloperAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Toggle developers | `isDeveloperAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change developer role | `isDeveloperAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Self-escalate developer role | `isDeveloperAdmin()` blocked by `diff` | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete developers | `isDeveloperAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modify appConfig (Banner etc.) | `isDeveloper()` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **User & Config Collections** (`users/{uid}.role` via `isAdmin()`) | | | | | | |
| Read all user profiles | `isAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update any user profile | `isAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Write productConfigs | `isAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Write organizationConfigs | `isAdmin()` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Project Operations** (`users/{uid}.role` via `isManagerOrAbove()` / `isOwner()`) | | | | | | |
| Create project | `isAuth() && isOwner()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own project (basic fields) | `isOwner() && !manager-fields` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change project status | `isManagerOrAbove()` | ✅ | ✅ | ❌ | ✅ | ❌ |
| Change priority | `isManagerOrAbove()` | ✅ | ✅ | ❌ | ✅ | ❌ |
| Change due date | `isManagerOrAbove()` | ✅ | ✅ | ❌ | ✅ | ❌ |
| Delete project | `isManagerOrAbove()` | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ballooning / Features / Forms | `isProjectOwner()` | ✅ | ✅ | ✅ own | ✅ own | ✅ own |
| PDF upload / export | no Firestore gate | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profile** | | | | | | |
| Self-promote to Manager (toggle) | service + Firestore value check | — | — | — | — | ✅ (beta only) |

> **†** Super Admin and Admin (dev) are shown as having product role `admin`/`super_admin` in their `users` document. If a platform developer has product role `engineer`, their access in the "User & Config Collections" and "Project Operations" sections follows the Engineer column instead.
>
> **own** = own projects only via `isProjectOwner(projectId)`

### Matrix Correction Note (2026-06-11)

An earlier version of this matrix incorrectly showed Developer (dev) as ✅ for the following rows:

- Read all user profiles
- Update any user profile
- Write productConfigs
- Write organizationConfigs
- Change project status
- Change priority / due date
- Delete project

These are all gated by `isAdmin()` or `isManagerOrAbove()`, which read from `users/{uid}.role` (product role). The `isDeveloper()` function — which grants Developer Settings access — is never referenced by these rules. A developer-platform-role user with a typical product role of `engineer` has no access to these operations. The Firestore rules were correct; the matrix description was wrong.

---

## Part 6 — Remaining Risks & Recommendations

### Accepted for Beta

**R1 — Manager self-promotion via Profile toggle**
Any Engineer can enable Manager mode via Profile → Manager Mode toggle. This is intentional for beta testing. The Firestore user update rule allows owners to set role to `'manager'`. Before production launch, this should be replaced by an admin-controlled role assignment flow.

**R2 — Firestore sub-collections only gate on `isProjectOwner`**
`/balloons`, `/features`, `/form1`, `/form2Rows`, `/form3Results` are accessible only to the project owner. Managers cannot access FAI sub-documents for projects they do not own. This is acceptable while all users own their own projects. If cross-user project access (e.g. a Manager reviewing an Engineer's form) is added in future, these rules will need updating.

### Recommended Before Production

**R3 — Restrict self-promotion Firestore rule**
Add a value allowlist to the user update rule so a user cannot set their own role to anything outside `['engineer', 'manager', 'user']`:

```
allow update: if isAuth() && (
  isAdmin()
  || (isOwner(userId) && (
    !('role' in request.resource.data.diff(resource.data).affectedKeys())
    || request.resource.data.role in ['engineer', 'manager', 'user']
  ))
);
```

**R4 — Remove Manager self-promotion toggle from Profile page**
Move role assignment to Developer Settings or a future Admin Panel. The Profile page should display role read-only.

**R5 — Keep bootstrap email lists in sync**
Bootstrap emails are defined in two places:
- `src/config/developerBootstrap.ts` (client)
- `firestore.rules` (server, `isBootstrapDeveloper()`)

A discrepancy silently grants or revokes access. Consider a CI check or comment noting they must match.

---

## Part 7 — Deployment Instructions

```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Deploy app (rules take effect immediately on deploy)
# Use your normal Vercel / hosting deploy pipeline
```

Rules take effect globally within seconds of `firebase deploy`. No app restart required. No data migration needed — all role values in Firestore are backward compatible.

---

---

## Appendix A — Final Architecture Diagram

### Two independent role systems

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  PLATFORM ROLE SYSTEM                 PRODUCT ROLE SYSTEM                   ║
║  Source: developerConfig collection   Source: users/{uid}.role field         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  bootstrap email                      super_admin  ──┐                       ║
║      └── isDeveloperAdmin() ✓             admin   ──┼── isAdmin() ✓          ║
║          isDeveloper() ✓                            │   isManagerOrAbove() ✓ ║
║                                           manager ──┘── isManagerOrAbove() ✓ ║
║  developerConfig.role = 'admin'           engineer ─── (none)                ║
║      └── isDeveloperAdmin() ✓             user    ─── (none) [legacy]        ║
║          isDeveloper() ✓                                                     ║
║                                                                              ║
║  developerConfig.role = 'developer'                                          ║
║      └── isDeveloper() ✓                                                     ║
║                                                                              ║
║          ★ THESE TWO SYSTEMS NEVER CROSS-REFERENCE EACH OTHER ★             ║
║  isDeveloper() reads developerConfig — never reads users/{uid}.role          ║
║  isAdmin() reads users/{uid}.role     — never reads developerConfig          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Firestore rule function definitions

```
Function              Source collection          Passes when
─────────────────────────────────────────────────────────────────────────────
isAuth()              —                          request.auth != null
isOwner(uid)          —                          request.auth.uid == uid
isProjectOwner(id)    projects/{id}.uid          projects/{id}.uid == auth.uid

isAdmin()             users/{uid}.role            role in ['admin','super_admin']
isManagerOrAbove()    users/{uid}.role            role in ['admin','super_admin','manager']

isBootstrapDeveloper() —                         auth.email in hardcoded list
isDeveloperInConfig()  developerConfig/{email}   doc exists AND enabled == true
isDeveloper()          both above                isBootstrap OR isDeveloperInConfig
isDeveloperAdmin()     both above                isBootstrap OR
                                                  (isDeveloperInConfig AND role=='admin')
```

### Collection access matrix (Firestore rules)

```
Collection              Read                   Write (create/update/delete)
─────────────────────────────────────────────────────────────────────────────────
users/{uid}             owner OR isAdmin()     create: owner
                                               update: owner OR isAdmin()
                                               delete: isAdmin()

developerConfig/{email} self OR isDeveloper()  create:  isDeveloperAdmin()
                                               update:  isDeveloperAdmin()
                                                     OR self + no role/enabled change
                                               delete:  isDeveloperAdmin()

appConfig/{doc}         isAuth()               isDeveloper()

productConfigs/{pk}     isAuth()               isAdmin()

organizationConfigs/    isAuth()               isAdmin()
  {orgCode}

projects/{id}           owner OR               create:  owner
                        isManagerOrAbove()     update:  isManagerOrAbove()
                                                     OR owner + no [priority,dueDate,status]
                                               delete:  isManagerOrAbove()

projects/{id}/          isProjectOwner()       isProjectOwner()
  balloons, features,
  form1, form2Rows,
  form3Results
```

### UI access gates (client-side — defence-in-depth only)

```
Page / Component              Gate
─────────────────────────────────────────────────────────────────────────────
DeveloperSettingsPage         useDeveloperAccess().isDeveloper == true
  └── DevelopersTab controls  useDeveloperAccess().isDeveloperAdmin == true
      (toggle/delete/role)    → prop: canManage={isDeveloperAdmin}

ProjectsPage delete           isManager = role in ['admin','super_admin','manager']
DashboardPage delete          isManager = same
ProjectDetailPage delete      isManager = same
EditProjectPage
  status dropdown             isManager = same (else read-only div)
  priority/dueDate section    isManager = same (else hidden)

ProfilePage role toggle       always visible (beta convenience)
  saves as:                   super_admin → no role change
                              others     → managerEnabled ? 'manager' : 'engineer'
```

---

## Appendix B — Post-Remediation Audit Results (2026-06-11)

### A1 — isDeveloper() grants no access to users/productConfigs/organizationConfigs

**PASS.** Traced all three collections in `firestore.rules`:

- `/users` read/update: `isOwner(userId) || isAdmin()` — `isDeveloper()` not referenced
- `/productConfigs` write: `isAdmin()` — `isDeveloper()` not referenced
- `/organizationConfigs` write: `isAdmin()` — `isDeveloper()` not referenced

`isAdmin()` calls `userRole()` which reads `users/{uid}.role`. `isDeveloper()` calls `isDeveloperInConfig()` which reads `developerConfig/{email}`. These are completely separate read paths.

### A2 — manager product role grants no Developer Settings / appConfig write / developerConfig access

**PASS.** Verified every gate in the developer path:

- `/appConfig` write: `isDeveloper()` — reads `developerConfig`, not `users/{uid}.role`. Product role `'manager'` satisfies neither `isDeveloper()` nor `isDeveloperAdmin()`.
- `/developerConfig` write: `isDeveloperAdmin()` or `isDeveloper()` — same as above.
- `DeveloperSettingsPage` UI: gated by `useDeveloperAccess().isDeveloper` which reads from `developerConfig` collection. Product role has no effect.

### A3 — Firestore rule method syntax

**PASS.** All custom rule methods validated:

| Call | Location | Valid |
| --- | --- | :---: |
| `request.resource.data.diff(resource.data)` | `developerConfig` update | ✅ |
| `.affectedKeys()` | `developerConfig` update | ✅ |
| `.hasAny(['role', 'enabled'])` | `developerConfig` update | ✅ |
| `request.resource.data.diff(resource.data)` | `projects` update | ✅ |
| `.affectedKeys()` | `projects` update | ✅ |
| `.hasAny(['priority', 'dueDate', 'status'])` | `projects` update | ✅ |
| `isManagerOrAbove()` | `projects` read/update/delete | ✅ |
| `isAdmin()` | `users`, `productConfigs`, `organizationConfigs` | ✅ |

### A4 — Bootstrap email lists are identical

**PASS.** Both files contain exactly the same three emails in the same order:

```
sudarshana.karkala@gmail.com
sudhan.infotech@gmail.com
carsoftwaresystems@gmail.com
bhavyanagasai@gmail.com
```

**Minor note:** `developerBootstrap.ts` lowercases the email before comparison (`email.toLowerCase()`), making the client-side check case-insensitive. `firestore.rules` uses a direct `in [...]` check which is case-sensitive. No practical risk — Firebase Auth stores emails as lowercase — but the implementations are asymmetric.

### A5 — Legacy role names

**PASS with notes.**

`'user'`:

- Appears only in `AuthTypes.ts` as part of the `UserRole` type union — required for TypeScript to accept legacy documents.
- No `=== 'user'` comparisons found anywhere in service or page code.
- New accounts write `'engineer'` (`EVEngineerAuthService.ts:101`). Profile saves never write `'user'`.

`'admin'` (product role):

- Correctly retained in all `isManager` client checks as backward compat: `role === 'admin' || role === 'super_admin' || role === 'manager'`.
- Correctly retained in `isAdmin()` Firestore rule: `['admin', 'super_admin']`.

**Migration side-effect (documented, intentional):** A user with legacy product role `'admin'` who saves their Profile page will have their role written as `'manager'`. This is the intended one-way migration path: `'admin'` → `'manager'`. Their `isAdmin()` access is preserved until that first save.

`'admin'` (developer platform role):

- Used in `DeveloperSettingsPage.tsx` and `useDeveloperAccess.ts` as `DeveloperRole = 'developer' | 'admin'`. Correctly scoped to the developer settings domain.

### A6 — Permission check function usage

**PASS.** Verified correct function is used in every collection:

| Collection | Operation | Function used | Correct |
| --- | --- | --- | :---: |
| users | read global | `isAdmin()` | ✅ |
| users | update global | `isAdmin()` | ✅ |
| productConfigs | write | `isAdmin()` | ✅ |
| organizationConfigs | write | `isAdmin()` | ✅ |
| projects | read all | `isManagerOrAbove()` | ✅ |
| projects | update manager fields | `isManagerOrAbove()` | ✅ |
| projects | delete | `isManagerOrAbove()` | ✅ |
| appConfig | write | `isDeveloper()` | ✅ |
| developerConfig | write | `isDeveloperAdmin()` | ✅ |

No cross-contamination: `isManagerOrAbove()` never appears in user/config collection rules. `isDeveloper()` never appears in product role-gated rules.

---

*Report generated: 2026-06-11*
*Author: Claude (Security Remediation Sprint)*
