import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { ProductId } from '../auth/AuthTypes'

// All product IDs — used as the default entitlement set when a partner has no explicit list
const ALL_PRODUCTS: ProductId[] = ['fai_reports', 'battery_pm', 'motor_pm', 'energy_mgmt', 'clean_room']

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PartnerLifecycleStatus = 'active' | 'disabled' | 'deleted'

export interface Partner {
  partnerId:        string
  name:             string
  code:             string          // short lowercase identifier (e.g. "ifab")
  brandingId?:      string          // reference to brandings/{brandingId}
  primaryDomain:    string          // primary hostname (required; included in domains[])
  domains:          string[]        // all hostnames served by this partner
  supportEmail?:    string
  supportPhone?:    string
  whatsappNumber?:  string
  website?:         string
  enabled:          boolean
  lifecycleStatus:  PartnerLifecycleStatus
  deletedAt?:       Timestamp
  deletedBy?:       string          // email of actor who deleted
  deletedReason?:   string
  enabledProducts:  ProductId[]     // products available to this partner's orgs; defaults to all
  createdAt:        Timestamp | null
  updatedAt:        Timestamp | null
  createdBy:        string          // uid of Platform Admin who created
}

export type CreatePartnerInput = Omit<Partner, 'partnerId' | 'createdAt' | 'updatedAt'>

export type UpdatePartnerInput = Partial<
  Omit<Partner, 'partnerId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'code'>
>

// ─── Internal helpers ──────────────────────────────────────────────────────────

function toPartner(id: string, data: Record<string, unknown>): Partner {
  const domains = (data.domains as string[]) ?? []
  return {
    partnerId:       id,
    name:            (data.name            as string)                  ?? '',
    code:            (data.code            as string)                  ?? '',
    brandingId:      data.brandingId       as string | undefined,
    primaryDomain:   (data.primaryDomain   as string)                  ?? domains[0] ?? '',
    domains,
    supportEmail:    data.supportEmail     as string | undefined,
    supportPhone:    data.supportPhone     as string | undefined,
    whatsappNumber:  data.whatsappNumber   as string | undefined,
    website:         data.website          as string | undefined,
    enabled:         (data.enabled         as boolean)                 ?? true,
    lifecycleStatus: (data.lifecycleStatus as PartnerLifecycleStatus)  ?? 'active',
    deletedAt:       data.deletedAt        as Timestamp | undefined,
    deletedBy:       data.deletedBy        as string | undefined,
    deletedReason:   data.deletedReason    as string | undefined,
    enabledProducts: (data.enabledProducts as ProductId[])             ?? [...ALL_PRODUCTS],
    createdAt:       (data.createdAt       as Timestamp | null)        ?? null,
    updatedAt:       (data.updatedAt       as Timestamp | null)        ?? null,
    createdBy:       (data.createdBy       as string)                  ?? '',
  }
}

// ─── Domain helpers ────────────────────────────────────────────────────────────

export function isValidPartnerDomain(d: string): boolean {
  // Hostname only — reject anything with a protocol, path, or trailing slash
  if (d.includes('://') || d.includes('/')) return false
  return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/.test(d)
}

// ─── Error helper ──────────────────────────────────────────────────────────────

export function getReadablePartnerError(err: unknown): string {
  if (import.meta.env.DEV) console.error('[Partner Error]', err)
  const code = (err as { code?: string })?.code ?? ''
  const msg  = err instanceof Error ? err.message : String(err)
  if (code === 'permission-denied' || msg.includes('permission'))
    return 'Permission denied — your developer account does not have write access'
  if (code === 'already-exists')
    return 'A record with this ID already exists'
  if (code === 'invalid-argument')
    return 'Invalid data — check all required fields are correctly formatted'
  if (code === 'unavailable' || msg.includes('unavailable'))
    return 'Service temporarily unavailable — please try again'
  if (code === 'unauthenticated')
    return 'Session expired — please reload and sign in again'
  if (msg) return msg
  return 'Unknown error — check the browser console for details'
}

// ─── Read operations ───────────────────────────────────────────────────────────

export function subscribePartners(
  callback: (partners: Partner[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'partners'),
    snap => callback(snap.docs.map(d => toPartner(d.id, d.data())).filter(p => p.lifecycleStatus !== 'deleted')),
    () => callback([]),
  )
}

export function subscribeDeletedPartners(
  callback: (partners: Partner[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'partners'),
    snap => callback(snap.docs.map(d => toPartner(d.id, d.data())).filter(p => p.lifecycleStatus === 'deleted')),
    () => callback([]),
  )
}

export function subscribePartnerById(
  partnerId: string,
  callback: (partner: Partner | null) => void,
): () => void {
  return onSnapshot(
    doc(firestore, 'partners', partnerId),
    snap => callback(snap.exists() ? toPartner(snap.id, snap.data()) : null),
    () => callback(null),
  )
}

export async function getPartner(partnerId: string): Promise<Partner | null> {
  const snap = await getDoc(doc(firestore, 'partners', partnerId))
  if (!snap.exists()) return null
  return toPartner(snap.id, snap.data())
}

// ─── Write operations ──────────────────────────────────────────────────────────

export async function createPartner(input: CreatePartnerInput): Promise<string> {
  const ref = await addDoc(collection(firestore, 'partners'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePartner(
  partnerId: string,
  updates: UpdatePartnerInput,
): Promise<void> {
  await updateDoc(doc(firestore, 'partners', partnerId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function disablePartner(partnerId: string): Promise<void> {
  await updateDoc(doc(firestore, 'partners', partnerId), {
    enabled: false,
    updatedAt: serverTimestamp(),
  })
}

export async function enablePartner(partnerId: string): Promise<void> {
  await updateDoc(doc(firestore, 'partners', partnerId), {
    enabled: true,
    updatedAt: serverTimestamp(),
  })
}

export async function updatePartnerEntitlements(
  partnerId: string,
  products:  ProductId[],
): Promise<void> {
  await updateDoc(doc(firestore, 'partners', partnerId), {
    enabledProducts: products,
    updatedAt:       serverTimestamp(),
  })
}

export async function softDeletePartner(
  partnerId: string,
  opts: { reason: string; deletedBy: string },
): Promise<void> {
  await updateDoc(doc(firestore, 'partners', partnerId), {
    lifecycleStatus: 'deleted' satisfies PartnerLifecycleStatus,
    enabled:         false,
    deletedAt:       serverTimestamp(),
    deletedBy:       opts.deletedBy,
    deletedReason:   opts.reason || null,
    updatedAt:       serverTimestamp(),
  })
}

export async function restorePartner(partnerId: string): Promise<void> {
  await updateDoc(doc(firestore, 'partners', partnerId), {
    lifecycleStatus: 'active' satisfies PartnerLifecycleStatus,
    enabled:         true,
    deletedAt:       null,
    deletedBy:       null,
    deletedReason:   null,
    updatedAt:       serverTimestamp(),
  })
}
