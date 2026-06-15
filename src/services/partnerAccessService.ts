import { useEffect, useState } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import { useAuth } from '../auth/hooks/useAuth'
import { useDeveloperAccess } from './useDeveloperAccess'
import { subscribePartners, subscribePartnerById, type Partner } from './partnerService'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PartnerAdminRecord {
  uid:         string
  email:       string
  displayName: string
  partnerIds:  string[]                  // may manage multiple partners
  status:      'active' | 'deactivated'
  addedBy:     string                   // uid of Platform Admin who granted access
  addedAt:     Timestamp | null
}

// ─── Async helpers ─────────────────────────────────────────────────────────────

export async function isPartnerAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(firestore, 'partnerAdmins', uid))
  if (!snap.exists()) return false
  const data = snap.data()
  return data?.status === 'active' && ((data?.partnerIds as string[] | undefined)?.length ?? 0) > 0
}

export async function getPartnerForUser(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(firestore, 'partnerAdmins', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data?.status !== 'active') return null
  return (data?.partnerIds as string[] | undefined)?.[0] ?? null
}

// ─── Subscribe to a user's partner admin record ────────────────────────────────

export function subscribePartnerAccess(
  uid: string,
  callback: (record: PartnerAdminRecord | null) => void,
): () => void {
  return onSnapshot(
    doc(firestore, 'partnerAdmins', uid),
    snap => {
      if (!snap.exists()) { callback(null); return }
      const d = snap.data()
      callback({
        uid:         snap.id,
        email:       (d.email        as string) ?? '',
        displayName: (d.displayName  as string) ?? '',
        partnerIds:  (d.partnerIds   as string[]) ?? [],
        status:      (d.status       as 'active' | 'deactivated') ?? 'deactivated',
        addedBy:     (d.addedBy      as string) ?? '',
        addedAt:     (d.addedAt      as Timestamp | null) ?? null,
      })
    },
    () => callback(null),
  )
}

// ─── Write: assign partner admin (Platform Developer only) ─────────────────────

export async function assignPartnerAdmin(opts: {
  uid:         string
  email:       string
  displayName: string
  partnerId:   string
  addedBy:     string   // uid of platform admin performing the assignment
}): Promise<void> {
  const { uid, email, displayName, partnerId, addedBy } = opts
  const ref  = doc(firestore, 'partnerAdmins', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const current     = snap.data()
    const existingIds = (current.partnerIds as string[]) ?? []
    if (!existingIds.includes(partnerId)) {
      await setDoc(ref, {
        ...current,
        partnerIds: [...existingIds, partnerId],
        status: 'active',
      }, { merge: true })
    }
  } else {
    await setDoc(ref, {
      uid,
      email,
      displayName,
      partnerIds: [partnerId],
      status:     'active',
      addedBy,
      addedAt:    serverTimestamp(),
    })
  }
}

export async function revokePartnerAdmin(uid: string, partnerId: string): Promise<void> {
  const ref  = doc(firestore, 'partnerAdmins', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const current     = snap.data()
  const remaining   = ((current.partnerIds as string[]) ?? []).filter(id => id !== partnerId)
  await setDoc(ref, {
    ...current,
    partnerIds: remaining,
    status:     remaining.length === 0 ? 'deactivated' : 'active',
  }, { merge: true })
}

// ─── Hook: partner access state ────────────────────────────────────────────────

export interface PartnerAccessState {
  isPartnerAdminUser: boolean    // user has an active partnerAdmins record
  partnerIds:         string[]
  primaryPartnerId:   string | null
  isLoading:          boolean
}

export function usePartnerAccess(): PartnerAccessState {
  const { firebaseUser } = useAuth()
  const [state, setState] = useState<PartnerAccessState>({
    isPartnerAdminUser: false,
    partnerIds:         [],
    primaryPartnerId:   null,
    isLoading:          true,
  })

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setState({ isPartnerAdminUser: false, partnerIds: [], primaryPartnerId: null, isLoading: false })
      return
    }
    return subscribePartnerAccess(firebaseUser.uid, record => {
      const active = record?.status === 'active' && (record?.partnerIds?.length ?? 0) > 0
      setState({
        isPartnerAdminUser: active,
        partnerIds:         record?.partnerIds ?? [],
        primaryPartnerId:   active ? (record!.partnerIds[0] ?? null) : null,
        isLoading:          false,
      })
    })
  }, [firebaseUser?.uid])

  return state
}

// ─── Hook: resolved current partner ───────────────────────────────────────────

export interface CurrentPartnerState {
  partner:   Partner | null
  partners:  Partner[]   // all partners (for developer accounts)
  isLoading: boolean
}

export function useCurrentPartner(): CurrentPartnerState {
  const { isDeveloper } = useDeveloperAccess()
  const { primaryPartnerId, isLoading: accessLoading } = usePartnerAccess()
  const [partner,  setPartner]  = useState<Partner | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (accessLoading) return

    if (primaryPartnerId) {
      // Partner admin (or developer who also has a partnerAdmin record)
      return subscribePartnerById(primaryPartnerId, p => {
        setPartner(p)
        setPartners(p ? [p] : [])
        setLoading(false)
      })
    }

    if (isDeveloper) {
      // Platform developer with no specific partner record — subscribe to all
      return subscribePartners(list => {
        setPartners(list)
        setPartner(list[0] ?? null)
        setLoading(false)
      })
    }

    setPartner(null)
    setPartners([])
    setLoading(false)
  }, [isDeveloper, primaryPartnerId, accessLoading])

  return { partner, partners, isLoading: loading || accessLoading }
}
