import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type FieldValue,
} from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import type { Balloon } from '../types/balloonTypes'

// Firestore path: projects/{projectId}/balloons/{balloonId}

type BalloonWriteDoc = Omit<Balloon, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue
  updatedAt: FieldValue
}

export async function loadBalloons(projectId: string): Promise<Balloon[]> {
  const q = query(
    collection(firestore, 'projects', projectId, 'balloons'),
    orderBy('balloonNumber', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Balloon)
}

export async function addBalloonDoc(
  projectId: string,
  data: Omit<Balloon, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  console.log('[balloonService] addBalloonDoc — path: projects/', projectId, '/balloons | data:', data)
  const newRef = doc(collection(firestore, 'projects', projectId, 'balloons'))
  const writeDoc: BalloonWriteDoc = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(newRef, writeDoc)
  console.log('[balloonService] addBalloonDoc SUCCESS — id:', newRef.id)
  return newRef.id
}

export async function updateBalloonPositionDoc(
  projectId: string,
  balloonId: string,
  xPercent: number,
  yPercent: number,
): Promise<void> {
  await updateDoc(
    doc(firestore, 'projects', projectId, 'balloons', balloonId),
    { xPercent, yPercent, updatedAt: serverTimestamp() },
  )
}

export async function deleteBalloonDoc(
  projectId: string,
  balloonId: string,
): Promise<void> {
  await deleteDoc(doc(firestore, 'projects', projectId, 'balloons', balloonId))
}
