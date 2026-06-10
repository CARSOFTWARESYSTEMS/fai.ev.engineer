import { doc, getDoc, setDoc, serverTimestamp, type FieldValue } from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import type { Form1Data, Form1Input } from '../types/form1Types'

// Firestore path: projects/{projectId}/form1/{projectId}
// Singleton document per project.

type Form1WriteDoc = Omit<Form1Data, 'updatedAt'> & { updatedAt: FieldValue }

export async function loadForm1(projectId: string): Promise<Form1Data | null> {
  const ref = doc(firestore, 'projects', projectId, 'form1', projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as Form1Data
}

export async function saveForm1(projectId: string, input: Form1Input): Promise<void> {
  const ref = doc(firestore, 'projects', projectId, 'form1', projectId)
  const writeDoc: Form1WriteDoc = { ...input, updatedAt: serverTimestamp() }
  await setDoc(ref, writeDoc, { merge: true })
}
