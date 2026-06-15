# FAI Engineer — Shared PDF Access Architecture

**Date:** 2026-06-15
**Status:** Architecture — Frozen for Implementation Planning
**Sprint:** Multi-Tenant Foundation

---

## 1. Current State

PDF documents are uploaded by the project owner to their personal Google Drive under:

```
FAI.EV.ENGINEER/{uid}/{projectId}/
```

Access is limited to the uploading user because:
- Google Drive file is owned by the user's personal account
- No sharing has been configured programmatically
- `googleDriveFileId` is stored in Firestore but access is individual

---

## 2. Problem

In a shared-project model, multiple engineers need to open and annotate the same PDF.
Currently:
- Engineer 2 cannot access Engineer 1's Google Drive file
- PDF viewer loads the file via a signed URL tied to the uploader's OAuth token
- If Engineer 1's session expires or leaves the organization, the file is inaccessible

---

## 3. Chosen Approach for Phase 2: Store Shared Link

The safest approach without Cloud Functions or Drive API automation:

1. When Engineer 1 uploads a PDF, they manually set the file sharing to **"Anyone with the link can view"** in Google Drive.
2. The shareable link is stored in Firestore alongside the existing `googleDriveFileId`.
3. Authorized users in the organization open the PDF via the shared link.
4. The PDF viewer (iframe or Google Drive Viewer embed) loads the link.

**This approach:**
- Requires no backend/Cloud Functions
- Works immediately in Phase 2
- Has an acceptable UX cost (one manual share step per upload)
- Does not introduce security risk beyond what the PDF already contains

---

## 4. Firestore PDF Storage Schema

```ts
// projects/{projectId} — PDF fields

interface ProjectPdfMeta {
  // — existing fields (unchanged) —
  googleDriveFileId:    string
  googleDriveViewUrl:   string           // Direct view URL (requires OAuth)

  // — new fields (Phase 2) —
  googleDriveSharedLink?:       string   // "Anyone with link" share URL
  googleDriveProjectFolderId?:  string   // Parent folder ID in Drive
  pdfUploadedAt?:               Timestamp
  pdfUploadedBy?:               string   // uid of uploader
  pdfFileName?:                 string   // Original filename for display
}
```

---

## 5. PDF Viewer Access Logic

```
User opens project PDF viewer
  ↓
Check: is user the project owner (uploader)?
  YES → use googleDriveViewUrl (existing OAuth flow)
  NO →
    Check: is googleDriveSharedLink set?
      YES → open PDF via shared link embed
            (Google Drive Viewer: https://drive.google.com/file/d/{fileId}/preview)
      NO → show error: "PDF not yet shared. Ask the project creator to share the file."
```

---

## 6. Google Drive Sharing — Manual Workflow (Phase 2)

During PDF upload, after successful Drive upload:

```
1. File uploaded to Drive → googleDriveFileId saved
2. User sees prompt: "Share this PDF with your team"
3. User clicks "Generate shared link" button
4. App calls Drive API: files.permissions.create (type: 'anyone', role: 'reader')
   OR user manually shares in Drive and pastes link into the app
5. Shared link saved to projects/{projectId}.googleDriveSharedLink
6. UI confirms: "PDF is now accessible to your team"
```

**Phase 2 implementation:** Drive API call to create `anyone with link` reader permission.
This is a single API call with the uploader's OAuth token — no Cloud Functions required.

**Phase 3 (future):** Organization-scoped sharing via Service Account or Drive
shared folder per organization. All org PDFs live in one Drive folder shared with
all org members' Google accounts.

---

## 7. Access Control for PDF

Who can view the PDF link (read from Firestore):

```
Project creator → always
Assigned engineers → via projectAssignments
Organization Admin → always within org
Manager → always within org
Reviewer (when project in review) → via projectAssignments.reviewerUid
Approver → via projectAssignments.approverUid
Inspector (assigned) → via projectAssignments.inspectorUids
```

Firestore security rule for `googleDriveSharedLink`:
```
allow read: if isProjectAccessAuthorized(projectId)
```

The shared link itself is not secret (anyone with it can view the PDF), but it is
not publicly indexed. Storing it behind Firestore auth is sufficient for Phase 2.

---

## 8. Future Approach: Organization Shared Drive Folder

In Phase 4+, consider:

```
partners/{partnerId}/orgs/{orgId}/
  → Google Drive: shared folder per organization
  → All PDFs uploaded to org folder
  → All org members added as collaborators to folder
  → No per-file sharing required
```

This requires:
- Service Account with Drive API access (Cloud Functions)
- Google Workspace or Drive for organizations setup
- Complexity significantly higher — deferred to Phase 4

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| User forgets to share PDF | UI prompt immediately after upload; blocked team status shown |
| Shared link accidentally made public | Link is in Firestore; only authenticated users can read it |
| Drive file deleted by uploader | Store `pdfUploadedBy` and `pdfFileName`; warn before deletion |
| Org member leaves, Drive file inaccessible | Phase 3: migrate to org shared folder |
| Google Drive API quota | Single API call per upload — well within free quota |

---

## 10. Phase Delivery

| Phase | Action |
|---|---|
| Phase 2 | Add `googleDriveSharedLink` field, Drive API permission call after upload, PDF viewer shared link fallback |
| Phase 3 | Organization-level Drive folder, automatic member sharing on org join |
| Phase 4 | Service Account + org Drive storage, remove personal Drive dependency |
