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
export type OrgLifecycleStatus = 'active' | 'deleted'

// Tracks the lifecycle state of a membership record
export type MembershipStatus = 'pending' | 'active' | 'inactive' | 'removed'

export interface Organisation {
  organisationId:         string
  partnerId:              string
  name:                   string
  code:                   string
  status:                 OrgStatus
  lifecycleStatus:        OrgLifecycleStatus
  deletedAt?:             Timestamp
  deletedBy?:             string
  deletedReason?:         string
  ownerUid?:              string
  ownerEmail?:            string
  subscriptionType:       OrgSubscriptionType
  subscriptionStartDate:  Timestamp | null
  subscriptionExpiryDate: Timestamp | null
  currency:               string
  // Billing
  totalAmount:            number
  discountAmount:         number
  paidAmount:             number
  balanceAmount:          number
  subscriptionNotes?:     string
  // Seat limits (ownerLimit enforces max 1 owner)
  ownerLimit:             number
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
  membershipId:     string
  organisationId:   string
  userUid:          string
  userEmail:        string
  role:             OrganisationRole
  membershipStatus: MembershipStatus
  // active mirrors membershipStatus === 'active' || membershipStatus === 'pending'
  // kept for backwards compatibility with Sprint 7 data
  active:           boolean
  createdAt:        Timestamp | null
  createdBy:        string
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

export interface SoftDeleteOrganisationInput {
  reason:      string
  deletedBy:   string   // email
  deletedByUid: string
}

// ─── Seat limit helpers ────────────────────────────────────────────────────────

const ROLE_LIMIT_KEY: Record<OrganisationRole, keyof Organisation> = {
  owner:     'ownerLimit',
  manager:   'managerLimit',
  engineer:  'engineerLimit',
  inspector: 'inspectorLimit',
  auditor:   'auditorLimit',
  approver:  'approverLimit',
  viewer:    'viewerLimit',
}

export function canAddOrganisationMember(
  org:     Organisation,
  members: OrganisationMember[],
  role:    OrganisationRole,
): boolean {
  const limitKey = ROLE_LIMIT_KEY[role]
  const limit    = org[limitKey] as number
  if (limit === 0) return false
  const current = members.filter(
    m => m.role === role && (m.membershipStatus === 'active' || m.membershipStatus === 'pending'),
  ).length
  return current < limit
}

export function getSeatLimitMessage(role: OrganisationRole): string {
  const label: Record<OrganisationRole, string> = {
    owner:     'Owner',
    manager:   'Manager',
    engineer:  'Engineer',
    inspector: 'Inspector',
    auditor:   'Auditor',
    approver:  'Approver',
    viewer:    'Viewer',
  }
  return `${label[role]} seat limit reached. Contact Partner Admin to increase limits.`
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TRIAL_DURATION_DAYS = 7

function toOrganisation(id: string, data: Record<string, unknown>): Organisation {
  return {
    organisationId:         id,
    partnerId:              (data.partnerId              as string)            ?? '',
    name:                   (data.name                   as string)            ?? '',
    code:                   (data.code                   as string)            ?? '',
    status:                 (data.status                 as OrgStatus)         ?? 'trial',
    lifecycleStatus:        (data.lifecycleStatus        as OrgLifecycleStatus) ?? 'active',
    deletedAt:              data.deletedAt               as Timestamp | undefined,
    deletedBy:              data.deletedBy               as string | undefined,
    deletedReason:          data.deletedReason           as string | undefined,
    ownerUid:               data.ownerUid                as string | undefined,
    ownerEmail:             data.ownerEmail              as string | undefined,
    subscriptionType:       (data.subscriptionType       as OrgSubscriptionType) ?? 'trial',
    subscriptionStartDate:  (data.subscriptionStartDate  as Timestamp | null)  ?? null,
    subscriptionExpiryDate: (data.subscriptionExpiryDate as Timestamp | null)  ?? null,
    currency:               (data.currency               as string)            ?? 'INR',
    totalAmount:            (data.totalAmount             as number)           ?? 0,
    discountAmount:         (data.discountAmount          as number)           ?? 0,
    paidAmount:             (data.paidAmount              as number)           ?? 0,
    balanceAmount:          (data.balanceAmount           as number)           ?? 0,
    subscriptionNotes:      data.subscriptionNotes        as string | undefined,
    ownerLimit:             (data.ownerLimit              as number)           ?? 1,
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

function deriveActive(ms: MembershipStatus): boolean {
  return ms === 'active' || ms === 'pending'
}

function toMember(id: string, data: Record<string, unknown>): OrganisationMember {
  // Derive membershipStatus from legacy active field for Sprint 7 documents
  let membershipStatus: MembershipStatus =
    (data.membershipStatus as MembershipStatus | undefined) ?? 'active'
  if (!data.membershipStatus) {
    membershipStatus = (data.active as boolean) === false ? 'removed' : 'active'
  }
  return {
    membershipId:     id,
    organisationId:   (data.organisationId as string)           ?? '',
    userUid:          (data.userUid        as string)           ?? '',
    userEmail:        (data.userEmail      as string)           ?? '',
    role:             (data.role           as OrganisationRole) ?? 'viewer',
    membershipStatus,
    active:           deriveActive(membershipStatus),
    createdAt:        (data.createdAt      as Timestamp | null) ?? null,
    createdBy:        (data.createdBy      as string)           ?? '',
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
    snap => callback(snap.docs.map(d => toOrganisation(d.id, d.data())).filter(o => o.lifecycleStatus !== 'deleted')),
    () => callback([]),
  )
}

export function subscribePartnerOrganisations(
  partnerId: string,
  callback: (orgs: Organisation[]) => void,
): () => void {
  return onSnapshot(
    query(collection(firestore, 'organisations'), where('partnerId', '==', partnerId)),
    snap => callback(snap.docs.map(d => toOrganisation(d.id, d.data())).filter(o => o.lifecycleStatus !== 'deleted')),
    () => callback([]),
  )
}

export function subscribeDeletedOrganisations(
  callback: (orgs: Organisation[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'organisations'),
    snap => callback(snap.docs.map(d => toOrganisation(d.id, d.data())).filter(o => o.lifecycleStatus === 'deleted')),
    () => callback([]),
  )
}

export function subscribeDeletedPartnerOrganisations(
  partnerId: string,
  callback: (orgs: Organisation[]) => void,
): () => void {
  return onSnapshot(
    query(collection(firestore, 'organisations'), where('partnerId', '==', partnerId)),
    snap => callback(snap.docs.map(d => toOrganisation(d.id, d.data())).filter(o => o.lifecycleStatus === 'deleted')),
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
    lifecycleStatus:        'active' satisfies OrgLifecycleStatus,
    status:                 'trial',
    ownerEmail:             input.ownerEmail ?? null,
    ownerUid:               null,
    subscriptionType:       'trial',
    subscriptionStartDate:  now,
    subscriptionExpiryDate: expiry,
    currency:               input.currency,
    totalAmount:            0,
    discountAmount:         0,
    paidAmount:             0,
    balanceAmount:          0,
    subscriptionNotes:      null,
    ownerLimit:             1,
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

export async function softDeleteOrganisation(
  id:    string,
  input: SoftDeleteOrganisationInput,
): Promise<void> {
  await updateDoc(doc(firestore, 'organisations', id), {
    lifecycleStatus: 'deleted' satisfies OrgLifecycleStatus,
    deletedAt:       serverTimestamp(),
    deletedBy:       input.deletedBy,
    deletedReason:   input.reason || null,
    updatedAt:       serverTimestamp(),
  })
}

export async function restoreOrganisation(id: string): Promise<void> {
  await updateDoc(doc(firestore, 'organisations', id), {
    lifecycleStatus: 'active' satisfies OrgLifecycleStatus,
    deletedAt:       null,
    deletedBy:       null,
    deletedReason:   null,
    updatedAt:       serverTimestamp(),
  })
}

// ─── Member write operations ───────────────────────────────────────────────────

export async function addOrganisationMember(opts: {
  organisationId: string
  userUid:        string
  userEmail:      string
  role:           OrganisationRole
  createdBy:      string
}): Promise<string> {
  const membershipStatus: MembershipStatus = opts.userUid ? 'active' : 'pending'
  const ref = await addDoc(collection(firestore, 'organisationMembers'), {
    organisationId:   opts.organisationId,
    userUid:          opts.userUid,
    userEmail:        opts.userEmail,
    role:             opts.role,
    membershipStatus,
    active:           deriveActive(membershipStatus),
    createdAt:        serverTimestamp(),
    createdBy:        opts.createdBy,
  })
  return ref.id
}

export async function updateMemberRole(
  membershipId: string,
  newRole:      OrganisationRole,
): Promise<void> {
  await updateDoc(doc(firestore, 'organisationMembers', membershipId), {
    role: newRole,
  })
}

export async function deactivateMember(membershipId: string): Promise<void> {
  await updateDoc(doc(firestore, 'organisationMembers', membershipId), {
    membershipStatus: 'inactive' satisfies MembershipStatus,
    active:           false,
  })
}

export async function reactivateMember(membershipId: string): Promise<void> {
  await updateDoc(doc(firestore, 'organisationMembers', membershipId), {
    membershipStatus: 'active' satisfies MembershipStatus,
    active:           true,
  })
}

export async function removeOrganisationMember(membershipId: string): Promise<void> {
  await updateDoc(doc(firestore, 'organisationMembers', membershipId), {
    membershipStatus: 'removed' satisfies MembershipStatus,
    active:           false,
  })
}
