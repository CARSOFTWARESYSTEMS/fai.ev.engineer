import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  type FieldValue,
} from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import type { Form3Result, Form3ResultInput } from '../types/form3Types'

// Firestore path: projects/{projectId}/form3Results/{featureId}
// featureId is used as the document ID to guarantee 1:1 mapping per feature.

type Form3WriteDoc = Omit<Form3Result, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue
  updatedAt: FieldValue
}

export async function loadForm3Results(projectId: string): Promise<Map<string, Form3Result>> {
  const snap = await getDocs(
    collection(firestore, 'projects', projectId, 'form3Results'),
  )
  const map = new Map<string, Form3Result>()
  snap.docs.forEach(d => {
    const r = { id: d.id, ...d.data() } as Form3Result
    map.set(r.featureId, r)
  })
  return map
}

export async function upsertForm3ResultDoc(
  projectId: string,
  featureId: string,
  input: Form3ResultInput,
): Promise<void> {
  const ref = doc(firestore, 'projects', projectId, 'form3Results', featureId)
  const writeDoc: Form3WriteDoc = {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  // merge: true so we never accidentally delete fields added in future schema versions
  await setDoc(ref, writeDoc, { merge: true })
}
