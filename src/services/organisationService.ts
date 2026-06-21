import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { ProductId, OrganisationRole } from '../auth/AuthTypes'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OrgStatus = 'active' | 'inactive' | 'trial' | 'suspended'
export type OrgSubscriptionType = 'free' | 'trial' | 'monthly' | 'annual'

export interface Organisation {
  organisationId:         string
  partnerId:              string
  name:                   string
  code:                   string
  status:                 OrgStatus
  ownerUid?:              string
  ownerEmail?:            string
  subscriptionType:       OrgSubscriptionType
  subscriptionStartDate:  Timestamp | null
  subscriptionExpiryDate: Timestamp | null
  currency:               string
  managerLimit:           number
  engineerLimit:          number
  inspectorLimit:         number
  auditorLimit:           number
  approverLimit:          number
  viewerLimit:            number
  enabledProducts:        ProductId[]
  createdAt:              Timestamp | null
  createdBy:              string
  updatedAt:              Timestamp | null
}

export interface OrganisationMember {
  membershipId:   string
  organisationId: string
  userUid:        string
  userEmail:      string
  role:           OrganisationRole
  active:         boolean
  createdAt:      Timestamp | null
  createdBy:      string
}

export interface CreateOrganisationInput {
  partnerId:       string
  name:            string
  code:            string
  ownerEmail?:     string
  currency:        string
  enabledProducts: ProductId[]
  createdBy:       string
}

export type UpdateOrganisationInput = Partial<
  Omit<Organisation, 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'code' | 'partnerId'>
>

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TRIAL_DURATION_DAYS = 7

function toOrganisation(id: string, data: Record<string, unknown>): Organisation {
  return {
    organisationId:         id,
    partnerId:              (data.partnerId              as string)            ?? '',
    name:                   (data.name                   as string)            ?? '',
    code:                   (data.code                   as string)            ?? '',
    status:                 (data.status                 as OrgStatus)         ?? 'trial',
    ownerUid:               data.ownerUid                as string | undefined,
    ownerEmail:             data.ownerEmail              as string | undefined,
    subscriptionType:       (data.subscriptionType       as OrgSubscriptionType) ?? 'trial',
    subscriptionStartDate:  (data.subscriptionStartDate  as Timestamp | null)  ?? null,
    subscriptionExpiryDate: (data.subscriptionExpiryDate as Timestamp | null)  ?? null,
    currency:               (data.currency               as string)            ?? 'INR',
    managerLimit:           (data.managerLimit            as number)           ?? 2,
    engineerLimit:          (data.engineerLimit           as number)           ?? 2,
    inspectorLimit:         (data.inspectorLimit          as number)           ?? 0,
    auditorLimit:           (data.auditorLimit            as number)           ?? 0,
    approverLimit:          (data.approverLimit           as number)           ?? 0,
    viewerLimit:            (data.viewerLimit             as number)           ?? 0,
    enabledProducts:        (data.enabledProducts         as ProductId[])      ?? [],
    createdAt:              (data.createdAt               as Timestamp | null) ?? null,
    createdBy:              (data.createdBy               as string)           ?? '',
    updatedAt:              (data.updatedAt               as Timestamp | null) ?? null,
  }
}

function toMember(id: string, data: Record<string, unknown>): OrganisationMember {
  return {
    membershipId:   id,
    organisationId: (data.organisationId as string)           ?? '',
    userUid:        (data.userUid        as string)           ?? '',
    userEmail:      (data.userEmail      as string)           ?? '',
    role:           (data.role           as OrganisationRole) ?? 'viewer',
    active:         (data.active         as boolean)          ?? true,
    createdAt:      (data.createdAt      as Timestamp | null) ?? null,
    createdBy:      (data.createdBy      as string)           ?? '',
  }
}

export function getOrganisationStatus(org: Organisation): OrgStatus {
  if (org.status === 'inactive') return 'inactive'
  if (!org.subscriptionExpiryDate) return org.status
  if (Date.now() > org.subscriptionExpiryDate.toMillis()) return 'suspended'
  return org.subscriptionType === 'trial' ? 'trial' : 'active'
}

export function formatOrgExpiry(org: Organisation): string {
  if (!org.subscriptionExpiryDate) return '—'
  return new Date(org.subscriptionExpiryDate.seconds * 1000).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// ─── Read operations ───────────────────────────────────────────────────────────

export async function getOrganisation(id: string): Promise<Organisation | null> {
  const snap = await getDoc(doc(firestore, 'organisations', id))
  if (!snap.exists()) return null
  return toOrganisation(snap.id, snap.data())
}

export function subscribeOrganisation(
  id: string,
  callback: (org: Organisation | null) => void,
): () => void {
  return onSnapshot(
    doc(firestore, 'organisations', id),
    snap => callback(snap.exists() ? toOrganisation(snap.id, snap.data()) : null),
    () => callback(null),
  )
}

export function subscribeAllOrganisations(
  callback: (orgs: Organisation[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'organisations'),
    snap => callback(snap.docs.map(d => toOrganisation(d.id, d.data()))),
    () => callback([]),
  )
}

export function subscribePartnerOrganisations(
  partnerId: string,
  callback: (orgs: Organisation[]) => void,
): () => void {
  return onSnapshot(
    query(collection(firestore, 'organisations'), where('partnerId', '==', partnerId)),
    snap => callback(snap.docs.map(d => toOrganisation(d.id, d.data()))),
    () => callback([]),
  )
}

export function subscribeOrganisationMembers(
  organisationId: string,
  callback: (members: OrganisationMember[]) => void,
): () => void {
  return onSnapshot(
    query(
      collection(firestore, 'organisationMembers'),
      where('organisationId', '==', organisationId),
    ),
    snap => callback(snap.docs.map(d => toMember(d.id, d.data()))),
    () => callback([]),
  )
}

// ─── Write operations ──────────────────────────────────────────────────────────

export async function createOrganisation(input: CreateOrganisationInput): Promise<string> {
  const now      = Timestamp.now()
  const expiry   = Timestamp.fromMillis(now.toMillis() + TRIAL_DURATION_DAYS * 86_400_000)

  const ref = await addDoc(collection(firestore, 'organisations'), {
    partnerId:              input.partnerId,
    name:                   input.name,
    code:                   input.code,
    status:                 'trial',
    ownerEmail:             input.ownerEmail ?? null,
    ownerUid:               null,
    subscriptionType:       'trial',
    subscriptionStartDate:  now,
    subscriptionExpiryDate: expiry,
    currency:               input.currency,
    managerLimit:           2,
    engineerLimit:          2,
    inspectorLimit:         0,
    auditorLimit:           0,
    approverLimit:          0,
    viewerLimit:            0,
    enabledProducts:        input.enabledProducts,
    createdAt:              serverTimestamp(),
    createdBy:              input.createdBy,
    updatedAt:              serverTimestamp(),
  })

  return ref.id
}

export async function updateOrganisation(
  id: string,
  updates: UpdateOrganisationInput,
): Promise<void> {
  await updateDoc(doc(firestore, 'organisations', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function archiveOrganisation(id: string): Promise<void> {
  await updateDoc(doc(firestore, 'organisations', id), {
    status:    'inactive',
    updatedAt: serverTimestamp(),
  })
}

export async function addOrganisationMember(opts: {
  organisationId: string
  userUid:        string
  userEmail:      string
  role:           OrganisationRole
  createdBy:      string
}): Promise<string> {
  const ref = await addDoc(collection(firestore, 'organisationMembers'), {
    organisationId: opts.organisationId,
    userUid:        opts.userUid,
    userEmail:      opts.userEmail,
    role:           opts.role,
    active:         true,
    createdAt:      serverTimestamp(),
    createdBy:      opts.createdBy,
  })
  return ref.id
}

export async function removeOrganisationMember(membershipId: string): Promise<void> {
  await updateDoc(doc(firestore, 'organisationMembers', membershipId), {
    active: false,
  })
}
