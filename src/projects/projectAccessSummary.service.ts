import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { FAIProject } from './project.types'
import type { ProjectLifecycleStatus } from './projectLifecycle'
import type { ProjectAccessSummary, ProjectSupportContact } from './projectAccessSummary'

export async function getOwnerProjectAccessSummaries(ownerUid: string): Promise<ProjectAccessSummary[]> {
  const snapshot = await getDocs(query(
    collection(firestore, 'projectAccessSummaries'),
    where('ownerUid', '==', ownerUid),
  ))
  return snapshot.docs.map(item => item.data() as ProjectAccessSummary)
}

export async function getProjectAccessSummaryById(projectId: string): Promise<ProjectAccessSummary | null> {
  try {
    const snapshot = await getDoc(doc(firestore, 'projectAccessSummaries', projectId))
    return snapshot.exists() ? snapshot.data() as ProjectAccessSummary : null
  } catch {
    return null
  }
}

/** Admin-only safe upsert. Never copies drawing, PDF, form, or inspection fields. */
export async function ensureProjectAccessSummary(
  projectId: string,
  lifecycleStatus: ProjectLifecycleStatus,
  support: ProjectSupportContact = {},
): Promise<void> {
  const projectSnapshot = await getDoc(doc(firestore, 'projects', projectId))
  if (!projectSnapshot.exists()) throw new Error('Project not found.')
  const project = projectSnapshot.data() as FAIProject & { ownerEmail?: string }

  const summary: Omit<ProjectAccessSummary, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    projectId,
    ownerUid: project.uid,
    lifecycleStatus,
    projectName: project.projectName,
    partNumber: project.partNumber || '',
    status: project.status,
    updatedAt: serverTimestamp(),
  }
  if (project.ownerEmail) summary.ownerEmail = project.ownerEmail
  if (support.supportDomain) summary.supportDomain = support.supportDomain
  if (support.supportEmail) summary.supportEmail = support.supportEmail
  if (support.supportPhone) summary.supportPhone = support.supportPhone
  if (support.supportWhatsapp) summary.supportWhatsapp = support.supportWhatsapp

  await setDoc(doc(firestore, 'projectAccessSummaries', projectId), summary, { merge: true })
}
