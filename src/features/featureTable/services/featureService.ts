import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type FieldValue,
} from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import type { Feature, FeatureInput, FeatureUpdateInput } from '../types/featureTypes'

// Firestore path: projects/{projectId}/features/{featureId}

type FeatureWriteDoc = Omit<Feature, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue
  updatedAt: FieldValue
}

export function subscribeToFeatures(
  projectId: string,
  onUpdate: (features: Feature[]) => void,
): () => void {
  const q = query(
    collection(firestore, 'projects', projectId, 'features'),
    orderBy('featureNumber', 'asc'),
  )
  return onSnapshot(
    q,
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Feature)),
    err => console.error('[featureService] snapshot error:', err),
  )
}

export async function loadFeatures(projectId: string): Promise<Feature[]> {
  const q = query(
    collection(firestore, 'projects', projectId, 'features'),
    orderBy('featureNumber', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Feature)
}

export async function addFeatureDoc(
  projectId: string,
  data: FeatureInput,
): Promise<string> {
  const newRef = doc(collection(firestore, 'projects', projectId, 'features'))
  const writeDoc: FeatureWriteDoc = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(newRef, writeDoc)
  return newRef.id
}

export async function updateFeatureDoc(
  projectId: string,
  featureId: string,
  data: FeatureUpdateInput,
): Promise<void> {
  await updateDoc(
    doc(firestore, 'projects', projectId, 'features', featureId),
    { ...data, updatedAt: serverTimestamp() },
  )
}

export async function deleteFeatureDoc(
  projectId: string,
  featureId: string,
): Promise<void> {
  await deleteDoc(doc(firestore, 'projects', projectId, 'features', featureId))
}
