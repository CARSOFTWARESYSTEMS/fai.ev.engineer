import type { Organisation } from './organisationService'
import { getOrganisationStatus } from './organisationService'
import { logOrgActivity } from './organisationActivityLogService'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OrganisationAccessResult {
  canRead:  boolean
  canWrite: boolean
  reason?:
    | 'blocked'
    | 'subscription_expired'
    | 'subscription_suspended'
    | 'deleted'
}

// ─── Access evaluation ─────────────────────────────────────────────────────────

export function canOrganisationWrite(org: Organisation): OrganisationAccessResult {
  if (org.lifecycleStatus === 'blocked') {
    return { canRead: true, canWrite: false, reason: 'blocked' }
  }
  if (org.lifecycleStatus === 'deleted' || org.lifecycleStatus === 'permanently_deleted') {
    return { canRead: false, canWrite: false, reason: 'deleted' }
  }
  const status = getOrganisationStatus(org)
  if (status === 'suspended') {
    return { canRead: true, canWrite: false, reason: 'subscription_expired' }
  }
  return { canRead: true, canWrite: true }
}

// ─── Assert + audit ────────────────────────────────────────────────────────────

const READ_ONLY_MESSAGES: Record<string, string> = {
  blocked:              'Organisation is blocked.',
  deleted:              'Organisation is deleted.',
  subscription_expired: 'Organisation subscription has expired.',
  subscription_suspended: 'Organisation subscription is suspended.',
}

/**
 * Throws if the org cannot write, and fires a read-only audit event (fire-and-forget).
 * Use this from service-layer write functions where uid and email are available.
 */
export function assertOrganisationWritable(
  org: Organisation,
  opts?: { uid?: string; actorEmail?: string; action?: string },
): void {
  const access = canOrganisationWrite(org)
  if (!access.canWrite) {
    if (opts?.uid || opts?.actorEmail) {
      logOrgActivity({
        organisationId: org.organisationId,
        eventType:      'organisation.readonly_write_attempt',
        actorUid:       opts.uid       ?? '',
        actorEmail:     opts.actorEmail ?? '',
        description:    `Write blocked (${access.reason ?? 'unknown'}): ${opts.action ?? 'unknown'}`,
        metadata:       { action: opts.action ?? 'unknown', reason: access.reason },
      }).catch(() => {})
    }
    throw new Error(
      READ_ONLY_MESSAGES[access.reason ?? ''] ?? 'Organisation is currently read-only.',
    )
  }
}
