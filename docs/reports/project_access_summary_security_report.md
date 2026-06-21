# Project Access Summary Security Report

Date: 2026-06-21

## Security model

`projectAccessSummaries/{projectId}` is the only owner-readable source for project metadata after a full project becomes blocked, deleted, or permanently deleted. Normal owners do not receive the restricted full project document.

## Sanitized document fields

Allowed fields are:

- `projectId`
- `ownerUid`
- `ownerEmail` (optional)
- `lifecycleStatus`
- `projectName`
- `partNumber` (optional)
- `status` (optional workflow status)
- `updatedAt`
- `supportDomain`, `supportEmail`, `supportPhone`, `supportWhatsapp` (optional)

The summary writer does not copy customer, material, description, drawing number/revision, PDF names or IDs, Drive links/folders, due dates, review details, form data, inspection data, balloons, or features.

## Firestore enforcement

- Summary reads require authentication and `ownerUid == request.auth.uid`.
- Summary writes require platform admin or developer access.
- Summary deletion is denied.
- Create/update requests use a Firestore `keys().hasOnly(...)` allowlist, preventing accidental sensitive fields from being added to owner-readable summaries.
- Full restricted project reads remain available only to managers/admins/developers for support.
- Normal owner updates and deletes are denied when the project lifecycle is blocked/deleted/permanently deleted.
- Project balloons, features, form results, Form 1, Form 2, and owner audit reads require an accessible active/inactive parent project.

## Lifecycle synchronization

`setProjectLifecycleStatus`, `restoreProject`, and the super-admin permanently-deleted-to-deleted transition update the summary after the project lifecycle update. `ensureProjectAccessSummary` safely regenerates the summary from the current full project during an admin lifecycle action.

## Residual operational risks

- Project update and summary update are sequential client writes, not an Admin SDK transaction. A network failure between writes can temporarily leave the summary stale. Lifecycle UI should surface the error and the action can be retried.
- Rules/index deployment is required before production clients use the secure query.
- Legacy active projects need a privileged lifecycle/summary backfill. No normal-user migration permission was introduced.
- Production rules should be tested with the Firebase Emulator Suite before deployment when emulator tooling becomes available.
