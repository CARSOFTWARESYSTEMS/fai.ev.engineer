import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type FieldValue,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { FAIProject, CreateProjectInput, UpdateProjectInput } from './project.types'
import { ENGINEER_ALLOWED_STATUSES, VALID_DECISIONS_FOR_STATUS } from './project.types'
import type { UserRole } from '../auth/AuthTypes'
import type { Organisation } from '../services/organisationService'
import { assertOrganisationWritable } from '../services/organisationAccessService'
import { requestDriveToken, deleteFileFromDrive, deleteProjectFolderFromDrive } from '../lib/googleDrive'
import { logProjectCreated } from '../services/userActivityLogService'
import { getOwnerProjectAccessSummaries } from './projectAccessSummary.service'

// Separate write type uses FieldValue for timestamps
type ProjectWriteDoc = Omit<FAIProject, 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue
  updatedAt: FieldValue
}

// ─── Create ───────────────────────────────────────────────────────────────────

interface CreateProjectContext {
  uid: string
  userEmail?: string
  productKey: string
  organizationCode: string
  organizationName: string
  defaultDueDays?: number
  org?: Organisation
}

export async function createProject(
  input: CreateProjectInput,
  ctx: CreateProjectContext
): Promise<FAIProject> {
  if (ctx.org) {
    assertOrganisationWritable(ctx.org, { uid: ctx.uid, actorEmail: ctx.userEmail, action: 'createProject' })
  }

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
    lifecycleStatus: 'active',
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
    if (ctx.userEmail) {
      logProjectCreated({
        ownerUid:    ctx.uid,
        ownerEmail:  ctx.userEmail,
        projectId:   docRef.id,
        projectName: writeDoc.projectName,
      }).catch(() => {})
    }
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

/**
 * Secure owner list: full documents are fetched only for active/inactive projects;
 * blocked entries come exclusively from the sanitized summary collection.
 */
export async function getOwnerAccessibleProjects(uid: string): Promise<FAIProject[]> {
  try {
    const [fullSnapshot, summaries] = await Promise.all([
      getDocs(query(
        collection(firestore, 'projects'),
        where('uid', '==', uid),
        where('lifecycleStatus', 'in', ['active', 'inactive']),
      )),
      getOwnerProjectAccessSummaries(uid),
    ])

    const fullProjects = fullSnapshot.docs.map(item => item.data() as FAIProject)
    const blockedProjects: FAIProject[] = summaries
      .filter(summary => summary.lifecycleStatus === 'blocked')
      .map(summary => ({
        projectId: summary.projectId,
        uid: summary.ownerUid,
        productKey: '',
        organizationCode: '',
        organizationName: '',
        projectName: summary.projectName,
        customerName: '',
        partNumber: summary.partNumber ?? '',
        partName: '',
        drawingNumber: '',
        drawingRevision: '',
        material: '',
        description: '',
        status: summary.status ?? 'draft',
        version: 0,
        sourcePdfName: '',
        googleDriveFileId: '',
        createdAt: null,
        updatedAt: summary.updatedAt ?? null,
        lifecycleStatus: 'blocked',
        accessSummaryOnly: true,
      }))

    return [...fullProjects, ...blockedProjects].sort((a, b) => {
      const millis = (value: unknown) => value && typeof (value as { toMillis?: () => number }).toMillis === 'function'
        ? (value as { toMillis: () => number }).toMillis()
        : 0
      return millis(b.updatedAt) - millis(a.updatedAt)
    })
  } catch (err) {
    console.error('[PROJECT] Failed to fetch accessible owner projects:', err)
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
  uid: string,
  callerRole: UserRole,
  data: UpdateProjectInput,
  org?: Organisation,
): Promise<void> {
  if (org) {
    assertOrganisationWritable(org, { uid, action: 'updateProject' })
  }
  console.log('[PROJECT] Update started:', projectId)

  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }

  if (data.projectName     !== undefined) patch.projectName     = data.projectName.trim()
  if (data.customerName    !== undefined) patch.customerName    = data.customerName.trim()
  if (data.partNumber      !== undefined) patch.partNumber      = data.partNumber.trim()
  if (data.partName        !== undefined) patch.partName        = data.partName.trim()
  if (data.drawingNumber   !== undefined) patch.drawingNumber   = data.drawingNumber.trim()
  if (data.drawingRevision !== undefined) patch.drawingRevision = data.drawingRevision.trim()
  if (data.material        !== undefined) patch.material        = data.material.trim()
  if (data.description     !== undefined) patch.description     = data.description.trim()

  const isManager = callerRole === 'admin' || callerRole === 'super_admin' || callerRole === 'manager'

  // Status — engineers get limited transitions; managers get full workflow
  let currentStatus: string | undefined
  let needsAuditEvent = false

  if (data.status !== undefined) {
    const currentSnap = await getDoc(doc(firestore, 'projects', projectId))
    currentStatus = (currentSnap.data() as FAIProject | undefined)?.status

    if (currentStatus !== data.status) {
      if (!isManager) {
        if (!(ENGINEER_ALLOWED_STATUSES as string[]).includes(data.status)) {
          throw new Error(`Status "${data.status}" can only be set by a Manager.`)
        }
        if (currentStatus === 'completed' || currentStatus === 'archived') {
          throw new Error(`Cannot change status of a ${currentStatus} project.`)
        }
      }

      // Review decision gate — required when Manager moves a project out of 'review'
      if (isManager && currentStatus === 'review' && data.status !== 'review') {
        if (!data.reviewDecision) {
          throw new Error('A review decision is required when moving a project out of Review.')
        }
        if (!data.reviewComment || data.reviewComment.trim().length < 5) {
          throw new Error('A review comment of at least 5 characters is required.')
        }
        const validDecisions = VALID_DECISIONS_FOR_STATUS[data.status]
        if (!validDecisions || !validDecisions.includes(data.reviewDecision)) {
          throw new Error(
            `Decision "${data.reviewDecision}" is not valid for status "${data.status}".`
          )
        }
        patch.reviewDecision = data.reviewDecision
        patch.reviewComment  = data.reviewComment.trim()
        patch.reviewedBy     = uid
        patch.reviewedAt     = serverTimestamp()
        needsAuditEvent = true
      }
    }

    patch.status = data.status

    // Audit metadata on status transitions
    if (data.status === 'completed' && currentStatus !== 'completed') {
      patch.completedAt = serverTimestamp()
      patch.completedBy = uid
    }
    if (data.status === 'archived' && currentStatus !== 'archived') {
      patch.archivedAt = serverTimestamp()
      patch.archivedBy = uid
    }
  }

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
    if (needsAuditEvent && data.reviewDecision) {
      // Atomic: update project + append audit event in one batch
      const batch = writeBatch(firestore)
      batch.update(doc(firestore, 'projects', projectId), patch)
      const auditRef = doc(collection(firestore, 'projects', projectId, 'auditTrail'))
      batch.set(auditRef, {
        eventType:   'review_decision',
        fromStatus:  currentStatus ?? 'review',
        toStatus:    data.status,
        decision:    data.reviewDecision,
        comment:     (data.reviewComment ?? '').trim(),
        changedBy:   uid,
        changedAt:   serverTimestamp(),
        role:        callerRole,
        projectId,
      })
      await batch.commit()
    } else {
      await updateDoc(doc(firestore, 'projects', projectId), patch)
    }
    console.log('[PROJECT] Update success:', projectId)
  } catch (err) {
    const e = err as { code?: string; message?: string }
    console.error('[PROJECT] Update failed:', e.code, e.message)
    throw err
  }
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────
// Projects are soft-deleted by setting lifecycleStatus = 'deleted'.
// Drive files are cleaned up immediately; Firestore record is preserved for audit.
// Hard delete (deleteDoc) is only performed by developer admin for emergency cleanup.

export async function deleteProject(
  projectId: string,
  _uid: string,
  userEmail: string,
  org?: Organisation,
): Promise<void> {
  if (org) {
    assertOrganisationWritable(org, { uid: _uid, actorEmail: userEmail, action: 'deleteProject' })
  }
  console.log('[PROJECT] Soft delete started:', projectId)

  const userSnap = await getDoc(doc(firestore, 'users', _uid))
  const role = userSnap.data()?.role
  if (role !== 'admin' && role !== 'super_admin' && role !== 'manager') {
    throw new Error('Insufficient permissions to delete project')
  }

  // Load project to read Drive IDs
  const snap = await getDoc(doc(firestore, 'projects', projectId))
  const project = snap.exists() ? (snap.data() as FAIProject) : null

  const driveFileId   = project?.googleDriveFileId ?? ''
  const driveFolderId = project?.googleDriveProjectFolderId ?? ''

  // Clean up Drive file — permission errors block the entire operation
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
      console.warn('[DRIVE] PDF delete skipped:', (err as { message?: string })?.message)
    }
  }

  // Clean up Drive project folder (best-effort — never blocks Firestore soft-delete)
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

  // Soft-delete: mark lifecycleStatus = 'deleted' (record preserved for audit)
  try {
    await updateDoc(doc(firestore, 'projects', projectId), {
      lifecycleStatus: 'deleted',
      deletedAt:       serverTimestamp(),
      deletedBy:       userEmail,
      updatedAt:       serverTimestamp(),
    })
    console.log('[PROJECT] Soft delete completed:', projectId)
  } catch (err) {
    const e = err as { code?: string; message?: string }
    console.error('[PROJECT] Soft delete failed:', e.code, e.message)
    throw err
  }
}
