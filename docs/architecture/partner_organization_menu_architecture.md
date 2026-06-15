# FAI Engineer — Partner + Organization Menu Architecture

**Date:** 2026-06-15
**Status:** Architecture — Frozen for Implementation Planning
**Sprint:** Multi-Tenant Foundation

---

## 1. Menu Structure

Three top-level privileged menu items, each visible to a distinct audience:

```
Navigation (after login)
├── Dashboard            ← all authenticated users
├── Projects             ← all authenticated users
├── Profile              ← all authenticated users
│
├── Organization         ← Org Admin, Manager (and limited Engineer view)
├── Partner              ← Partner Admin (and Platform Admin)
└── Developer Settings   ← Platform Developers / Admins only
```

---

## 2. Partner Menu

### Visibility

Shown when the authenticated user has an entry in `partnerAdmins/{uid}` (status: active)
OR has a platform role of `admin` / `super_admin`.

### Routes

| Route | Purpose | Access |
|---|---|---|
| `/partner` | Partner dashboard overview | Partner Admin, Platform Admin |
| `/partner/organizations` | List and manage customer organizations | Partner Admin, Platform Admin |
| `/partner/organizations/new` | Create a new organization | Partner Admin, Platform Admin |
| `/partner/organizations/:orgId` | Organization detail + team | Partner Admin, Platform Admin |
| `/partner/requests` | Pending organization join requests | Partner Admin, Platform Admin |
| `/partner/settings` | Partner profile, branding link, contact info | Partner Admin, Platform Admin |

### Partner Dashboard Content

```
/partner
├── Stats: Active Orgs / Trial Orgs / Pending Requests / Total Users
├── Recent organization activity
└── Quick actions: New Organization / Review Requests
```

### Organization List (`/partner/organizations`)

```
┌─────────────────────────────────────────────────────────┐
│ ORGANIZATIONS                              3 organizations│
├─────────────────────────────────────────────────────────┤
│ Apex Manufacturing     apex2026  [active]   12 users Edit│
│ Delta Aerospace        delta     [trial]     3 users Edit│
│ Sigma Components       sigma26   [pending]   — users Edit│
└─────────────────────────────────────────────────────────┘
```

### Pending Requests (`/partner/requests`)

```
┌────────────────────────────────────────────────────────────┐
│ ORGANIZATION REQUESTS                         2 pending     │
├────────────────────────────────────────────────────────────┤
│ Request by: john@newcorp.com                               │
│ Org Name: New Corp Engineering                             │
│ Code: newcorp26                                            │
│ Requested: 2026-06-14                [Approve] [Reject]    │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Organization Menu

### Visibility

Shown when the authenticated user has an `organizationMembers/{membershipId}` entry
with `role` in `['organization_admin', 'manager']`.

Engineers see a limited read-only sub-view (team list + their project assignments)
but do not see the full organization management menu.

### Routes

| Route | Purpose | Access |
|---|---|---|
| `/organization` | Org overview: member count, project count, plan status | Org Admin, Manager |
| `/organization/team` | Member list, roles, invite/remove | Org Admin, Manager |
| `/organization/team/invite` | Invite new member | Org Admin, Manager |
| `/organization/projects` | All org projects with assignment view | Org Admin, Manager |
| `/organization/settings` | Org name, code, contact, plan info (read-only) | Org Admin only |

### Organization Dashboard

```
/organization
├── Plan: Trial (expires 2026-06-22) / Standard / Pro
├── Stats: Members / Active Projects / Engineers / Pending Invites
├── Two-Engineer Compliance: X of Y projects have 2+ engineers assigned
└── Quick actions: Invite Member / New Project Assignment
```

### Team Management (`/organization/team`)

```
┌──────────────────────────────────────────────────────────┐
│ TEAM MEMBERS                              8 members       │
├──────────────────────────────────────────────────────────┤
│ Ananth Kumar    [Org Admin]    ananth@apex.com   Active   │
│ Ravi Singh      [Manager]      ravi@apex.com     Active   │
│ Priya Nair      [Engineer]     priya@apex.com    Active   │
│ Tom Chen        [Engineer]     tom@apex.com      Active   │
│ Sarah Lee       [Reviewer]     sarah@apex.com    Active   │
│ James Patel     [Approver]     james@apex.com    Active   │
└──────────────────────────────────────────────────────────┘
[+ Invite Member]
```

---

## 4. Navigation Guard Strategy

### Current Implementation

Navigation guards are implemented in the React Router route config using wrapper
components that check the `useAuth()` context and the current user's role.

Example pattern (existing for Developer Settings):
```tsx
<Route path="/developer-settings" element={
  <RequiresDeveloperAccess>
    <DeveloperSettingsPage />
  </RequiresDeveloperAccess>
} />
```

### Phase 2 Guards

```tsx
// Partner routes
<Route path="/partner/*" element={
  <RequiresPartnerAccess>
    <PartnerLayout />
  </RequiresPartnerAccess>
} />

// Organization routes
<Route path="/organization/*" element={
  <RequiresOrganizationAccess>
    <OrganizationLayout />
  </RequiresOrganizationAccess>
} />
```

### Access Check Functions

```ts
// partnerAccess hook
function usePartnerAccess(): { hasAccess: boolean; partnerIds: string[] } {
  // Reads partnerAdmins/{uid} from Firestore
  // OR checks user.platformRole in ['admin', 'super_admin']
}

// organizationAccess hook
function useOrganizationAccess(): {
  hasAccess: boolean
  organizationId: string | null
  role: OrganizationRole | null
} {
  // Reads organizationMembers where uid == currentUser.uid
  // Picks defaultOrganizationId or first result
}
```

---

## 5. Sidebar / Header Integration

Current sidebar (authenticated users):

```
Dashboard
Projects
Profile
[Developer Settings] ← if developer
```

New sidebar (Phase 2):

```
Dashboard
Projects
Profile
[Organization]        ← if org admin or manager
[Partner]             ← if partner admin or platform admin
[Developer Settings]  ← if platform developer/admin
```

Menu items are conditionally rendered based on the access hooks above.
All three privileged items can be visible simultaneously to a Platform Admin who
is also a Partner Admin managing an org. This is an edge case (internal testing).

---

## 6. Placeholder Pages (Phase 1.5 — Before Full Implementation)

To keep navigation visible for testing without full implementation:

```tsx
// src/pages/PartnerPage.tsx
export function PartnerPage() {
  return <ComingSoonPlaceholder title="Partner Management" />
}

// src/pages/OrganizationPage.tsx
export function OrganizationPage() {
  return <ComingSoonPlaceholder title="Organization Management" />
}
```

Routes registered in `App.tsx` with appropriate guards.
These placeholder pages appear in the nav but show "Coming Soon" content.
This allows the navigation structure to be tested before full implementation.

---

## 7. Mobile Menu

Current mobile menu mirrors desktop navigation. Phase 2 adds the same conditional
items to the mobile hamburger menu. Order: Dashboard → Projects → Organization →
Partner → Developer Settings → Profile.

---

## 8. Phase Delivery

| Phase | Deliverable |
|---|---|
| Phase 1.5 | Placeholder Partner + Organization pages, nav guards, sidebar items |
| Phase 2 | Partner dashboard, org list, team management (read-only) |
| Phase 3 | Partner organization creation, request approval flow |
| Phase 4 | Full organization team management, invite flow |
| Phase 5 | Organization settings, plan display, subscription info |
