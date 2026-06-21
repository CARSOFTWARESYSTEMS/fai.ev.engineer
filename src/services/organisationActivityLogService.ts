import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OrgActivityEventType =
  | 'organisation.created'
  | 'owner.assigned'
  | 'member.added'
  | 'member.removed'
  | 'member.role_changed'
  | 'member.deactivated'
  | 'member.reactivated'
  | 'subscription.updated'
  | 'product.enabled'
  | 'product.disabled'

export type OrgActivityFilter = 'all' | 'membership' | 'subscription' | 'products'

export interface OrgActivityLog {
  logId:          string
  organisationId: string
  eventType:      OrgActivityEventType
  actorUid:       string
  actorEmail:     string
  description:    string
  metadata?:      Record<string, unknown>
  createdAt:      Timestamp | null
}

export const ACTIVITY_FILTER_EVENTS: Record<OrgActivityFilter, OrgActivityEventType[] | null> = {
  all:          null,
  membership:   ['member.added', 'member.removed', 'member.role_changed', 'member.deactivated', 'member.reactivated', 'owner.assigned'],
  subscription: ['subscription.updated'],
  products:     ['product.enabled', 'product.disabled', 'organisation.created'],
}

export const EVENT_LABELS: Record<OrgActivityEventType, string> = {
  'organisation.created': 'Organisation Created',
  'owner.assigned':       'Owner Assigned',
  'member.added':         'Member Added',
  'member.removed':       'Member Removed',
  'member.role_changed':  'Role Changed',
  'member.deactivated':   'Member Deactivated',
  'member.reactivated':   'Member Reactivated',
  'subscription.updated': 'Subscription Updated',
  'product.enabled':      'Product Enabled',
  'product.disabled':     'Product Disabled',
}

export const EVENT_COLOURS: Record<OrgActivityEventType, string> = {
  'organisation.created': 'text-primary bg-primary-light border-primary/20',
  'owner.assigned':       'text-amber-700 bg-amber-50 border-amber-200',
  'member.added':         'text-success bg-success/10 border-success/20',
  'member.removed':       'text-error bg-red-50 border-red-200',
  'member.role_changed':  'text-blue-700 bg-blue-50 border-blue-200',
  'member.deactivated':   'text-amber-700 bg-amber-50 border-amber-200',
  'member.reactivated':   'text-success bg-success/10 border-success/20',
  'subscription.updated': 'text-primary bg-primary-light border-primary/20',
  'product.enabled':      'text-success bg-success/10 border-success/20',
  'product.disabled':     'text-text-secondary bg-gray-100 border-border',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toLog(id: string, data: Record<string, unknown>): OrgActivityLog {
  return {
    logId:          id,
    organisationId: (data.organisationId as string)              ?? '',
    eventType:      (data.eventType      as OrgActivityEventType) ?? 'member.added',
    actorUid:       (data.actorUid       as string)              ?? '',
    actorEmail:     (data.actorEmail     as string)              ?? '',
    description:    (data.description   as string)              ?? '',
    metadata:       (data.metadata      as Record<string, unknown> | undefined),
    createdAt:      (data.createdAt      as Timestamp | null)    ?? null,
  }
}

// ─── Reads ─────────────────────────────────────────────────────────────────────

export function subscribeOrganisationActivityLogs(
  organisationId: string,
  callback: (logs: OrgActivityLog[]) => void,
): () => void {
  return onSnapshot(
    query(
      collection(firestore, 'organisationActivityLogs'),
      where('organisationId', '==', organisationId),
      orderBy('createdAt', 'desc'),
    ),
    snap => callback(snap.docs.map(d => toLog(d.id, d.data()))),
    () => callback([]),
  )
}

// ─── Writes ────────────────────────────────────────────────────────────────────

export async function logOrgActivity(opts: {
  organisationId: string
  eventType:      OrgActivityEventType
  actorUid:       string
  actorEmail:     string
  description:    string
  metadata?:      Record<string, unknown>
}): Promise<void> {
  await addDoc(collection(firestore, 'organisationActivityLogs'), {
    organisationId: opts.organisationId,
    eventType:      opts.eventType,
    actorUid:       opts.actorUid,
    actorEmail:     opts.actorEmail,
    description:    opts.description,
    metadata:       opts.metadata ?? null,
    createdAt:      serverTimestamp(),
  })
}
