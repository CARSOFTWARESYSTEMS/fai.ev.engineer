import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'

// ─── Event type catalog ───────────────────────────────────────────────────────

export type UserActivityEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'profile.created'
  | 'profile.updated'
  | 'role.changed'
  | 'lifecycle.changed'
  | 'project.created'
  | 'project.updated'
  | 'pdf.uploaded'
  | 'fair.exported'
  | 'partner.admin.assigned'
  | 'partner.admin.revoked'

export type ActivityEventCategory =
  | 'auth'
  | 'profile'
  | 'role'
  | 'lifecycle'
  | 'project'
  | 'pdf'
  | 'export'
  | 'partner'

export const EVENT_CATEGORY: Record<UserActivityEventType, ActivityEventCategory> = {
  'auth.login':             'auth',
  'auth.logout':            'auth',
  'profile.created':        'profile',
  'profile.updated':        'profile',
  'role.changed':           'role',
  'lifecycle.changed':      'lifecycle',
  'project.created':        'project',
  'project.updated':        'project',
  'pdf.uploaded':           'pdf',
  'fair.exported':          'export',
  'partner.admin.assigned': 'partner',
  'partner.admin.revoked':  'partner',
}

export const EVENT_LABEL: Record<UserActivityEventType, string> = {
  'auth.login':             'Signed In',
  'auth.logout':            'Signed Out',
  'profile.created':        'Profile Created',
  'profile.updated':        'Profile Updated',
  'role.changed':           'Role Changed',
  'lifecycle.changed':      'Lifecycle Changed',
  'project.created':        'Project Created',
  'project.updated':        'Project Updated',
  'pdf.uploaded':           'PDF Uploaded',
  'fair.exported':          'FAIR Package Exported',
  'partner.admin.assigned': 'Partner Admin Assigned',
  'partner.admin.revoked':  'Partner Admin Revoked',
}

// ─── Document shape ───────────────────────────────────────────────────────────

export interface UserActivityLog {
  logId:       string
  targetUid:   string
  actorUid?:   string
  actorEmail?: string
  eventType:   UserActivityEventType
  meta:        Record<string, string | number | boolean | null>
  createdAt:   Timestamp | null
}

// ─── Internal write input ─────────────────────────────────────────────────────

interface WriteInput {
  targetUid:   string
  actorUid?:   string
  actorEmail?: string
  eventType:   UserActivityEventType
  meta?:       Record<string, string | number | boolean | null>
}

// ─── Core write (fire-and-forget safe) ───────────────────────────────────────

export async function writeUserActivityLog(input: WriteInput): Promise<void> {
  const { targetUid, actorUid, actorEmail, eventType, meta = {} } = input
  const payload: Record<string, unknown> = {
    targetUid,
    eventType,
    meta,
    createdAt: serverTimestamp(),
  }
  if (actorUid)   payload.actorUid   = actorUid
  if (actorEmail) payload.actorEmail = actorEmail
  await addDoc(collection(firestore, 'userActivityLogs'), payload)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function logAuthLogin(uid: string, email: string): Promise<void> {
  return writeUserActivityLog({ targetUid: uid, eventType: 'auth.login', meta: { email } })
}

export function logAuthLogout(uid: string, email: string): Promise<void> {
  return writeUserActivityLog({ targetUid: uid, eventType: 'auth.logout', meta: { email } })
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function logProfileCreated(uid: string, email: string): Promise<void> {
  return writeUserActivityLog({ targetUid: uid, eventType: 'profile.created', meta: { email } })
}

export function logProfileUpdated(
  uid: string,
  email: string,
  changedFields: string[],
): Promise<void> {
  return writeUserActivityLog({
    targetUid: uid,
    eventType:  'profile.updated',
    meta: { email, changedFields: changedFields.join(',') },
  })
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export function logRoleChanged(params: {
  targetUid:    string
  targetEmail:  string
  previousRole: string
  newRole:      string
  actorUid:     string
  actorEmail:   string
}): Promise<void> {
  return writeUserActivityLog({
    targetUid:  params.targetUid,
    actorUid:   params.actorUid,
    actorEmail: params.actorEmail,
    eventType:  'role.changed',
    meta: {
      targetEmail:  params.targetEmail,
      previousRole: params.previousRole,
      newRole:      params.newRole,
    },
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export function logLifecycleChanged(params: {
  targetUid:      string
  targetEmail:    string
  previousStatus: string
  newStatus:      string
  actorUid:       string
  actorEmail:     string
  reason?:        string
  targetType:     'user' | 'project'
  targetName?:    string
}): Promise<void> {
  const meta: Record<string, string | number | boolean | null> = {
    targetEmail:    params.targetEmail,
    previousStatus: params.previousStatus,
    newStatus:      params.newStatus,
    targetType:     params.targetType,
  }
  if (params.reason)     meta.reason     = params.reason
  if (params.targetName) meta.targetName = params.targetName

  return writeUserActivityLog({
    targetUid:  params.targetUid,
    actorUid:   params.actorUid,
    actorEmail: params.actorEmail,
    eventType:  'lifecycle.changed',
    meta,
  })
}

// ─── Project ──────────────────────────────────────────────────────────────────

export function logProjectCreated(params: {
  ownerUid:    string
  ownerEmail:  string
  projectId:   string
  projectName: string
}): Promise<void> {
  return writeUserActivityLog({
    targetUid: params.ownerUid,
    eventType: 'project.created',
    meta: {
      projectId:   params.projectId,
      projectName: params.projectName,
      ownerEmail:  params.ownerEmail,
    },
  })
}

export function logProjectUpdated(params: {
  ownerUid:      string
  ownerEmail:    string
  projectId:     string
  projectName:   string
  changedFields?: string[]
}): Promise<void> {
  return writeUserActivityLog({
    targetUid: params.ownerUid,
    eventType: 'project.updated',
    meta: {
      projectId:     params.projectId,
      projectName:   params.projectName,
      ownerEmail:    params.ownerEmail,
      changedFields: params.changedFields?.join(',') ?? '',
    },
  })
}

// ─── PDF upload ───────────────────────────────────────────────────────────────

export function logPdfUploaded(params: {
  ownerUid:      string
  ownerEmail:    string
  projectId:     string
  fileName:      string
  fileSizeBytes: number
}): Promise<void> {
  return writeUserActivityLog({
    targetUid: params.ownerUid,
    eventType: 'pdf.uploaded',
    meta: {
      projectId:     params.projectId,
      fileName:      params.fileName,
      fileSizeBytes: params.fileSizeBytes,
      ownerEmail:    params.ownerEmail,
    },
  })
}

// ─── FAIR export ──────────────────────────────────────────────────────────────

export function logFairExported(params: {
  ownerUid:     string
  ownerEmail:   string
  projectId?:   string
  projectName?: string
  balloonCount: number
  featureCount: number
}): Promise<void> {
  const meta: Record<string, string | number | boolean | null> = {
    ownerEmail:   params.ownerEmail,
    balloonCount: params.balloonCount,
    featureCount: params.featureCount,
  }
  if (params.projectId)   meta.projectId   = params.projectId
  if (params.projectName) meta.projectName = params.projectName

  return writeUserActivityLog({ targetUid: params.ownerUid, eventType: 'fair.exported', meta })
}

// ─── Partner admin ────────────────────────────────────────────────────────────

export function logPartnerAdminAssigned(params: {
  targetUid:   string
  targetEmail: string
  partnerId:   string
  actorUid:    string
  actorEmail:  string
}): Promise<void> {
  return writeUserActivityLog({
    targetUid:  params.targetUid,
    actorUid:   params.actorUid,
    actorEmail: params.actorEmail,
    eventType:  'partner.admin.assigned',
    meta: { targetEmail: params.targetEmail, partnerId: params.partnerId },
  })
}

export function logPartnerAdminRevoked(params: {
  targetUid:    string
  targetEmail:  string
  partnerId:    string
  actorUid?:    string
  actorEmail?:  string
}): Promise<void> {
  return writeUserActivityLog({
    targetUid:  params.targetUid,
    actorUid:   params.actorUid,
    actorEmail: params.actorEmail,
    eventType:  'partner.admin.revoked',
    meta: { targetEmail: params.targetEmail, partnerId: params.partnerId },
  })
}

// ─── Subscriptions (super_admin only) ────────────────────────────────────────

export function subscribeUserActivityLogs(
  targetUid: string,
  callback:  (logs: UserActivityLog[]) => void,
  onError?:  (err: Error) => void,
): () => void {
  const q = query(
    collection(firestore, 'userActivityLogs'),
    where('targetUid', '==', targetUid),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ logId: d.id, ...(d.data() as Omit<UserActivityLog, 'logId'>) }))),
    err  => { callback([]); onError?.(err) },
  )
}

export function subscribeAllUserActivityLogs(
  callback: (logs: UserActivityLog[]) => void,
): () => void {
  const q = query(
    collection(firestore, 'userActivityLogs'),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ logId: d.id, ...(d.data() as Omit<UserActivityLog, 'logId'>) }))),
    () => callback([]),
  )
}

// ─── Helper: format log timestamp ─────────────────────────────────────────────

export function formatLogTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  const ms = typeof ts.toMillis === 'function' ? ts.toMillis() : 0
  if (!ms) return '—'
  return new Date(ms).toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// ─── Helper: collect changed field names ─────────────────────────────────────

export function collectChangedFields(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  watch: string[],
): string[] {
  return watch.filter(k => prev[k] !== next[k])
}

// ─── Helper: reference to a specific log doc (for admin-generated events) ────

export function activityLogDocRef(logId: string) {
  return doc(collection(firestore, 'userActivityLogs'), logId)
}
