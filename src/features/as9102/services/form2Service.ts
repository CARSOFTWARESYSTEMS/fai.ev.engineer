import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp, type FieldValue,
} from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import type { Form2Row, Form2RowInput, Form2RowUpdateInput } from '../types/form2Types'

// Firestore path: projects/{projectId}/form2Rows/{rowId}

type Form2WriteDoc = Omit<Form2Row, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue
  updatedAt: FieldValue
}

export function subscribeToForm2Rows(
  projectId: string,
  onUpdate: (rows: Form2Row[]) => void,
): () => void {
  const q = query(
    collection(firestore, 'projects', projectId, 'form2Rows'),
    orderBy('rowOrder', 'asc'),
  )
  return onSnapshot(
    q,
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Form2Row)),
    err => console.error('[form2Service] snapshot error:', err),
  )
}

export async function loadForm2Rows(projectId: string): Promise<Form2Row[]> {
  const q = query(
    collection(firestore, 'projects', projectId, 'form2Rows'),
    orderBy('rowOrder', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Form2Row)
}

export async function addForm2RowDoc(projectId: string, input: Form2RowInput): Promise<string> {
  const ref = doc(collection(firestore, 'projects', projectId, 'form2Rows'))
  const writeDoc: Form2WriteDoc = { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
  await setDoc(ref, writeDoc)
  return ref.id
}

export async function updateForm2RowDoc(
  projectId: string,
  rowId: string,
  data: Form2RowUpdateInput,
): Promise<void> {
  await updateDoc(
    doc(firestore, 'projects', projectId, 'form2Rows', rowId),
    { ...data, updatedAt: serverTimestamp() },
  )
}

export async function deleteForm2RowDoc(projectId: string, rowId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'projects', projectId, 'form2Rows', rowId))
}
