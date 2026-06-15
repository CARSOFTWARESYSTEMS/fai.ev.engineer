# FAI Engineer — Multi-Tenant Migration Plan

**Date:** 2026-06-15
**Status:** Architecture — Frozen for Implementation Planning
**Sprint:** Multi-Tenant Foundation

---

## 1. Migration Principles

1. **No breaking changes** — existing users continue to work throughout migration
2. **Opt-in adoption** — organizations are created gradually, not force-migrated
3. **Backward compatibility** — old `users/{uid}.role` kept until Phase 3
4. **Zero downtime** — all schema additions are additive, no field removal in Phase 2
5. **Incremental Firestore rules** — new rules layer on top of existing; old rules not removed until migration confirmed complete

---

## 2. Current State (Phase 1)

```
users/{uid}
  role: 'engineer' | 'manager' | 'admin' | 'super_admin'
  organizationCode: string (user-entered)
  profileCompleted: boolean

projects/{projectId}
  uid: string (single owner)
  status: ProjectStatus

developerConfig/{email}
  enabled: boolean
  role: 'developer' | 'admin'

brandings/{brandingId}
  domains: string[]
  businessCode: string (loosely maps to partner)
```

No `partners`, `organizations`, `organizationMembers`, or `projectAssignments` collections exist.

---

## 3. Phase 1.5 — Navigation Placeholders (No Data Changes)

**Goal:** Add navigation items without any data model changes. Safe to ship immediately.

**Changes:**
- Add `/partner` and `/organization` routes in `App.tsx`
- Add placeholder page components (`PartnerPage.tsx`, `OrganizationPage.tsx`)
- Add `usePartnerAccess()` and `useOrganizationAccess()` hooks (return false for everyone)
- Add conditional menu items in Header/Sidebar (hidden until hooks return true)
- Register guard components (`RequiresPartnerAccess`, `RequiresOrganizationAccess`)

**Firestore changes:** None.
**Existing data:** Unchanged.
**Existing users:** Unaffected.
**Build:** Clean. No TypeScript errors.

---

## 4. Phase 2 — Collections + Partner Admin

**Goal:** Create the core data collections and enable Partner Admin access.

### 4.1 New Collections

Create the following Firestore collections (no migration of existing data):

```
partners/{partnerId}
partnerAdmins/{uid}
organizations/{organizationId}
organizationMembers/{membershipId}
organizationRequests/{requestId}
projectAssignments/{assignmentId}
```

### 4.2 User Document Migration

Add optional fields to `users/{uid}` — existing documents do NOT need updating:

```ts
// New optional fields (undefined for existing users = treated as legacy mode)
platformRole?: 'super_admin' | 'admin' | 'developer'
defaultOrganizationId?: string
```

**Migration rule:** If `users/{uid}.platformRole` is undefined, fall back to legacy `role` field for platform access checks.

### 4.3 Platform Admin Bootstrap

Create `partnerAdmins` entries for designated Partner Admins via Developer Settings (new section added to Developer Settings page).

Create `partners` entries manually via Developer Settings for each white-label partner.

Link existing `brandings/{brandingId}` records to `partners/{partnerId}` via `businessCode` matching.

### 4.4 Security Rules — Additive

```js
// New rules added alongside existing rules (no existing rules removed)

match /partners/{partnerId} {
  allow read: if isAuth() && (isAdmin() || isPartnerAdmin(partnerId));
  allow write: if isAdmin();
}

match /partnerAdmins/{uid} {
  allow read: if isAuth() && (request.auth.uid == uid || isAdmin());
  allow write: if isAdmin();
}

match /organizations/{orgId} {
  allow read: if isAuth() && (isOrgMember(orgId) || isPartnerAdminForOrg(orgId) || isAdmin());
  allow write: if isPartnerAdminForOrg(orgId) || isAdmin();
}

match /organizationMembers/{membershipId} {
  allow read: if isAuth() && (isOrgAdminForMembership(membershipId) || isAdmin());
  allow write: if isOrgAdmin(resource.data.organizationId) || isAdmin();
}
```

### 4.5 Project Access Expansion

`projects/{projectId}` read rules updated to include org-level access:

```js
match /projects/{projectId} {
  // Existing rule (kept):
  allow read: if isAuth() && (isOwner(resource.data.uid) || isManagerOrAbove());

  // New additive condition:
  allow read: if isAuth() && isOrgMemberWithAccess(projectId);
}
```

---

## 5. Phase 3 — Organization Team Management UI

**Goal:** Full UI for org creation, member invitation, and project assignment.

**New UI:**
- `/organization/team` — invite members, change roles
- `/partner/organizations` — list and manage organizations
- `/partner/requests` — approve/reject org requests

**Data changes:**
- `organizationRequests` collection becomes active
- Invitation flow creates `organizationMembers` entries

**Role migration:**
- Users who complete org onboarding get `organizationMembers` entry
- Legacy `users/{uid}.role` still checked as fallback
- New features use `organizationMembers` exclusively

---

## 6. Phase 4 — Project Assignment + Two-Engineer Enforcement

**Goal:** All new projects require team assignment; two-engineer minimum enforced.

**Changes:**
- `projectAssignments` collection becomes active
- Project creation wizard includes team assignment step
- Status transition `draft → in-progress` blocked unless `assignedEngineerUids.length >= 2`
- Legacy projects (no `organizationId`) excluded from enforcement

**Migration of existing projects (opt-in):**
```
Developer Settings → "Migrate Projects to Organization"
  → Lists all projects with no organizationId
  → Org Admin selects projects to claim
  → Creates projectAssignments entries
  → Sets projects/{projectId}.organizationId
```

---

## 7. Phase 5 — Shared PDF + Inspection Signatories

**Goal:** PDF shared links stored, inspection signatories on forms and export.

**Changes:**
- `projects/{projectId}.googleDriveSharedLink` field added
- Drive API permission call added to upload flow
- PDF viewer uses shared link for non-owner access
- `projects/{projectId}.inspectionSignatories` field added
- Form 1/3 export includes signatory block

---

## 8. Phase 6 — Role Migration + Legacy Cleanup

**Goal:** Remove legacy `users/{uid}.role` dependency.

**Steps:**
1. Audit all Firestore rules for `userRole()` helper usage
2. Migrate all remaining role checks to `organizationMembers` collection
3. Update `userRole()` helper to read from `organizationMembers` + `partnerAdmins` + `users.platformRole`
4. Remove deprecated fields from `users/{uid}` in a coordinated write migration
5. Update Firestore security rules to remove legacy checks

**Risk:** High. Requires careful coordination to avoid locking out users.
**Mitigation:** Run old and new rule paths in parallel for 2 weeks before removing old path.

---

## 9. Rollback Strategy

Each phase is independently rollbackable because:
- New collections can be abandoned without affecting existing collections
- New fields on existing documents are optional — absence means legacy mode
- Security rules additions are additive — removing new rules restores old behavior
- Navigation guards default to `false` (deny access) if collections missing

**Emergency rollback procedure:**
1. Revert `firestore.rules` to previous version
2. Revert `App.tsx` route changes
3. Data in new collections is harmless if rules deny access to it

---

## 10. Migration Timeline (Recommended)

| Phase | Prerequisite | Estimated Sprint |
|---|---|---|
| Phase 1.5 | Current phase complete | Sprint 1 (1-2 days) |
| Phase 2 | Phase 1.5 merged | Sprint 2 (3-5 days) |
| Phase 3 | Partner Admin confirms org model | Sprint 3 (5-7 days) |
| Phase 4 | Phase 3 UI validated with first org | Sprint 4 (3-5 days) |
| Phase 5 | Phase 4 stable | Sprint 5 (2-3 days) |
| Phase 6 | All phases validated in production | Sprint 6 (3-5 days) |

---

## 11. Data Integrity Checks

Before each phase deployment, verify:

- [ ] Existing users can still log in and access their projects
- [ ] Developer Settings still accessible to bootstrap developers
- [ ] Branding still resolves by domain
- [ ] No orphaned `projectAssignments` without matching `projects`
- [ ] All `organizationMembers` have valid `uid` (linked to real user)
- [ ] TypeScript compilation clean
- [ ] Firestore rules simulator passes existing test cases
