import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { UserRole } from '../auth/AuthTypes'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserRecord {
  uid:               string
  displayName:       string
  email:             string
  photoURL?:         string
  mobileNumber?:     string
  organizationName?: string
  organizationCode?: string
  role:              UserRole
  createdAt:         Timestamp | null
  lastLoginAt:       Timestamp | null
  updatedAt:         Timestamp | null
  profileCompleted:  boolean
  subscriptionPlan?: string
  status?:           string   // 'disabled' when hidden by developer
  disabledAt?:       string
  // Signup origin (set once at profile creation)
  signupDomain?:      string
  signupHostname?:    string
  signupBrandingId?:  string
  signupPartnerCode?: string
  signupPartnerName?: string
}

export interface RoleAuditEvent {
  targetUid:      string
  targetEmail:    string
  previousRole:   UserRole
  newRole:        UserRole
  changedBy:      string        // uid
  changedByEmail: string
  changedAt:      Timestamp | null
}

// ─── Permission helpers ────────────────────────────────────────────────────────

// Returns the set of roles a caller is allowed to ASSIGN as a target role.
export function getAllowedTargetRoles(
  callerRole: UserRole,
  isBootstrap: boolean,
): UserRole[] {
  if (isBootstrap)                       return ['engineer', 'manager', 'admin', 'super_admin']
  if (callerRole === 'super_admin')      return ['engineer', 'manager', 'admin']
  if (callerRole === 'admin')            return ['engineer', 'manager']
  return []
}

// True if the caller may edit (change the role of) the given target user.
// Prevents self-modification and respects the role hierarchy.
export function canEditUserRole(
  callerRole:  UserRole,
  isBootstrap: boolean,
  targetRole:  UserRole,
  isSelf:      boolean,
): boolean {
  if (isSelf) return false
  if (isBootstrap) return true
  if (callerRole === 'super_admin') return targetRole !== 'super_admin'
  if (callerRole === 'admin') return targetRole === 'engineer' || targetRole === 'manager' || targetRole === 'user'
  return false
}

// ─── Realtime subscription ─────────────────────────────────────────────────────

export function subscribeUsers(
  callback: (users: UserRecord[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'users'),
    snap => callback(
      snap.docs.map(d => ({
        uid: d.id,
        ...(d.data() as Omit<UserRecord, 'uid'>),
      }))
    ),
    () => callback([]),
  )
}

// ─── One-shot reads ────────────────────────────────────────────────────────────

export async function listUsers(): Promise<UserRecord[]> {
  const snap = await getDocs(collection(firestore, 'users'))
  return snap.docs.map(d => ({
    uid: d.id,
    ...(d.data() as Omit<UserRecord, 'uid'>),
  }))
}

export async function getRoleHistory(targetUid?: string): Promise<RoleAuditEvent[]> {
  const base = collection(firestore, 'roleAuditTrail')
  const q = targetUid
    ? query(base, where('targetUid', '==', targetUid), orderBy('changedAt', 'desc'))
    : query(base, orderBy('changedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as RoleAuditEvent)
}

// ─── Role update (batch: users/{uid} + roleAuditTrail) ────────────────────────

export async function updateUserRole(params: {
  targetUid:      string
  targetEmail:    string
  previousRole:   UserRole
  newRole:        UserRole
  changedByUid:   string
  changedByEmail: string
}): Promise<void> {
  const { targetUid, targetEmail, previousRole, newRole, changedByUid, changedByEmail } = params

  const batch = writeBatch(firestore)

  batch.update(doc(firestore, 'users', targetUid), {
    role:      newRole,
    updatedAt: serverTimestamp(),
  })

  const auditRef = doc(collection(firestore, 'roleAuditTrail'))
  batch.set(auditRef, {
    targetUid,
    targetEmail,
    previousRole,
    newRole,
    changedBy:      changedByUid,
    changedByEmail,
    changedAt: serverTimestamp(),
  })

  await batch.commit()
}
