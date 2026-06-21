import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { LifecycleStatus, UserRole } from '../auth/AuthTypes'

export type { LifecycleStatus }

// ─── Bootstrap developer emails (mirrors firestore.rules) ────────────────────
// These emails are treated as super_admin for lifecycle permission checks.

export const BOOTSTRAP_DEVELOPER_EMAILS: string[] = [
  'sudarshana.karkala@gmail.com',
  'sudhan.infotech@gmail.com',
  'carsoftwaresystems@gmail.com',
]

// ─── Permission helpers ────────────────────────────────────────────────────────

export type LifecycleActorRole = UserRole | 'developer'

/**
 * Returns true if the given actor may perform the requested lifecycle action.
 * Enforcement is also applied in service functions (defense-in-depth).
 */
export function canPerformLifecycleAction(
  action:       string,
  actorRole:    string,
  actorEmail:   string,
): boolean {
  const isBootstrap  = BOOTSTRAP_DEVELOPER_EMAILS.includes(actorEmail)
  const isSuperAdmin = actorRole === 'super_admin' || isBootstrap
  const isAdminPlus  = actorRole === 'admin' || isSuperAdmin
  // 'developer' role from developerConfig also gets admin-level lifecycle access
  const isDeveloper  = actorRole === 'developer' || isBootstrap

  switch (action) {
    // Any admin/developer: block, unblock, delete, restore, activate
    case 'block':
    case 'unblock':
    case 'delete':
    case 'restore':
    case 'activate':
    case 'permanently_delete':
      return isAdminPlus || isDeveloper

    // Only super_admin or bootstrap: permanently_deleted → deleted
    case 'move_to_deleted':
      return isSuperAdmin

    default:
      return false
  }
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const LIFECYCLE_LABELS: Record<LifecycleStatus, string> = {
  active:              'Active',
  inactive:            'Inactive',
  blocked:             'Blocked',
  deleted:             'Deleted',
  permanently_deleted: 'Permanently Deleted',
}

export function getLifecycleStatusLabel(status: LifecycleStatus | string): string {
  return LIFECYCLE_LABELS[status as LifecycleStatus] ?? status
}

export function isLifecycleAccessBlocked(status: LifecycleStatus | string | undefined): boolean {
  return (
    status === 'blocked' ||
    status === 'deleted' ||
    status === 'permanently_deleted'
  )
}

// ─── Audit trail ──────────────────────────────────────────────────────────────

interface AuditParams {
  targetType:     'user' | 'project'
  targetId:       string
  previousStatus: string
  newStatus:      string
  changedBy:      string
  changedByEmail: string
  reason?:        string
}

async function writeLifecycleAudit(p: AuditParams): Promise<void> {
  const entry: Record<string, unknown> = {
    targetType:     p.targetType,
    targetId:       p.targetId,
    previousStatus: p.previousStatus,
    newStatus:      p.newStatus,
    changedBy:      p.changedBy,
    changedByEmail: p.changedByEmail,
    changedAt:      serverTimestamp(),
  }
  if (p.reason) entry.reason = p.reason
  await addDoc(collection(firestore, 'lifecycleAuditTrail'), entry)
}

// ─── User lifecycle ───────────────────────────────────────────────────────────

export async function setUserLifecycleStatus(
  uid:            string,
  previousStatus: string,
  newStatus:      LifecycleStatus,
  changedBy:      string,
  changedByEmail: string,
  reason?:        string,
): Promise<void> {
  // Guard: permanently_deleted cannot jump directly to active
  if (previousStatus === 'permanently_deleted' && newStatus === 'active') {
    throw new Error(
      'Cannot restore a permanently_deleted user directly to active. Move to deleted first.'
    )
  }

  const patch: Record<string, unknown> = { lifecycleStatus: newStatus }

  if (newStatus === 'blocked') {
    patch.blockedAt     = serverTimestamp()
    patch.blockedBy     = changedByEmail   // store email for display
    patch.blockedReason = reason ?? null
  } else if (newStatus === 'deleted') {
    patch.deletedAt     = serverTimestamp()
    patch.deletedBy     = changedByEmail
    patch.deletedReason = reason ?? null
  } else if (newStatus === 'permanently_deleted') {
    patch.permanentlyDeletedAt     = serverTimestamp()
    patch.permanentlyDeletedBy     = changedByEmail
    patch.permanentlyDeletedReason = reason ?? null
  }

  await updateDoc(doc(firestore, 'users', uid), patch)
  await writeLifecycleAudit({ targetType: 'user', targetId: uid, previousStatus, newStatus, changedBy, changedByEmail, reason })
}

export async function restoreUser(
  uid:            string,
  previousStatus: string,
  changedBy:      string,
  changedByEmail: string,
): Promise<void> {
  if (previousStatus === 'permanently_deleted') {
    throw new Error(
      'Cannot restore a permanently_deleted user directly to active. Move to deleted first.'
    )
  }
  await updateDoc(doc(firestore, 'users', uid), { lifecycleStatus: 'active' })
  await writeLifecycleAudit({ targetType: 'user', targetId: uid, previousStatus, newStatus: 'active', changedBy, changedByEmail })
}

export async function movePermanentlyDeletedToDeleted(
  targetType:     'user' | 'project',
  targetId:       string,
  changedBy:      string,
  changedByEmail: string,
  actorRole:      string,
  reason?:        string,
): Promise<void> {
  if (!canPerformLifecycleAction('move_to_deleted', actorRole, changedByEmail)) {
    throw new Error('Only Super Admin can move a permanently_deleted record back to deleted.')
  }

  const collectionName = targetType === 'user' ? 'users' : 'projects'
  await updateDoc(doc(firestore, collectionName, targetId), {
    lifecycleStatus: 'deleted',
  })
  await writeLifecycleAudit({
    targetType,
    targetId,
    previousStatus: 'permanently_deleted',
    newStatus:      'deleted',
    changedBy,
    changedByEmail,
    reason,
  })
}

export async function activateUserOnLogin(uid: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), { lifecycleStatus: 'active' })
}

export async function markUserPermanentlyDeleted(
  uid:            string,
  previousStatus: string,
  changedBy:      string,
  changedByEmail: string,
  reason?:        string,
): Promise<void> {
  return setUserLifecycleStatus(uid, previousStatus, 'permanently_deleted', changedBy, changedByEmail, reason)
}

// ─── Project lifecycle ────────────────────────────────────────────────────────

export async function setProjectLifecycleStatus(
  projectId:      string,
  previousStatus: string,
  newStatus:      LifecycleStatus,
  changedBy:      string,
  changedByEmail: string,
  reason?:        string,
): Promise<void> {
  if (previousStatus === 'permanently_deleted' && newStatus === 'active') {
    throw new Error(
      'Cannot restore a permanently_deleted project directly to active. Move to deleted first.'
    )
  }

  const patch: Record<string, unknown> = { lifecycleStatus: newStatus }

  if (newStatus === 'blocked') {
    patch.blockedAt     = serverTimestamp()
    patch.blockedBy     = changedByEmail
    patch.blockedReason = reason ?? null
  } else if (newStatus === 'deleted') {
    patch.deletedAt     = serverTimestamp()
    patch.deletedBy     = changedByEmail
    patch.deletedReason = reason ?? null
  } else if (newStatus === 'permanently_deleted') {
    patch.permanentlyDeletedAt     = serverTimestamp()
    patch.permanentlyDeletedBy     = changedByEmail
    patch.permanentlyDeletedReason = reason ?? null
  }

  await updateDoc(doc(firestore, 'projects', projectId), patch)
  await writeLifecycleAudit({ targetType: 'project', targetId: projectId, previousStatus, newStatus, changedBy, changedByEmail, reason })
}

export async function restoreProject(
  projectId:      string,
  previousStatus: string,
  changedBy:      string,
  changedByEmail: string,
): Promise<void> {
  if (previousStatus === 'permanently_deleted') {
    throw new Error(
      'Cannot restore a permanently_deleted project directly to active. Move to deleted first.'
    )
  }
  await updateDoc(doc(firestore, 'projects', projectId), { lifecycleStatus: 'active' })
  await writeLifecycleAudit({ targetType: 'project', targetId: projectId, previousStatus, newStatus: 'active', changedBy, changedByEmail })
}

export async function markProjectPermanentlyDeleted(
  projectId:      string,
  previousStatus: string,
  changedBy:      string,
  changedByEmail: string,
  reason?:        string,
): Promise<void> {
  return setProjectLifecycleStatus(projectId, previousStatus, 'permanently_deleted', changedBy, changedByEmail, reason)
}

// ─── Group helpers ────────────────────────────────────────────────────────────

export const LIFECYCLE_STATUS_ORDER: LifecycleStatus[] = [
  'active',
  'inactive',
  'blocked',
  'deleted',
  'permanently_deleted',
]

export function groupProjectsByLifecycle<T extends { lifecycleStatus?: string }>(
  projects: T[],
): Map<LifecycleStatus, T[]> {
  const map = new Map<LifecycleStatus, T[]>(
    LIFECYCLE_STATUS_ORDER.map(s => [s, []])
  )
  for (const p of projects) {
    const s = (p.lifecycleStatus ?? 'active') as LifecycleStatus
    const bucket = map.get(s) ?? map.get('active')!
    bucket.push(p)
  }
  return map
}
