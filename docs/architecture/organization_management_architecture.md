# FAI Engineer — Organization Management Architecture

**Date:** 2026-06-12
**Status:** Architecture — Not Yet Implemented
**Target sprint:** Phases 2–6

---

## 1. Final Decisions

The following decisions are final and inform the data model and implementation plan.

| Decision | Detail |
| --- | --- |
| One user, one organization | A user account belongs to exactly one organization |
| Organization roles | 1 Primary Manager + N Additional Managers + N Engineers |
| Default plan | 7-day trial, max 3 projects, 1 manager, 2 engineers |
| Configurable limits | `managerLimit`, `engineerLimit`, `projectLimit`, `trialDays` — set by Organization Admin |
| Organization approval | Pending approval when org code is new/invalid |
| Manager addition | Managers cannot add other Managers; only Organization Admin can |
| Engineer addition | Managers can add Engineers up to the plan limit |
| Subscription expiry | Read-only mode: login allowed, view allowed, export allowed; create/edit/upload/FAI changes blocked |
| Guest lifecycle | Invalid org code → pending request → same account converted after approval/payment |
| Customer relationship | Owned by Organization Admin |
| Billing owner | Manager |
| GST collection | Not at signup; Manager updates during payment in Subscription Management |

---

## 2. Signup Flow

### Valid Organization Code

```
User enters an existing organization code
  → lookup organizationRequests/{code} or organizations/{orgId} where code matches
  → if valid and active:
    user.organizationCode = <code>
    user.role = 'engineer'
    user.organizationStatus = 'verified'
    → auto-join; profile completed
```

### Invalid / New Organization Code

```
User enters an unknown code
  → ask for:
    Organization Name
    Organization Code (they entered)
  → create organizationRequests/{requestId}:
    requestedBy: uid
    organizationName: string
    organizationCode: string
    status: 'pending'
    createdAt: Timestamp
  → user account:
    organizationStatus: 'pending'
    role: 'engineer'
  → Organization Admin is notified
  → Organization Admin contacts user (email / WhatsApp)
  → After approval/payment:
    users/{uid}.organizationStatus = 'verified'
    organizationRequests/{requestId}.status = 'approved'
    organization created (if new) or user added to existing org
```

The signup form does **not** show an "Organization Name" dropdown. It asks only for an Organization Code. If that code is invalid, the form reveals additional fields (Organization Name) to capture context for the pending request.

---

## 3. Upgrade Flow

After trial expiry (subscription read-only mode):

- A persistent "Upgrade" banner / button is shown
- Clicking it opens a WhatsApp message to Organization Admin with a prefilled template

**WhatsApp message template:**
```
Hello, I want to upgrade {organizationName} for FAI AS9102 reports.
Organization Code: {organizationCode}
Registered Email: {userEmail}
```

This keeps billing/payment off the app for beta. Organization Admin manually initiates upgrade.

---

## 4. Firestore Data Model

### 4.1 `organizations/{orgId}`

```ts
interface Organization {
  orgId: string                         // auto-generated Firestore ID
  organizationCode: string              // unique slug, e.g. 'itelematics'
  organizationName: string
  primaryManagerUid: string             // uid of the Primary Manager
  status: 'active' | 'inactive' | 'suspended' | 'trial_expired'
  plan: 'trial' | 'monthly' | 'annual'
  trialStartDate: Timestamp
  trialEndDate: Timestamp               // trialStartDate + trialDays
  subscriptionStartDate?: Timestamp
  subscriptionEndDate?: Timestamp

  // Limits (configurable by Organization Admin)
  managerLimit: number                  // default: 1
  engineerLimit: number                 // default: 2
  projectLimit: number                  // default: 3

  // Contact
  billingEmail: string                  // manager's email
  gstNumber?: string                    // set during payment
  supportPhone?: string
  whatsappNumber?: string

  // Branding (future: org logo in header)
  logoUrl?: string

  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string                     // uid of Organization Admin who created it
}
```

---

### 4.2 `organizationRequests/{requestId}`

```ts
interface OrganizationRequest {
  requestId: string
  requestedBy: string                   // uid
  requestedByEmail: string
  organizationName: string
  organizationCode: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string                   // uid of Organization Admin who acted
  reviewedAt?: Timestamp
  reviewNote?: string                   // Admin's optional note
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

### 4.3 `organizationAdmins/{uid}`

```ts
interface OrganizationAdmin {
  uid: string
  email: string
  displayName: string
  assignedOrgs: string[]               // list of orgId values this admin manages
  role: 'org_admin'
  enabled: boolean
  addedBy: string                      // uid of Super Admin who created this
  addedAt: Timestamp
}
```

Organization Admins are a separate collection, distinct from product Manager/Engineer roles and from Developer roles. A Super Admin (product) can create Organization Admin accounts.

---

### 4.4 `users/{uid}` — Additional Fields

The existing `users` collection gains two new fields:

```ts
{
  // Existing fields...
  organizationStatus: 'verified' | 'pending' | 'suspended'
  orgId?: string                        // foreign key to organizations/{orgId}
}
```

The existing `organizationCode` field remains as a human-readable slug for display and lookup.

---

## 5. Access Rules Strategy

### Rule Helpers Needed

```
function isOrgAdmin() {
  return isAuth() &&
    exists(/databases/$(database)/documents/organizationAdmins/$(uid())) &&
    get(/databases/$(database)/documents/organizationAdmins/$(uid()))
      .data.get('enabled', false) == true;
}

function userOrgId() {
  return get(/databases/$(database)/documents/users/$(uid())).data.get('orgId', null);
}

function isSameOrg(orgId) {
  return userOrgId() == orgId;
}

function isOrgAdminForOrg(orgId) {
  return isOrgAdmin() &&
    orgId in get(/databases/$(database)/documents/organizationAdmins/$(uid()))
      .data.get('assignedOrgs', []);
}
```

### Collection Rules

| Collection | Read | Write |
| --- | --- | --- |
| `organizations/{orgId}` | Same org members or `isOrgAdminForOrg(orgId)` | `isOrgAdminForOrg(orgId)` only |
| `organizationRequests/{reqId}` | Requester (`isOwner`) or `isOrgAdmin()` | Create: any auth; Update: `isOrgAdmin()` only |
| `organizationAdmins/{uid}` | Self or `isAdmin()` | `isAdmin()` (product Super Admin) only |
| `users/{uid}` — `orgId` field | (inherited from existing rule) | `isOrgAdmin()` can set `orgId` on user |
| `projects` (read) | Project owner **and same org** or Manager+ | (existing create/update/delete rules) |

### Manager Limitations

- Manager can add Engineers to own org (up to `engineerLimit`)
- Manager **cannot** add other Managers — only Organization Admin can
- Manager cannot access other organizations' projects
- Manager cannot modify org settings (name, limits, plan)

### Read-Only Mode Enforcement

When `organizations/{orgId}.status === 'trial_expired'` or `'suspended'`:

**Blocked operations:**
- `projects` create
- `projects` update (status changes, metadata edits)
- `projects/*/balloons` create/update/delete
- `projects/*/features` create/update/delete
- `projects/*/form3Results` create/update/delete
- `projects/*/form1` update
- `projects/*/form2Rows` create/update/delete

**Allowed operations:**
- Login / auth
- Read all projects and subcollections
- Export (all XLSX + PDF export is client-side, no Firestore write required)
- Read Form 1/2/3 data

**Firestore rule pattern:**
```
function isOrgActive(orgId) {
  return get(/databases/$(database)/documents/organizations/$(orgId))
    .data.get('status', 'trial_expired') in ['active', 'trial'];
}

// In projects create rule:
allow create: if isAuth() && isOwner(request.resource.data.uid)
                 && isValidStatus(request.resource.data.status)
                 && isOrgActive(request.resource.data.orgId);
```

**Implementation note:** Full read-only mode enforcement at the Firestore rule layer requires storing `orgId` on each project document and each subcollection document. This is a schema migration — plan carefully before implementing.

---

## 6. Organization Admin Dashboard

The Organization Admin Dashboard is a separate access-controlled section (or a separate route) accessible only to Organization Admins.

### Capabilities

| Action | Description |
| --- | --- |
| Create organization | Set name, code, limits, trial days |
| Approve/reject org requests | Review pending organization requests, approve or reject |
| Assign Primary Manager | Set the primary manager uid for an org |
| Add additional Managers | Up to managerLimit |
| View org members | List all Engineers and Managers in an org |
| Update limits | managerLimit, engineerLimit, projectLimit |
| Monitor subscription state | View trial days remaining, plan, status |
| Suspend/unsuspend org | Set status to 'suspended'/'active' |

### Route (proposed)

```
/org-admin                       Organization Admin dashboard
/org-admin/orgs                  List all organizations
/org-admin/orgs/{orgId}          Org detail view
/org-admin/requests              Pending organization requests
```

---

## 7. Manager — Add Engineers Flow

Once Organization Management is built:

1. Manager visits `/team` (new route) or a "Team" tab in Dashboard
2. Manager sees list of current Engineers in their org (up to `engineerLimit`)
3. Manager can add an Engineer by email → sends an invite (Firestore `invites` collection — future)
4. Engineer accepts invite → `users/{uid}.orgId` set + `organizationStatus = 'verified'`
5. If Engineer count would exceed `engineerLimit` → blocked with upgrade prompt

For beta: Manager assignment and Engineer invitation will use the Organization Admin Dashboard (no self-serve invite flow yet).

---

## 8. Implementation Phases

### Phase 1 — Branding Settings (Developer Settings UI)

See [branding_settings_architecture.md](branding_settings_architecture.md)

No org model changes. Hardcoded branding becomes configurable.

### Phase 2 — Organization Data Model

1. Create Firestore collections: `organizations`, `organizationRequests`, `organizationAdmins`
2. Add `orgId` + `organizationStatus` to `users/{uid}` schema
3. Update `users` Firestore rule to allow `isOrgAdmin()` to set `orgId` field
4. Write `organizationService.ts` with CRUD helpers
5. No UI changes yet

### Phase 3 — Signup Org-Code Flow

1. Update `CompleteProfilePage.tsx` to:
   - Validate organization code against `organizations` collection
   - If valid: set `orgId`, `organizationStatus = 'verified'`
   - If invalid: show org name field, create `organizationRequests` document
2. Update `ProtectedRoute` to handle `organizationStatus = 'pending'` → show "Pending Approval" screen

### Phase 4 — Organization Admin Dashboard

1. Create `/org-admin` routes + `OrgAdminPage.tsx`
2. Org list, org detail, request review
3. Role assignment (assign Manager, add additional Managers)
4. Access guard: `isOrgAdmin()` hook

### Phase 5 — Manager Adds Engineers

1. Add "Team" section to Dashboard or new `/team` route
2. Manager can view org members
3. Manager can invite Engineers (email invite → `invites` Firestore collection)
4. Engineer accepts → joins org
5. Limit enforcement (engineerLimit)

### Phase 6 — Subscription / Read-Only Enforcement

1. Add trial expiry check in `ProductConfigProvider` or a new `SubscriptionProvider`
2. Update Firestore rules with `isOrgActive()` helper
3. Add read-only mode UI: persistent "Upgrade Required" banner
4. Block create/edit/upload operations in UI (not just Firestore)
5. Upgrade button → WhatsApp prefilled message

---

## 9. Future Considerations

- **Email invitations:** Self-serve Engineer invite flow (Phase 5) will need either a Cloud Function or a `pendingInvites` Firestore collection with a matching flow on accept.
- **Org logo in header:** Once `organizations/{orgId}.logoUrl` is set, the header right side can display it. See [branding_settings_architecture.md](branding_settings_architecture.md).
- **Multi-product organizations:** The `productKey` on `organizationConfigs` will allow an org to have different feature sets per product in future.
- **Audit trail scope:** In multi-org mode, the read rule for `auditTrail` may need to expand to allow other Managers in the same org to read events (not just the project owner).

---

*Related: [current_fai_engineer_architecture.md](current_fai_engineer_architecture.md)*
*Related: [branding_settings_architecture.md](branding_settings_architecture.md)*
