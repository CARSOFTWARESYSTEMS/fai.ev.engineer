import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { Organisation } from '../services/organisationService'
import { assertOrganisationWritable } from '../services/organisationAccessService'
import { logPdfUploaded } from '../services/userActivityLogService'
import {
  requestDriveToken,
  ensureProjectFolders,
  uploadFileToDrive,
  deleteFileFromDrive,
  deleteProjectFolderFromDrive,
  getDrivePreviewUrl,
} from '../lib/googleDrive'

const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50 MB

// ─── Validation ───────────────────────────────────────────────────────────────

export function validatePdfFile(file: File): string | null {
  if (file.type !== 'application/pdf') return 'Only PDF files are allowed.'
  if (file.size > MAX_PDF_SIZE)         return 'File exceeds maximum size of 50 MB.'
  return null
}

// ─── Upload ───────────────────────────────────────────────────────────────────
// Folder path: FAI.EV.ENGINEER/{uid}/{projectId}/{file.name}
//
// On replace (oldDriveFileId provided): deletes old file before uploading new one.

export async function uploadProjectPdf(
  projectId:       string,
  uid:             string,
  userEmail:       string,
  file:            File,
  oldDriveFileId?: string,
  org?:            Organisation,
): Promise<void> {
  if (org) {
    assertOrganisationWritable(org, { uid, actorEmail: userEmail, action: 'uploadProjectPdf' })
  }
  console.log('[PDF] Upload started:', projectId, file.name)

  try {
    // 1. Get Drive access token (popup only on first use)
    const accessToken = await requestDriveToken(userEmail)

    // 2–4. Ensure FAI.EV.ENGINEER/{uid}/{projectId} folder chain
    const { rootFolderId, userFolderId, projectFolderId } =
      await ensureProjectFolders(accessToken, uid, projectId)

    // 5. Delete old file if replacing
    if (oldDriveFileId) {
      try {
        await deleteFileFromDrive(accessToken, oldDriveFileId)
      } catch {
        // Old file may already be gone — continue
      }
    }

    // 6. Upload new file into project folder
    const { fileId: driveFileId, viewUrl } =
      await uploadFileToDrive(accessToken, projectFolderId, file)

    // 7. Save metadata to Firestore
    await updateDoc(doc(firestore, 'projects', projectId), {
      sourcePdfName:              file.name,
      sourcePdfSize:              file.size,
      sourcePdfUploadedAt:        serverTimestamp(),
      sourcePdfUploadedBy:        userEmail,
      googleDriveFileId:          driveFileId,
      googleDriveViewUrl:         viewUrl,
      googleDriveRootFolderId:    rootFolderId,
      googleDriveUserFolderId:    userFolderId,
      googleDriveProjectFolderId: projectFolderId,
      pdfStatus:                  'uploaded',
      updatedAt:                  serverTimestamp(),
    })

    logPdfUploaded({
      ownerUid:      uid,
      ownerEmail:    userEmail,
      projectId,
      fileName:      file.name,
      fileSizeBytes: file.size,
    }).catch(() => {})
    console.log('[PDF] Upload success:', projectId, '— driveId:', driveFileId)
  } catch (err) {
    const e = err as { code?: string; message?: string }
    console.error('[PDF] Upload failed:', e.code ?? e.message)
    throw err
  }
}

// ─── Delete PDF ───────────────────────────────────────────────────────────────
// Deletes the actual file from Google Drive.
// Keeps the project folder + user folder + root folder intact.

export async function deleteProjectPdf(
  projectId:   string,
  _uid:        string,
  driveFileId: string,
  userEmail?:  string,
  org?:        Organisation,
): Promise<void> {
  if (org) {
    assertOrganisationWritable(org, { uid: _uid, actorEmail: userEmail, action: 'deleteProjectPdf' })
  }
  console.log('[PDF] Delete started:', projectId)

  try {
    const accessToken = await requestDriveToken(userEmail)
    await deleteFileFromDrive(accessToken, driveFileId)

    await updateDoc(doc(firestore, 'projects', projectId), {
      sourcePdfName:      '',
      sourcePdfSize:      0,
      sourcePdfUploadedAt: null,
      sourcePdfUploadedBy: '',
      googleDriveFileId:  '',
      googleDriveViewUrl: '',
      pdfStatus:          'none',
      updatedAt:          serverTimestamp(),
    })

    console.log('[PDF] Delete success:', projectId)
  } catch (err) {
    const e = err as { code?: string; message?: string }
    console.error('[PDF] Delete failed:', e.code ?? e.message)
    throw err
  }
}

// ─── Project Drive cleanup ────────────────────────────────────────────────────
// Called before deleting a project from Firestore.
// Deletes all files in the project Drive folder, then the folder itself.
// Best-effort: logs errors but does NOT throw (Firestore delete still proceeds).

export async function tryCleanupProjectDriveFolder(
  googleDriveProjectFolderId: string
): Promise<void> {
  if (!googleDriveProjectFolderId) return
  try {
    const accessToken = await requestDriveToken() // uses cached token from session
    await deleteProjectFolderFromDrive(accessToken, googleDriveProjectFolderId)
  } catch (err) {
    const e = err as { message?: string }
    console.warn('[PDF] Drive cleanup skipped:', e.message)
  }
}

// ─── PDF preview URL (synchronous) ───────────────────────────────────────────

export function getProjectPdfUrl(googleDriveFileId: string): string {
  return getDrivePreviewUrl(googleDriveFileId)
}

// ─── Error message helper ─────────────────────────────────────────────────────

export function getPdfErrorMessage(err: unknown): string {
  const msg = ((err as { message?: string })?.message ?? '').toLowerCase()
  if (msg.includes('not configured'))
    return 'Google Drive is not configured. Contact the administrator.'
  if (msg.includes('access_denied') || msg.includes('permission'))
    return 'Google Drive access denied. Please grant permission to upload.'
  if (msg.includes('popup_closed') || msg.includes('popup blocked') || msg.includes('closed'))
    return 'Google sign-in popup was closed. Please try again.'
  if (msg.includes('network') || msg.includes('failed to fetch'))
    return 'Network unavailable. Please check your connection and try again.'
  if (msg.includes('quota'))
    return 'Google Drive storage quota exceeded.'
  return 'Unable to upload PDF. Please try again.'
}
