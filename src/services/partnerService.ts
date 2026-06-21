import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { ProductId } from '../auth/AuthTypes'

// All product IDs — used as the default entitlement set when a partner has no explicit list
const ALL_PRODUCTS: ProductId[] = ['fai_reports', 'battery_pm', 'motor_pm', 'energy_mgmt', 'clean_room']

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Partner {
  partnerId:       string
  name:            string
  code:            string          // short lowercase identifier (e.g. "ifab")
  brandingId?:     string          // reference to brandings/{brandingId}
  domains:         string[]        // hostnames served by this partner
  supportEmail?:   string
  supportPhone?:   string
  website?:        string
  enabled:         boolean
  enabledProducts: ProductId[]     // products available to this partner's orgs; defaults to all
  createdAt:       Timestamp | null
  updatedAt:       Timestamp | null
  createdBy:       string          // uid of Platform Admin who created
}

export type CreatePartnerInput = Omit<Partner, 'partnerId' | 'createdAt' | 'updatedAt'>

export type UpdatePartnerInput = Partial<
  Omit<Partner, 'partnerId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'code'>
>

// ─── Internal helpers ──────────────────────────────────────────────────────────

function toPartner(id: string, data: Record<string, unknown>): Partner {
  return {
    partnerId:    id,
    name:         (data.name as string)         ?? '',
    code:         (data.code as string)         ?? '',
    brandingId:   data.brandingId  as string | undefined,
    domains:      (data.domains    as string[]) ?? [],
    supportEmail: data.supportEmail as string | undefined,
    supportPhone: data.supportPhone as string | undefined,
    website:      data.website      as string | undefined,
    enabled:         (data.enabled         as boolean)     ?? true,
    enabledProducts: (data.enabledProducts as ProductId[]) ?? [...ALL_PRODUCTS],
    createdAt:       (data.createdAt       as Timestamp | null) ?? null,
    updatedAt:    (data.updatedAt  as Timestamp | null) ?? null,
    createdBy:    (data.createdBy  as string)   ?? '',
  }
}

// ─── Read operations ───────────────────────────────────────────────────────────

export function subscribePartners(
  callback: (partners: Partner[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'partners'),
    snap => callback(snap.docs.map(d => toPartner(d.id, d.data()))),
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
