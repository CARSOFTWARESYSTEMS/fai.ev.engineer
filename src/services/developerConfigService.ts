import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'

export type DeveloperRole = 'developer' | 'admin'

export interface DeveloperRecord {
  email: string
  displayName: string
  role: DeveloperRole
  enabled: boolean
  addedBy: string
  addedAt: Timestamp | null
  updatedAt: Timestamp | null
}

// Collection "developerConfig" — document ID = developer email address
export function subscribeToDevelopers(
  callback: (devs: DeveloperRecord[]) => void,
): () => void {
  const colRef = collection(firestore, 'developerConfig')
  return onSnapshot(
    colRef,
    snapshot => {
      const devs = snapshot.docs.map(d => d.data() as DeveloperRecord)
      callback(devs.sort((a, b) => a.email.localeCompare(b.email)))
    },
    () => callback([]),
  )
}

export async function addDeveloper(
  email: string,
  opts: { displayName: string; role: DeveloperRole; addedBy: string },
): Promise<void> {
  const ref = doc(firestore, 'developerConfig', email)
  await setDoc(ref, {
    email,
    displayName: opts.displayName,
    role:        opts.role,
    enabled:     true,
    addedBy:     opts.addedBy,
    addedAt:     serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
}

export async function toggleDeveloper(email: string, enabled: boolean): Promise<void> {
  const ref = doc(firestore, 'developerConfig', email)
  await updateDoc(ref, { enabled, updatedAt: serverTimestamp() })
}

export async function updateDeveloperRole(email: string, role: DeveloperRole): Promise<void> {
  const ref = doc(firestore, 'developerConfig', email)
  await updateDoc(ref, { role, updatedAt: serverTimestamp() })
}

export async function deleteDeveloper(email: string): Promise<void> {
  const ref = doc(firestore, 'developerConfig', email)
  await deleteDoc(ref)
}
