import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  type FieldValue,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { FAIProject, CreateProjectInput, UpdateProjectInput } from './project.types'
import type { UserRole } from '../auth/AuthTypes'
import { requestDriveToken, deleteFileFromDrive, deleteProjectFolderFromDrive } from '../lib/googleDrive'

// Separate write type uses FieldValue for timestamps
type ProjectWriteDoc = Omit<FAIProject, 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue
  updatedAt: FieldValue
}

// ─── Create ───────────────────────────────────────────────────────────────────

interface CreateProjectContext {
  uid: string
  productKey: string
  organizationCode: string
  organizationName: string
  defaultDueDays?: number
}

export async function createProject(
  input: CreateProjectInput,
  ctx: CreateProjectContext
): Promise<FAIProject> {
  const docRef = doc(collection(firestore, 'projects'))

  const defaultDueDays = ctx.defaultDueDays ?? 7
  const dueDateMs = Date.now() + defaultDueDays * 24 * 60 * 60 * 1000
  const dueDate   = Timestamp.fromMillis(dueDateMs)

  const writeDoc: ProjectWriteDoc = {
    projectId: docRef.id,
    uid: ctx.uid,
    productKey: ctx.productKey,
    organizationCode: ctx.organizationCode || 'default',
    organizationName: ctx.organizationName || '',

    projectName: input.projectName.trim(),
    customerName: input.customerName?.trim() ?? '',
    partNumber: input.partNumber.trim(),
    partName: input.partName?.trim() ?? '',
    drawingNumber: input.drawingNumber.trim(),
    drawingRevision: input.drawingRevision.trim(),
    material: input.material?.trim() ?? '',
    description: input.description?.trim() ?? '',

    status: 'draft',
    version: 1,

    priority: input.priority ?? 'medium',
    dueDate,
    defaultDueDaysApplied: defaultDueDays,

    sourcePdfName: '',
    googleDriveFileId: '',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  console.log('[PROJECT] Creating project...')
  console.log('[PROJECT]   name    :', writeDoc.projectName)
  console.log('[PROJECT]   id      :', docRef.id)
  console.log('[PROJECT]   uid     :', writeDoc.uid)
  console.log('[PROJECT]   pk      :', writeDoc.productKey)
  console.log('[PROJECT]   orgCode :', writeDoc.organizationCode)

  try {
    await setDoc(docRef, writeDoc)
    console.log('[PROJECT] Created successfully:', docRef.id)
    return { ...writeDoc, createdAt: null, updatedAt: null }
  } catch (err) {
    const e = err as { code?: string; message?: string }
    console.error('[PROJECT] Create failed:')
    console.error('[PROJECT]   code    :', e.code)
    console.error('[PROJECT]   message :', e.message)
    console.error('[PROJECT]   uid     :', writeDoc.uid)
    console.error('[PROJECT]   pk      :', writeDoc.productKey)
    console.error('[PROJECT]   orgCode :', writeDoc.organizationCode)
    throw err
  }
}

// ─── Read: list user projects ─────────────────────────────────────────────────

export async function getUserProjects(uid: string): Promise<FAIProject[]> {
  try {
    const q = query(
      collection(firestore, 'projects'),
      where('uid', '==', uid)
    )
    const snap = await getDocs(q)
    const projects = snap.docs.map((d) => d.data() as FAIProject)
    // Sort by updatedAt descending client-side (avoids composite index requirement)
    return projects.sort((a, b) => {
      const ta = a.updatedAt && typeof (a.updatedAt as { toMillis?: () => number }).toMillis === 'function'
        ? (a.updatedAt as { toMillis: () => number }).toMillis()
        : 0
      const tb = b.updatedAt && typeof (b.updatedAt as { toMillis?: () => number }).toMillis === 'function'
        ? (b.updatedAt as { toMillis: () => number }).toMillis()
        : 0
      return tb - ta
    })
  } catch (err) {
    console.error('[PROJECT] Failed to fetch user projects:', err)
    return []
  }
}

// ─── Read: single project ─────────────────────────────────────────────────────

export async function getProjectById(projectId: string): Promise<FAIProject | null> {
  try {
    const snap = await getDoc(doc(firestore, 'projects', projectId))
    if (!snap.exists()) return null
    return snap.data() as FAIProject
  } catch (err) {
    console.error('[PROJECT] Failed to fetch project:', projectId, err)
    return null
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProject(
  projectId: string,
  _uid: string,
  callerRole: UserRole,
  data: UpdateProjectInput
): Promise<void> {
  console.log('[PROJECT] Update started:', projectId)

  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() }

  if (data.projectName  !== undefined) patch.projectName  = data.projectName.trim()
  if (data.customerName !== undefined) patch.customerName = data.customerName.trim()
  if (data.partNumber   !== undefined) patch.partNumber   = data.partNumber.trim()
  if (data.partName     !== undefined) patch.partName     = data.partName.trim()
  if (data.drawingNumber   !== undefined) patch.drawingNumber   = data.drawingNumber.trim()
  if (data.drawingRevision !== undefined) patch.drawingRevision = data.drawingRevision.trim()
  if (data.material    !== undefined) patch.material    = data.material.trim()
  if (data.description !== undefined) patch.description = data.description.trim()
  const isManager = callerRole === 'admin' || callerRole === 'super_admin' || callerRole === 'manager'

  if (isManager && data.status !== undefined) patch.status = data.status
  if (isManager && data.priority !== undefined) patch.priority = data.priority
  if (isManager && data.dueDate !== undefined) {
    const [year, month, day] = data.dueDate.split('-').map(Number)
    const dueDate = new Date(year, month - 1, day)
    if (
      !year || !month || !day ||
      dueDate.getFullYear() !== year ||
      dueDate.getMonth() !== month - 1 ||
      dueDate.getDate() !== day
    ) {
      throw new Error('Invalid due date.')
    }
    patch.dueDate = Timestamp.fromDate(dueDate)
  }

  try {
    await updateDoc(doc(firestore, 'projects', projectId), patch)
    console.log('[PROJECT] Update success:', projectId)
  } catch (err) {
    const e = err as { code?: string; message?: string }
    console.error('[PROJECT] Update failed:', e.code, e.message)
    throw err
  }
}

// ─── Delete (permanent) ───────────────────────────────────────────────────────

export async function deleteProject(projectId: string, _uid: string, userEmail: string): Promise<void> {
  console.log('[PROJECT] Delete started:', projectId)

  const userSnap = await getDoc(doc(firestore, 'users', _uid))
  const role = userSnap.data()?.role
  if (role !== 'admin' && role !== 'super_admin' && role !== 'manager') {
    throw new Error('Insufficient permissions to delete project')
  }

  // Load project to read Drive IDs before deleting
  const snap = await getDoc(doc(firestore, 'projects', projectId))
  const project = snap.exists() ? (snap.data() as FAIProject) : null

  const driveFileId   = project?.googleDriveFileId ?? ''
  const driveFolderId = project?.googleDriveProjectFolderId ?? ''

  // Delete Drive file first — permission errors block the entire delete
  if (driveFileId) {
    console.log('[DRIVE] Deleting project PDF:', driveFileId)
    try {
      const accessToken = await requestDriveToken(userEmail)
      await deleteFileFromDrive(accessToken, driveFileId)
      console.log('[DRIVE] PDF deleted')
    } catch (err) {
      const msg = ((err as { message?: string })?.message ?? '').toLowerCase()
      if (msg.includes('403') || msg.includes('permission') || msg.includes('access_denied')) {
        throw new Error(
          'Unable to delete project because the uploaded PDF could not be removed from Google Drive.'
        )
      }
      // 404 or other transient errors — file may already be gone, continue
      console.warn('[DRIVE] PDF delete skipped:', (err as { message?: string })?.message)
    }
  }

  // Delete Drive project folder (best-effort — never blocks Firestore delete)
  if (driveFolderId) {
    console.log('[DRIVE] Deleting project folder:', driveFolderId)
    try {
      const accessToken = await requestDriveToken(userEmail)
      await deleteProjectFolderFromDrive(accessToken, driveFolderId)
      console.log('[DRIVE] Project folder deleted')
    } catch (err) {
      console.warn('[DRIVE] Project folder delete skipped:', (err as { message?: string })?.message)
    }
  }

  // Delete Firestore document
  try {
    await deleteDoc(doc(firestore, 'projects', projectId))
    console.log('[PROJECT] Firestore project deleted')
    console.log('[PROJECT] Delete completed:', projectId)
  } catch (err) {
    const e = err as { code?: string; message?: string }
    console.error('[PROJECT] Delete failed:', e.code, e.message)
    throw err
  }
}
