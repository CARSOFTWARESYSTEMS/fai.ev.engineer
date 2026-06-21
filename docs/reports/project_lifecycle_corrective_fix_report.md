# Project Lifecycle Corrective Fix Report

Date: 2026-06-21

## Outcome

The partial lifecycle implementation was completed and the application build was restored. Normal owner list reads now combine active/inactive full project documents with blocked-only sanitized access summaries. Deleted and permanently deleted projects are excluded from normal lists. Detail, edit, and PDF routes reject blocked/deleted lifecycle states before enabling project operations or PDF workspace subcollection subscriptions.

## Files modified

- `firestore.rules`
- `firestore.indexes.json`
- `.gitignore` (allows the two requested reports to be tracked)
- `src/components/ui/ProjectLifecycleRestricted.tsx`
- `src/features/pdfViewer/components/PdfViewerPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/EditProjectPage.tsx`
- `src/pages/ProjectDetailPage.tsx`
- `src/pages/ProjectsPage.tsx`
- `src/projects/project.service.ts`
- `src/projects/project.types.ts`
- `src/projects/projectAccessSummary.service.ts`
- `src/projects/projectAccessSummary.ts`
- `src/projects/projectLifecycle.testMatrix.ts`
- `src/projects/projectLifecycle.ts`
- `src/services/lifecycleService.ts`

## Build results

- `npx tsc --noEmit`: passed with 0 errors.
- `npm run build`: passed with 0 build errors.
- Vite emitted only the pre-existing large-chunk advisory.
- Lint was not required because the repository has no ESLint 9 flat configuration.

## Filtering changes

- New projects are explicitly created with `lifecycleStatus: active`.
- Normal owners fetch full documents only for `active` and `inactive` lifecycle states.
- Blocked owner cards are derived only from `projectAccessSummaries`.
- Dashboard total, priority, in-progress, due-this-week, and recent calculations use lifecycle-filtered collections.
- Blocked projects can appear in recent projects, but have no open/edit/PDF actions.
- Projects page separates active/inactive, blocked, deleted, and permanently deleted sections according to role.
- Inactive cards display an `Inactive` lifecycle tag.
- Deleted/permanently deleted cards have no open or edit action.

## Route guard changes

- Detail and edit routes use the full project only after lifecycle validation.
- When a normal owner cannot read the full blocked/deleted document, the route reads their sanitized summary and shows the restricted message.
- PDF workspace hooks receive an empty project ID until a full active/inactive project passes lifecycle validation. This prevents balloon, feature, Form 1, Form 2, and Form 3 subscriptions from starting for restricted projects.
- Restricted messages distinguish blocked, deleted, and permanently deleted states.

## Verification matrix

| Check | Result |
|---|---|
| TypeScript and production build | Passed |
| Active/inactive visible/open helper behavior | Passed by executable helper matrix |
| Blocked visible but not open/edit | Passed by executable helper matrix and code review |
| Deleted hidden from engineer, visible to manager/admin | Passed by executable helper matrix |
| Permanently deleted list visibility limited to super admin/bootstrap | Passed by executable helper matrix |
| Dashboard stats avoid deleted/permanently deleted | Passed by code review |
| Full blocked/deleted document denied to normal owner | Passed by rules review |
| Blocked subcollection access denied | Passed by rules review |
| Summary schema contains no PDF/form/drawing-detail fields | Passed by schema and rules allowlist review |
| Authenticated Firebase UI scenarios | Not run; interactive browser control/test identities were unavailable |

## Known limitations

- Existing legacy project documents without a `lifecycleStatus` field require an admin backfill before the new secure owner query can return them. Querying those legacy full documents alongside blocked documents would weaken the security boundary, so no insecure fallback was added.
- Manager/admin project pages still use the existing owner-scoped project source. Cross-user or organization-wide discovery was intentionally not invented.
- Non-bootstrap developers represented only in `developerConfig` are supported by Firestore rules and existing developer views, but the standard Projects page has no developer-role signal in `UserRole`.
- Firestore rules and the new composite index must be deployed before the secure owner query works in the deployed environment.
- Live role-based UI verification still needs Firebase test records for each lifecycle state.

## Recommended next step

Run a one-time privileged migration that sets missing project lifecycle values to `active` and creates sanitized summaries, then deploy `firestore.rules` and `firestore.indexes.json`. After deployment, execute the authenticated manual matrix with engineer, manager/admin, and bootstrap identities.
