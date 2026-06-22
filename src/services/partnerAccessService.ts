import { useEffect, useState } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import { useAuth } from '../auth/hooks/useAuth'
import { useDeveloperAccess } from './useDeveloperAccess'
import { subscribePartners, subscribePartnerById, type Partner } from './partnerService'
import { logPartnerAdminAssigned, logPartnerAdminRevoked } from './userActivityLogService'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PartnerAdminRole = 'partner_super_admin' | 'partner_admin'

export interface PartnerAdminRecord {
  uid:         string
  email:       string
  displayName: string
  partnerIds:  string[]                               // may manage multiple partners
  role?:       PartnerAdminRole                       // role within partner
  status:      'active' | 'deactivated' | 'pending'  // pending = email stored, user not yet registered
  addedBy:     string                                 // uid of Platform Admin who granted access
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
        role:        d.role          as PartnerAdminRole | undefined,
        status:      (d.status       as 'active' | 'deactivated' | 'pending') ?? 'deactivated',
        addedBy:     (d.addedBy      as string) ?? '',
        addedAt:     (d.addedAt      as Timestamp | null) ?? null,
      })
    },
    () => callback(null),
  )
}

// ─── Write: assign partner admin (Platform Developer only) ─────────────────────

export async function assignPartnerAdmin(opts: {
  uid:          string
  email:        string
  displayName:  string
  partnerId:    string
  addedBy:      string   // uid of platform admin performing the assignment
  addedByEmail?: string
}): Promise<void> {
  const { uid, email, displayName, partnerId, addedBy, addedByEmail } = opts
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
      if (addedByEmail) {
        logPartnerAdminAssigned({
          targetUid:   uid,
          targetEmail: email,
          partnerId,
          actorUid:    addedBy,
          actorEmail:  addedByEmail,
        }).catch(() => {})
      }
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
    if (addedByEmail) {
      logPartnerAdminAssigned({
        targetUid:   uid,
        targetEmail: email,
        partnerId,
        actorUid:    addedBy,
        actorEmail:  addedByEmail,
      }).catch(() => {})
    }
  }
}

export async function deactivatePartnerAdmin(uid: string): Promise<void> {
  await setDoc(doc(firestore, 'partnerAdmins', uid), { status: 'deactivated' }, { merge: true })
}

export async function reactivatePartnerAdmin(uid: string): Promise<void> {
  const snap = await getDoc(doc(firestore, 'partnerAdmins', uid))
  if (!snap.exists()) return
  const partnerIds = (snap.data().partnerIds as string[]) ?? []
  if (partnerIds.length > 0) {
    await setDoc(doc(firestore, 'partnerAdmins', uid), { status: 'active' }, { merge: true })
  }
}

export async function revokePartnerAdmin(
  uid: string,
  partnerId: string,
  revokedBy?: { uid: string; email: string },
): Promise<void> {
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
  if (revokedBy) {
    logPartnerAdminRevoked({
      targetUid:   uid,
      targetEmail: (current.email as string) ?? '',
      partnerId,
      actorUid:    revokedBy.uid,
      actorEmail:  revokedBy.email,
    }).catch(() => {})
  }
}

// ─── Subscribe to all admins for a given partner ──────────────────────────────

function toRecord(id: string, d: Record<string, unknown>): PartnerAdminRecord {
  return {
    uid:         id,
    email:       (d.email        as string) ?? '',
    displayName: (d.displayName  as string) ?? '',
    partnerIds:  (d.partnerIds   as string[]) ?? [],
    role:        d.role          as PartnerAdminRole | undefined,
    status:      (d.status       as 'active' | 'deactivated' | 'pending') ?? 'deactivated',
    addedBy:     (d.addedBy      as string) ?? '',
    addedAt:     (d.addedAt      as Timestamp | null) ?? null,
  }
}

export function subscribePartnerAdmins(
  partnerId: string,
  callback:  (records: PartnerAdminRecord[]) => void,
): () => void {
  return onSnapshot(
    query(
      collection(firestore, 'partnerAdmins'),
      where('partnerIds', 'array-contains', partnerId),
    ),
    snap => callback(snap.docs.map(d => toRecord(d.id, d.data()))),
    () => callback([]),
  )
}

// ─── Assign a pending (unregistered) email as partner admin ──────────────────

export async function assignPendingPartnerAdmin(opts: {
  email:        string
  role:         PartnerAdminRole
  partnerId:    string
  addedBy:      string
  addedByEmail?: string
}): Promise<void> {
  // Use a deterministic doc ID so duplicate calls are idempotent
  const safeId = 'pending_' + opts.email.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const ref    = doc(firestore, 'partnerAdmins', safeId)
  const snap   = await getDoc(ref)

  if (snap.exists()) {
    const current     = snap.data()
    const existingIds = (current.partnerIds as string[]) ?? []
    if (!existingIds.includes(opts.partnerId)) {
      await setDoc(ref, {
        ...current,
        partnerIds: [...existingIds, opts.partnerId],
        role:       opts.role,
      }, { merge: true })
    }
  } else {
    await setDoc(ref, {
      uid:         null,
      email:       opts.email.toLowerCase(),
      displayName: '',
      partnerIds:  [opts.partnerId],
      role:        opts.role,
      status:      'pending',
      addedBy:     opts.addedBy,
      addedAt:     serverTimestamp(),
    })
  }
}

// ─── Auto-claim pending partner admin record on registration ──────────────────
// Called during CompleteProfile. If a pending_{email} record exists, promotes it
// to an active record keyed by the new user's UID. Idempotent — safe to call twice.

export async function claimPendingPartnerAdmin(opts: {
  email:       string
  uid:         string
  displayName: string
}): Promise<void> {
  const safeId     = 'pending_' + opts.email.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const pendingRef = doc(firestore, 'partnerAdmins', safeId)
  const pendingSnap = await getDoc(pendingRef)
  if (!pendingSnap.exists()) return
  const pending = pendingSnap.data()
  if (pending.status !== 'pending') return

  const activeRef   = doc(firestore, 'partnerAdmins', opts.uid)
  const activeSnap  = await getDoc(activeRef)

  if (activeSnap.exists()) {
    // Merge partner IDs into existing active record
    const existingIds = (activeSnap.data().partnerIds as string[]) ?? []
    const pendingIds  = (pending.partnerIds as string[]) ?? []
    const merged      = [...new Set([...existingIds, ...pendingIds])]
    await setDoc(activeRef, { partnerIds: merged, status: 'active' }, { merge: true })
  } else {
    await setDoc(activeRef, {
      uid:         opts.uid,
      email:       opts.email.toLowerCase(),
      displayName: opts.displayName,
      partnerIds:  (pending.partnerIds as string[]) ?? [],
      role:        pending.role,
      status:      'active',
      addedBy:     pending.addedBy,
      addedAt:     pending.addedAt,
      claimedAt:   serverTimestamp(),
    })
  }

  // Remove the pending record
  await deleteDoc(pendingRef)
  console.log('[PARTNER] Pending admin claimed for:', opts.email)
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
