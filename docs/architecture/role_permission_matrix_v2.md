# FAI Engineer — Role Permission Matrix v2

**Date:** 2026-06-15
**Status:** Architecture — Frozen for Implementation Planning
**Sprint:** Multi-Tenant Foundation

---

## 1. Role Taxonomy

Three distinct role tiers. Roles in each tier are completely independent.

```
PLATFORM TIER          PARTNER TIER           ORGANIZATION TIER
──────────────         ─────────────          ─────────────────
super_admin            partner_admin          organization_admin
admin                                         manager
developer                                     engineer
                                              reviewer
                                              approver
                                              inspector
```

A user can hold:
- At most one platform role (or none)
- At most one partner admin role (or none)
- One organization role per organization membership

A Platform Admin can also be a Partner Admin. This is intentional for EV.ENGINEER
internal team members who manage partners directly.

---

## 2. Platform Roles

| Capability | super_admin | admin | developer |
|---|:---:|:---:|:---:|
| Access Developer Settings | ✓ | ✓ | ✓ |
| Add/remove platform developers | ✓ | ✓ | — |
| Change developer roles | ✓ | ✓ | — |
| Write appConfig (beta banner, watermark) | ✓ | ✓ | ✓ |
| Manage branding presets | ✓ | ✓ | ✓ |
| Create/manage partners | ✓ | ✓ | — |
| Assign partner admins | ✓ | ✓ | — |
| View all organizations | ✓ | ✓ | — |
| View all users | ✓ | ✓ | — |
| Access Partner menu | ✓ | ✓ | — |
| Seed demo data | ✓ | ✓ | ✓ |

Platform roles are stored in `users/{uid}.platformRole` (Phase 2).
Phase 1 uses `developerConfig/{email}` for developer access.

---

## 3. Partner Role

Only one partner role exists: `partner_admin`. Stored in `partnerAdmins/{uid}`.

| Capability | partner_admin |
|---|:---:|
| View partner dashboard (`/partner`) | ✓ |
| Create customer organizations | ✓ |
| Approve/reject organization requests | ✓ |
| Assign Organization Admin | ✓ |
| View all orgs under their partner | ✓ |
| Deactivate organizations | ✓ |
| View subscription/trial status | ✓ |
| Edit partner branding | — (platform admin only) |
| Access Developer Settings | — |
| Access other partners' data | — |
| Access platform configuration | — |

---

## 4. Organization Roles

### 4.1 Definitions

| Role | Description |
|---|---|
| `organization_admin` | Owner of the org account. Full org management. Typically the billing contact. |
| `manager` | Manages projects, assigns engineers, makes review decisions. Multiple per org. |
| `engineer` | Creates and works on FAI projects. Minimum 2 per project. |
| `reviewer` | Reviews completed FAI packages before approval. |
| `approver` | Gives final approval on FAI packages before customer submission. |
| `inspector` | Updates specific inspection data fields. May not be a regular org member. |

### 4.2 Permission Matrix — Organization Management

| Capability | org_admin | manager | engineer | reviewer | approver | inspector |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View organization settings | ✓ | ✓ | — | — | — | — |
| Edit organization settings | ✓ | — | — | — | — | — |
| View team members | ✓ | ✓ | limited | — | — | — |
| Invite Manager | ✓ | — | — | — | — | — |
| Invite Engineer | ✓ | ✓ | — | — | — | — |
| Invite Reviewer | ✓ | ✓ | — | — | — | — |
| Invite Approver | ✓ | ✓ | — | — | — | — |
| Invite Inspector | ✓ | ✓ | — | — | — | — |
| Remove members | ✓ | ✓ (non-admin) | — | — | — | — |
| Change member roles | ✓ | — | — | — | — | — |
| View subscription/plan | ✓ | ✓ | — | — | — | — |

### 4.3 Permission Matrix — Project Access

| Capability | org_admin | manager | engineer | reviewer | approver | inspector |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View all org projects | ✓ | ✓ | assigned only | assigned only | assigned only | assigned only |
| Create project | ✓ | ✓ | ✓ | — | — | — |
| Edit project metadata | ✓ | ✓ | own/assigned | — | — | — |
| Upload PDF | ✓ | ✓ | own/assigned | — | — | — |
| Add/edit balloons | ✓ | ✓ | assigned ✓ | — | — | — |
| Add/edit features | ✓ | ✓ | assigned ✓ | — | — | — |
| Edit Form 1 | ✓ | ✓ | assigned ✓ | — | — | — |
| Edit Form 2 | ✓ | ✓ | assigned ✓ | — | — | — |
| Edit Form 3 | ✓ | ✓ | assigned ✓ | — | — | limited |
| Assign engineers to project | ✓ | ✓ | — | — | — | — |
| Assign reviewer | ✓ | ✓ | — | — | — | — |
| Assign approver | ✓ | ✓ | — | — | — | — |
| Submit for review | ✓ | ✓ | assigned ✓ | — | — | — |
| Review decision (approve/rework) | — | — | — | ✓ | — | — |
| Final approval | — | — | — | — | ✓ | — |
| Archive project | ✓ | ✓ | — | — | — | — |
| Delete project | ✓ | ✓ | — | — | — | — |
| Export FAIR package | ✓ | ✓ | assigned ✓ | ✓ | ✓ | — |
| View audit trail | ✓ | ✓ | own | ✓ | ✓ | — |

### 4.4 Permission Matrix — Inspection Signatories

| Field | Who can fill |
|---|---|
| `inspectedBy` | Assigned Engineer or Inspector |
| `reviewedBy` | Reviewer |
| `approvedBy` | Approver |

---

## 5. Role Hierarchy Summary

```
Platform Super Admin
 └─ can do everything

Platform Admin
 └─ can do everything except: change super_admin records

Platform Developer
 └─ can: access developer settings, read all configs, write appConfig
 └─ cannot: manage partners, organizations, users

Partner Admin
 └─ can: manage their partner's organizations and members
 └─ cannot: access platform config, other partners, developer settings

Organization Admin
 └─ can: full org management, all project access within org
 └─ cannot: access partner management, platform config

Manager
 └─ can: assign engineers, make review decisions, all project access in org
 └─ cannot: change org settings, change member roles

Engineer
 └─ can: create projects, edit assigned projects
 └─ cannot: manage team, approve/review other people's projects

Reviewer
 └─ can: review assigned projects, provide review decision
 └─ cannot: edit project content, approve

Approver
 └─ can: final approval on assigned projects
 └─ cannot: edit project content, review

Inspector
 └─ can: update inspection data on assigned projects
 └─ cannot: manage team, approve, review
```

---

## 6. Role Conflicts and Edge Cases

| Scenario | Resolution |
|---|---|
| Reviewer === Approver | Allowed. Single person can hold both workflow assignments. |
| Org Admin is also Platform Admin | Allowed. Platform Admin can act in any role. |
| Engineer not assigned to project | Cannot view project if `visibility: 'assigned-users'` |
| Inspector from outside org | Inspector role can be granted without full org membership (Phase 3) |
| Manager tries to add another Manager | Blocked — only Org Admin can invite Managers |
| Engineer tries to approve own project | Blocked — Approver must be the assigned `approverUid` |

---

## 7. Firestore Security Rule Helpers (Phase 2)

```js
// Returns organization role for current user in given org
function getOrgRole(organizationId) {
  return get(/databases/$(database)/documents/organizationMembers/
             $(request.auth.uid + '_' + organizationId))
             .data.get('role', null);
}

function isOrgAdmin(organizationId) {
  return getOrgRole(organizationId) == 'organization_admin';
}

function isOrgManager(organizationId) {
  return getOrgRole(organizationId) in ['organization_admin', 'manager'];
}

function isAssignedEngineer(projectId) {
  // Requires projectAssignments to be queryable by projectId
  // Full implementation in Phase 2 security rules sprint
  return true; // placeholder
}
```

---

## 8. Migration from Current `users.role`

Current single-role values and their Phase 2 equivalents:

| Current `users/{uid}.role` | Phase 2 equivalent |
|---|---|
| `super_admin` | `users/{uid}.platformRole = 'super_admin'` |
| `admin` | `users/{uid}.platformRole = 'admin'` |
| `manager` | `organizationMembers/{id}.role = 'manager'` |
| `engineer` | `organizationMembers/{id}.role = 'engineer'` |
| `member` | `organizationMembers/{id}.role = 'engineer'` (same effective permissions) |

The `role` field in `users/{uid}` is kept through Phase 2 for backward compatibility.
Removal is Phase 3+, after all role checks have migrated to `organizationMembers`.
