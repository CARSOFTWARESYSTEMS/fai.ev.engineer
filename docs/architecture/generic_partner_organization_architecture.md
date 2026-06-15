# FAI Engineer — Generic Partner + Organization Architecture

**Date:** 2026-06-15
**Status:** Architecture — Frozen for Implementation Planning
**Sprint:** Multi-Tenant Foundation

---

## 1. Platform Hierarchy

```
EV.ENGINEER Platform
│
├── Partner A (e.g. iFab Tech)
│   ├── Customer Org 1 (e.g. Apex Manufacturing)
│   │   └── Users: Admin / Manager / Engineer / Reviewer / Approver / Inspector
│   └── Customer Org 2 (e.g. Delta Aerospace)
│       └── Users
│
├── Partner B (e.g. Future Partner)
│   └── Customer Org 3
│       └── Users
│
└── (Platform Team — internal, no partner affiliation)
```

A **Partner** is a white-label reseller or system integrator that deploys FAI Engineer
under their own domain and branding. They onboard and manage customer organizations.

An **Organization** is a customer company using FAI Engineer through a partner.
Users belong to organizations, not directly to partners.

---

## 2. Firestore Collections

### 2.1 `partners/{partnerId}`

```ts
interface Partner {
  partnerId:       string           // Firestore document ID
  name:            string           // Display name (e.g. "iFab Tech")
  code:            string           // Short code, lowercase (e.g. "ifab") — unique
  brandingId?:     string           // Reference to brandings/{brandingId}
  domains:         string[]         // Hostnames served by this partner
  status:          'active' | 'inactive' | 'suspended'
  contactEmail:    string
  contactName:     string
  createdAt:       Timestamp
  updatedAt:       Timestamp
  createdBy:       string           // Platform admin uid
}
```

**Index:** `code` (unique), `status`

---

### 2.2 `organizations/{organizationId}`

```ts
interface Organization {
  organizationId:  string           // Firestore document ID
  partnerId:       string           // Parent partner
  name:            string           // Company display name
  code:            string           // Short join code (e.g. "apex2026") — unique per partner
  status:          'active' | 'trial' | 'expired' | 'suspended' | 'pending'
  plan: {
    type:           'trial' | 'standard' | 'pro'
    trialStartDate: Timestamp
    trialEndDate:   Timestamp
    projectLimit:   number          // Max concurrent projects
    engineerLimit:  number          // Max engineers
    managerLimit:   number          // Max managers
  }
  adminUid:        string           // Primary Organization Admin uid
  contactEmail:    string
  createdAt:       Timestamp
  updatedAt:       Timestamp
  approvedBy?:     string           // Partner Admin uid who approved
  approvedAt?:     Timestamp
}
```

**Index:** `partnerId`, `status`, `code`

**Constraint:** Each organization belongs to exactly one partner. An org cannot be
transferred between partners in Phase 1.

---

### 2.3 `organizationMembers/{membershipId}`

```ts
interface OrganizationMember {
  membershipId:    string           // Firestore document ID
  uid:             string           // Firebase Auth uid
  organizationId:  string
  partnerId:       string           // Denormalized for faster queries
  role:            OrganizationRole
  status:          'active' | 'invited' | 'deactivated'
  addedBy:         string           // uid of Manager/OrgAdmin who added
  addedAt:         Timestamp
  updatedAt:       Timestamp
  displayName?:    string           // Cached from users document
  email?:          string           // Cached from users document
}

type OrganizationRole =
  | 'organization_admin'
  | 'manager'
  | 'engineer'
  | 'reviewer'
  | 'approver'
  | 'inspector'
```

**Index:** `uid` + `organizationId` (compound), `organizationId` + `role`, `uid`

**Alternative considered:** Sub-collection `organizations/{orgId}/members/{uid}`.
**Decision: top-level collection chosen** because:
- Allows querying "all organizations this user belongs to" (`where('uid', '==', uid)`)
- Allows querying "all members of an org" (`where('organizationId', '==', orgId)`)
- A user joining multiple organizations in the future requires the top-level query
- Sub-collections cannot be queried across documents without Collection Group index

---

### 2.4 `organizationRequests/{requestId}`

```ts
interface OrganizationRequest {
  requestId:       string
  partnerId:       string           // Which partner receives this request
  requestedByUid:  string
  requestedByEmail:string
  organizationName:string
  organizationCode:string           // Requested join code
  status:          'pending' | 'approved' | 'rejected'
  reviewedBy?:     string           // Partner Admin uid
  reviewedAt?:     Timestamp
  reviewNote?:     string
  createdAt:       Timestamp
}
```

**Index:** `partnerId` + `status`, `requestedByUid`

---

### 2.5 `partnerAdmins/{uid}`

```ts
interface PartnerAdmin {
  uid:             string           // Same as Firestore document ID
  email:           string
  displayName:     string
  partnerIds:      string[]         // Partners this admin manages
  status:          'active' | 'deactivated'
  addedBy:         string           // Platform admin uid
  addedAt:         Timestamp
}
```

**Index:** `partnerIds` (array-contains)

**Rationale:** Kept separate from `users` collection to avoid mixing platform and
partner admin concerns. Platform reads `partnerAdmins/{uid}` to determine partner
scope without touching `developerConfig`.

---

### 2.6 `projectAssignments/{assignmentId}`

```ts
interface ProjectAssignment {
  assignmentId:    string
  projectId:       string
  organizationId:  string
  partnerId:       string           // Denormalized
  assignedBy:      string           // Manager uid
  assignedAt:      Timestamp

  assignedEngineerUids: string[]   // Min 2 required
  reviewerUid?:         string
  approverUid?:         string
  inspectorUids?:       string[]

  visibility: 'organization' | 'assigned-users'
}
```

**Index:** `projectId`, `organizationId`

**Alternative:** Sub-collection `projects/{projectId}/assignments/{uid}`.
**Decision: top-level collection chosen** because:
- Enables query "all projects assigned to engineer X" across all projects
- Sub-collection approach requires knowing the projectId first

---

## 3. User Document (Migrated)

Current `users/{uid}` will gain optional fields. Existing fields remain unchanged.

```ts
interface UserDocument {
  // — existing fields (unchanged) —
  uid:               string
  email:             string
  displayName:       string
  mobile?:           string
  role:              UserRole        // Legacy single-role — kept for Phase 1 compat
  profileCompleted:  boolean
  organizationCode?: string          // Legacy field — kept until org migration done
  organizationStatus?: string        // Legacy field

  // — new fields (added in Phase 2) —
  platformRole?:     PlatformRole    // Only set for EV.ENGINEER internal team
  defaultOrganizationId?: string     // Used when user belongs to 1+ orgs
  // partnerIds and organizationIds are NOT stored here — queried from collections
}

type PlatformRole = 'super_admin' | 'admin' | 'developer'
```

**Important:** Organization membership and roles are read from `organizationMembers`
collection, not from `users/{uid}`. The `role` field in `users` stays for backward
compatibility during migration.

---

## 4. Partner Onboarding Flow

```
Platform Admin creates partner in Developer Settings
  → partners/{partnerId} created
  → Branding preset linked (brandingId)
  → partnerAdmins/{uid} entry created for designated Partner Admin

Partner Admin receives credentials / invitation
  → Signs in with Google
  → App detects partnerAdmin record → shows /partner menu
  → Partner Admin creates Organizations

Customer requests to join
  → organizationRequests/{requestId} created
  → Partner Admin reviews → approves/rejects
  → On approval: organizations/{orgId} created, first user becomes Organization Admin
```

---

## 5. Organization Onboarding Flow

```
Partner Admin visits /partner/organizations → New Organization
  → organizations/{orgId} created with status: 'pending'
  → Organization Admin uid assigned

Organization Admin signs in
  → App detects organizationMember record with role: 'organization_admin'
  → Shows /organization menu
  → Admin invites team members (Manager, Engineers)

Minimum viable team before first project:
  → 1 Organization Admin (or Manager)
  → 2 Engineers assigned
```

---

## 6. Partner–Organization–Domain Binding

A domain (`fai.ifab.tech`) binds to a `brandingId` in the `brandings` collection.
A branding preset carries the `businessCode` which maps to a `partners/{partnerId}`.

```
Hostname resolution:
  window.location.hostname
    → brandings collection (array-contains domain)
    → BrandingPreset.businessCode → used as partnerId reference

Future: partners/{partnerId}.domains[] replaces brandings.domains[]
  when partner management UI exists
```

For Phase 1, branding and partner records are maintained manually in
Developer Settings. Phase 2 introduces the Partner Admin UI that links them.

---

## 7. Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Top-level `organizationMembers` vs sub-collection | Top-level | Cross-document queries, multi-org future |
| Top-level `projectAssignments` vs sub-collection | Top-level | Query "all projects for engineer" |
| Partner admin record location | Separate `partnerAdmins` collection | Isolation from platform developer records |
| User org/partner membership storage | Outside `users/{uid}` | One user can belong to multiple orgs later |
| Organization code uniqueness scope | Per-partner | Org "apex" can exist under Partner A and Partner B |
| Two-engineer minimum | Enforced at assignment, not at org creation | Allow org creation without engineers; block project start |

---

## 8. Constraints Not In Scope (Phase 1)

- Billing, payment, subscription management UI
- Multi-org membership (one user, multiple orgs) — data model supports it, UI does not
- Partner-to-partner isolation enforcement in security rules (Phase 2)
- Cloud Functions for automated partner provisioning
- Org code uniqueness enforcement across all partners
