import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
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

export function subscribeToForm3Results(
  projectId: string,
  onUpdate: (results: Form3Result[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'projects', projectId, 'form3Results'),
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Form3Result)),
    err => console.error('[form3Service] snapshot error:', err),
  )
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
  // Attempt an update first (preserves createdAt on existing docs).
  // On 'not-found', fall through to setDoc with createdAt on first write.
  try {
    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() })
  } catch (err) {
    if ((err as { code?: string })?.code === 'not-found') {
      const writeDoc: Form3WriteDoc = {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      await setDoc(ref, writeDoc)
    } else {
      throw err
    }
  }
}
