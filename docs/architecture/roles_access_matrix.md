# FAI Engineer — Roles & Access Matrix

**Date:** 2026-06-21  
**Status:** Authoritative  
**Tiers:** Platform · Partner · Organisation

Legend: ✅ Allowed · ❌ Denied · 👁 Read-only · C Conditional

---

## 1. Platform Actions

| Action | super_admin | admin | developer |
|--------|:-----------:|:-----:|:---------:|
| Create platform admin | ✅ | ❌ | ❌ |
| Create platform developer | ✅ | ✅ | ❌ |
| Create partner | ✅ | ✅ | ❌ |
| Create partner super admin | ✅ | ✅ | ❌ |
| Access Developer Settings | ✅ | ✅ | ✅ |
| View all users | ✅ | ✅ | ✅ |
| View all projects | ✅ | ✅ | ✅ |
| View partner / org config | ✅ | ✅ | 👁 |
| View all activity logs | ✅ | ✅ (excl. recovery) | C |
| Block / delete users | ✅ | ✅ | ❌ |
| Restore blocked/deleted users | ✅ | ✅ | ❌ |
| Move `permanently_deleted` user → `deleted` | ✅ | ❌ | ❌ |
| Block / delete projects | ✅ | ✅ | ❌ |
| Restore blocked/deleted projects | ✅ | ✅ | ❌ |
| Move `permanently_deleted` project → `deleted` | ✅ | ❌ | ❌ |
| View billing (all orgs) | ✅ | ✅ | 👁 |
| Edit billing (all orgs) | ✅ | ✅ | ❌ |

---

## 2. Partner Actions

| Action | partner_super_admin | partner_admin |
|--------|:-------------------:|:-------------:|
| View own partner's orgs | ✅ | ✅ |
| Create organisations | ✅ | ✅ |
| Assign org owner | ✅ | ✅ |
| Configure org subscription | ✅ | ✅ |
| Configure org seat limits | ✅ | ✅ |
| Enable products for org | ✅ | ✅ |
| Edit partner profile (not domain) | ✅ | ❌ |
| Edit partner domain | ❌ | ❌ |
| View own billing | ✅ | 👁 |
| Edit own billing | ✅ | ❌ |
| View users under own domain | ✅ | ✅ |
| See other partners | ❌ | ❌ |
| Access Developer Settings | ❌ | ❌ |
| Block / delete users or projects | ❌ | ❌ |

---

## 3. Organisation Actions — User Management

| Action | owner | manager | engineer | inspector | auditor | approver | viewer |
|--------|:-----:|:-------:|:--------:|:---------:|:-------:|:--------:|:------:|
| Manage org users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign any org role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign engineers / inspectors | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View subscription | 👁 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit subscription | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Organisation Actions — Project Lifecycle

| Action | owner | manager | engineer | inspector | auditor | approver | viewer |
|--------|:-----:|:-------:|:--------:|:---------:|:-------:|:--------:|:------:|
| Create project | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit project metadata | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Move draft → in-progress | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Move in-progress → review | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Move review → completed | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Archive project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Block project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete (soft) project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Restore blocked/deleted project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve project lifecycle | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all org projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Organisation Actions — FAIR / FAI Content

| Action | owner | manager | engineer | inspector | auditor | approver | viewer |
|--------|:-----:|:-------:|:--------:|:---------:|:-------:|:--------:|:------:|
| Upload PDF | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit balloons / features | ✅ | ✅ | ✅ (pre-review) | ❌ | ❌ | ❌ | ❌ |
| Edit Form 1 / Form 2 | ✅ | ✅ | ✅ (pre-review) | ❌ | ❌ | ❌ | ❌ |
| Edit Form 3 metadata | ✅ | ✅ | ✅ (pre-review) | ❌ | ❌ | ❌ | ❌ |
| Enter Form 3 inspection data | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Review FAIR package | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | 👁 |
| Add audit / review comments | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Approve review step | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Final approval / release FAIR | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Export FAIR package | ✅ | ✅ | ✅ | 👁 | ✅ | ✅ | 👁 |
| View / export reports | ✅ | ✅ | ✅ | 👁 | ✅ | ✅ | 👁 |

---

## 6. Billing Actions

| Action | super_admin | admin | developer | partner_super_admin | partner_admin | owner |
|--------|:-----------:|:-----:|:---------:|:-------------------:|:-------------:|:-----:|
| View billing — all orgs | ✅ | ✅ | 👁 | — | — | — |
| Edit billing — all orgs | ✅ | ✅ | ❌ | — | — | — |
| View billing — own partner's orgs | — | — | — | ✅ | 👁 | — |
| Edit billing — own partner's orgs | — | — | — | ✅ | ❌ | — |
| View own org subscription | — | — | — | — | — | 👁 |
| Edit own org subscription | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## 7. Product Entitlement Actions

| Action | super_admin | admin | developer | partner_super_admin | partner_admin | owner |
|--------|:-----------:|:-----:|:---------:|:-------------------:|:-------------:|:-----:|
| Enable products for partner | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View products enabled for partner | ✅ | ✅ | 👁 | 👁 | 👁 | — |
| Enable products for org | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| View products enabled for org | ✅ | ✅ | 👁 | ✅ | ✅ | 👁 |

---

## 8. Project Delete / Block Summary

Consolidated view of which roles can block or soft-delete projects:

| Role | Can Block | Can Soft-Delete | Can Restore |
|------|:---------:|:---------------:|:-----------:|
| `super_admin` | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ |
| `developer` | ❌ | ❌ | ❌ |
| `partner_super_admin` | ❌ | ❌ | ❌ |
| `partner_admin` | ❌ | ❌ | ❌ |
| `owner` (org) | ✅ | ✅ | ✅ |
| `manager` (org) | ✅ | ✅ | ✅ |
| `engineer` | ❌ | ❌ | ❌ |
| `inspector` | ❌ | ❌ | ❌ |
| `auditor` | ❌ | ❌ | ❌ |
| `approver` | ❌ | ❌ | ❌ |
| `viewer` | ❌ | ❌ | ❌ |

---

## 9. Lifecycle Status — Who Sees What

| Lifecycle Status | engineer/inspector/auditor/approver/viewer | manager/owner | admin/super_admin/developer |
|-----------------|:------------------------------------------:|:-------------:|:---------------------------:|
| `active` | ✅ | ✅ | ✅ |
| `inactive` | ✅ | ✅ | ✅ |
| `blocked` | 👁 disabled card | 👁 disabled card | ✅ full access |
| `deleted` | Hidden | ✅ visible | ✅ visible |
| `permanently_deleted` | Hidden | Hidden | `super_admin` only |
