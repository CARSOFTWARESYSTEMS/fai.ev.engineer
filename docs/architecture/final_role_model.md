# FAI Engineer — Final Role Model

**Date:** 2026-06-21  
**Status:** Authoritative — Supersedes `role_permission_matrix_v2.md`  
**Applies to:** All platform, partner, and organisation tiers

---

## 1. Role Taxonomy Overview

Three independent tiers. A user holds at most one role per tier.

```
PLATFORM TIER              PARTNER TIER               ORGANISATION TIER
──────────────             ─────────────              ─────────────────
super_admin                partner_super_admin         owner
admin                      partner_admin               manager
developer                                              engineer
                                                       inspector
                                                       auditor
                                                       approver
                                                       viewer
```

**Storage:**
- Platform role → `users/{uid}.role` (current field, backward-compat)
- Partner role → `partnerAdmins/{uid}` or `partners/{id}/admins` collection
- Organisation role → `orgMemberships/{uid_orgId}` or `organisations/{orgId}/members/{uid}`

---

## 2. Platform Roles

### 2.1 `super_admin`

Full platform control including permanently-deleted recovery.

| Capability | Allowed |
|-----------|---------|
| Create platform admins | ✅ |
| Create platform developers | ✅ |
| Create partners | ✅ |
| Create partner super admins | ✅ |
| View / edit billing (all) | ✅ |
| Block / delete / restore users | ✅ |
| Block / delete / restore projects | ✅ |
| Move `permanently_deleted` → `deleted` (recovery) | ✅ |
| View all activity logs | ✅ |
| Access Developer Settings | ✅ |
| View all users | ✅ |
| View all projects | ✅ |
| View partner / org / product config | ✅ |

### 2.2 `admin`

Full platform operations. Cannot recover permanently-deleted items.

| Capability | Allowed |
|-----------|---------|
| Create platform admins | ❌ |
| Create platform developers | ✅ |
| Create partners | ✅ |
| Create partner super admins | ✅ |
| View / edit billing (all) | ✅ |
| Block / delete / restore users | ✅ |
| Block / delete / restore projects | ✅ |
| Move `permanently_deleted` → `deleted` | ❌ |
| View activity logs (excl. super-admin-only recovery logs) | ✅ |
| Access Developer Settings | ✅ |
| View all users | ✅ |
| View all projects | ✅ |
| View partner / org / product config | ✅ |

### 2.3 `developer`

Read/support access. All actions disabled.

| Capability | Allowed |
|-----------|---------|
| Create admin / developer / partner super admin | ❌ |
| View billing | ✅ (read-only) |
| Edit billing | ❌ |
| Block / delete users or projects | ❌ |
| View all users | ✅ |
| View all projects | ✅ |
| View partner / org / product config | ✅ |
| View activity logs (if permitted by super_admin) | Conditional |
| Access Developer Settings | ✅ |

---

## 3. Partner Roles

### 3.1 `partner_super_admin`

Partner owner. One per partner.

| Capability | Allowed |
|-----------|---------|
| View all orgs under own partner/domain | ✅ |
| Create organisations | ✅ |
| Assign org owner | ✅ |
| Configure org subscription | ✅ |
| Configure org user seat limits | ✅ |
| Enable products for orgs | ✅ |
| Edit partner profile (except domain) | ✅ |
| Edit partner domain | ❌ |
| View billing for own partner / orgs | ✅ |
| Edit billing for own partner / orgs | ✅ |
| View users under own domain | ✅ |
| Access Developer Settings | ❌ |
| See other partners | ❌ |
| Delete / block projects or users | ❌ |

### 3.2 `partner_admin`

Partner operations admin. Up to 2 per partner.

| Capability | Allowed |
|-----------|---------|
| View all orgs under own partner/domain | ✅ |
| Create / manage organisations | ✅ |
| Assign org owner | ✅ |
| Configure subscription and seat limits | ✅ |
| Enable products for orgs | ✅ |
| View users under own domain | ✅ |
| Edit partner profile / domain | ❌ |
| Access Developer Settings | ❌ |
| See other partners | ❌ |
| Delete / block projects or users | ❌ |

**Seat rule:**
```
1 × partner_super_admin
up to 2 × partner_admin
```
Database stores all as `partner_admin`. UI may label first as "Primary" and second as "Optional."

---

## 4. Organisation Roles

### 4.1 `owner`

Organisation owner. One per organisation.

| Capability | Allowed |
|-----------|---------|
| Manage org users | ✅ |
| Assign any org role | ✅ |
| View subscription | ✅ (read-only) |
| View all org projects | ✅ |
| Block / delete / restore projects | ✅ |
| Complete / archive projects | ✅ |
| Approve project lifecycle actions | ✅ |

### 4.2 `manager`

Project manager.

| Capability | Allowed |
|-----------|---------|
| Create / manage projects | ✅ |
| Move project: draft → in-progress → review → completed → archived | ✅ |
| Block / delete / restore projects | ✅ |
| Assign engineers | ✅ |
| Assign inspector / auditor / approver / viewer | ✅ |

### 4.3 `engineer`

FAI creator.

| Capability | Allowed |
|-----------|---------|
| Create project | ✅ |
| Edit assigned projects | ✅ |
| Move: draft → in-progress → review | ✅ |
| Edit balloons / features / Form 1 / Form 2 / Form 3 (pre-review) | ✅ |
| Approve | ❌ |
| Block / delete | ❌ |
| Archive | ❌ |

### 4.4 `inspector`

Inspection data entry.

| Capability | Allowed |
|-----------|---------|
| View assigned project | ✅ |
| Enter inspection / measurement data | ✅ |
| Update Form 3 inspection fields | ✅ |
| Edit project metadata | ❌ |
| Delete / block | ❌ |
| Approve | ❌ |

### 4.5 `auditor`

Audit / review role.

| Capability | Allowed |
|-----------|---------|
| View assigned project | ✅ |
| Review FAIR package | ✅ |
| Review audit trail | ✅ |
| Add audit / review comments | ✅ |
| Approve review step (if assigned) | ✅ |
| Edit project | ❌ |
| Delete / block | ❌ |

### 4.6 `approver`

Final approval.

| Capability | Allowed |
|-----------|---------|
| View assigned project | ✅ |
| Final approval / release FAIR package | ✅ |
| Complete final approval stage | ✅ |
| Edit project | ❌ |
| Delete / block | ❌ |

### 4.7 `viewer`

Read-only. Used for customer QA, suppliers, management, external auditors.

| Capability | Allowed |
|-----------|---------|
| View assigned projects | ✅ |
| View / export reports (if allowed) | ✅ |
| Edit | ❌ |
| Approve | ❌ |
| Delete / block | ❌ |

---

## 5. Project Delete / Block Permission

Only these roles may set `lifecycleStatus = 'blocked'` or `'deleted'`:

```
Platform:       super_admin, admin
Organisation:   owner, manager
```

Denied:
```
developer
partner_super_admin, partner_admin
engineer, inspector, auditor, approver, viewer
```

Physical deletion is never performed. All deletes use lifecycle status.

---

## 6. TypeScript Type Definitions

```typescript
// Platform-level role (stored in users/{uid}.role)
export type PlatformRole = 'super_admin' | 'admin' | 'developer'

// Legacy composite type (backward-compat — includes org roles on platform user doc)
// Deprecated: org roles to be migrated to orgMemberships collection
export type UserRole = 'user' | 'admin' | 'super_admin' | 'engineer' | 'manager'

// Partner role
export type PartnerRole = 'partner_super_admin' | 'partner_admin'

// Organisation role (per-org membership)
export type OrganisationRole =
  | 'owner'
  | 'manager'
  | 'engineer'
  | 'inspector'
  | 'auditor'
  | 'approver'
  | 'viewer'
```

---

## 7. Migration Notes

Current user documents store a single flat `role` field using `UserRole`. Migration to the final model requires:

1. Map current `'engineer'` → org role `engineer` in org membership + platform role `developer` (optional)
2. Map current `'manager'` → org role `manager` + clear platform role
3. Map current `'admin'`/`'super_admin'` → platform role only
4. Existing `'user'` → org role `viewer` or `engineer` depending on activity

Migration is non-breaking: read logic falls back to flat `role` field until migration is complete.
