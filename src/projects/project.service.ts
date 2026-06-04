import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type FieldValue,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { FAIProject, CreateProjectInput } from './project.types'

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
}

export async function createProject(
  input: CreateProjectInput,
  ctx: CreateProjectContext
): Promise<FAIProject> {
  const docRef = doc(collection(firestore, 'projects'))

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
