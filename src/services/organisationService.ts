import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { ProductId, OrganisationRole } from '../auth/AuthTypes'
import { calculateBalanceAmount, getSubscriptionStatus } from './subscriptionService'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OrgStatus = 'active' | 'inactive' | 'trial' | 'suspended'
export type OrgSubscriptionType = 'free' | 'trial' | 'monthly' | 'annual'
export type OrgLifecycleStatus = 'active' | 'blocked' | 'deleted' | 'permanently_deleted'

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

export function toOrganisation(id: string, data: Record<string, unknown>): Organisation {
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

/**
 * Throws if the organisation is not in a writable state.
 * Call this at the service boundary before any write operation.
 */
export function assertOrganisationWritable(org: Organisation): void {
  if (org.lifecycleStatus === 'blocked') {
    throw new Error('Organisation is currently read-only: organisation is blocked.')
  }
  if (org.lifecycleStatus === 'deleted' || org.lifecycleStatus === 'permanently_deleted') {
    throw new Error('Organisation is currently read-only: organisation is deleted.')
  }
  const status = getOrganisationStatus(org)
  if (status === 'suspended') {
    throw new Error('Organisation is currently read-only: subscription has expired.')
  }
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
    snap => callback(
      snap.docs.map(d => toOrganisation(d.id, d.data()))
        .filter(o => o.lifecycleStatus !== 'deleted' && o.lifecycleStatus !== 'permanently_deleted')
    ),
    () => callback([]),
  )
}

export function subscribeBlockedOrganisations(
  callback: (orgs: Organisation[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'organisations'),
    snap => callback(snap.docs.map(d => toOrganisation(d.id, d.data())).filter(o => o.lifecycleStatus === 'blocked')),
    () => callback([]),
  )
}

export function subscribePartnerOrganisations(
  partnerId: string,
  callback: (orgs: Organisation[]) => void,
): () => void {
  return onSnapshot(
    query(collection(firestore, 'organisations'), where('partnerId', '==', partnerId)),
    snap => callback(
      snap.docs.map(d => toOrganisation(d.id, d.data()))
        .filter(o => o.lifecycleStatus !== 'deleted' && o.lifecycleStatus !== 'permanently_deleted')
    ),
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
  const patch: Record<string, unknown> = { ...updates, updatedAt: serverTimestamp() }

  // Always recompute balanceAmount so it can't drift from the billing totals.
  const total    = (updates.totalAmount    ?? 0) as number
  const discount = (updates.discountAmount ?? 0) as number
  const paid     = (updates.paidAmount     ?? 0) as number
  if ('totalAmount' in updates || 'discountAmount' in updates || 'paidAmount' in updates) {
    patch.balanceAmount = calculateBalanceAmount(total, discount, paid)
  }

  await updateDoc(doc(firestore, 'organisations', id), patch)
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

export async function blockOrganisation(
  id: string,
  opts: { reason: string; blockedBy: string },
): Promise<void> {
  await updateDoc(doc(firestore, 'organisations', id), {
    lifecycleStatus: 'blocked' satisfies OrgLifecycleStatus,
    blockedAt:       serverTimestamp(),
    blockedBy:       opts.blockedBy,
    blockedReason:   opts.reason || null,
    updatedAt:       serverTimestamp(),
  })
}

export async function unblockOrganisation(id: string): Promise<void> {
  await updateDoc(doc(firestore, 'organisations', id), {
    lifecycleStatus: 'active' satisfies OrgLifecycleStatus,
    blockedAt:       null,
    blockedBy:       null,
    blockedReason:   null,
    updatedAt:       serverTimestamp(),
  })
}

export async function permanentlyDeleteOrganisation(
  id: string,
  opts: { reason: string; deletedBy: string },
): Promise<void> {
  await updateDoc(doc(firestore, 'organisations', id), {
    lifecycleStatus:          'permanently_deleted' satisfies OrgLifecycleStatus,
    permanentlyDeletedAt:     serverTimestamp(),
    permanentlyDeletedBy:     opts.deletedBy,
    permanentlyDeletedReason: opts.reason || null,
    updatedAt:                serverTimestamp(),
  })
}

// Restore from 'deleted' → 'active'.
// Restore from 'permanently_deleted' → 'deleted' only (never directly to 'active').
export async function restoreOrganisation(
  id:         string,
  fromStatus: OrgLifecycleStatus = 'deleted',
): Promise<void> {
  const targetStatus: OrgLifecycleStatus =
    fromStatus === 'permanently_deleted' ? 'deleted' : 'active'
  await updateDoc(doc(firestore, 'organisations', id), {
    lifecycleStatus:          targetStatus,
    deletedAt:                null,
    deletedBy:                null,
    deletedReason:            null,
    permanentlyDeletedAt:     null,
    permanentlyDeletedBy:     null,
    permanentlyDeletedReason: null,
    blockedAt:                null,
    blockedBy:                null,
    blockedReason:            null,
    updatedAt:                serverTimestamp(),
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
  // Subscription enforcement: blocked/deleted orgs cannot have new members.
  const org = await getOrganisation(opts.organisationId)
  if (org) {
    if (org.lifecycleStatus === 'blocked') {
      throw new Error('Cannot add member: organisation is blocked.')
    }
    if (org.lifecycleStatus === 'deleted' || org.lifecycleStatus === 'permanently_deleted') {
      throw new Error('Cannot add member: organisation is deleted.')
    }
    const subStatus = getSubscriptionStatus(org.subscriptionType, org.subscriptionExpiryDate)
    if (subStatus === 'expired') {
      throw new Error('Cannot add member: organisation subscription has expired. Renew the subscription first.')
    }
  }

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

// Promotes any pending org memberships for this email to active with the real UID.
// Call on login and after profile completion, mirroring claimPendingPartnerAdmin.
export async function claimPendingOrgMemberships(opts: {
  email: string
  uid:   string
}): Promise<void> {
  const snap = await getDocs(
    query(
      collection(firestore, 'organisationMembers'),
      where('userEmail',        '==', opts.email.toLowerCase()),
      where('membershipStatus', '==', 'pending'),
    ),
  )
  if (snap.empty) return

  await Promise.all(
    snap.docs.map(d =>
      updateDoc(d.ref, {
        userUid:          opts.uid,
        membershipStatus: 'active' satisfies MembershipStatus,
        active:           true,
      }),
    ),
  )
  console.log('[ORG] Claimed', snap.size, 'pending membership(s) for', opts.email)
}
