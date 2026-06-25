import { useUserOrg } from './useUserOrg'
import type { Organisation } from '../services/organisationService'
import { canOrganisationWrite, type OrganisationAccessResult } from '../services/organisationAccessService'
import { useDeveloperAccess } from '../services/useDeveloperAccess'

export interface OrgReadOnlyState {
  isReadOnly:   boolean
  reason:       string
  /** The current user's organisation (null if no membership). */
  org:          Organisation | null
  /** Alias for org — preferred name per spec. */
  organisation: Organisation | null
  /** Structured access result (canRead, canWrite, reason). */
  access:       OrganisationAccessResult
  isLoading:    boolean
}

const REASON_LABELS: Record<string, string> = {
  blocked:              'Organisation Blocked',
  deleted:              'Organisation Deleted',
  subscription_expired: 'Subscription Expired',
  subscription_suspended: 'Subscription Suspended',
}

const ACCESS_ALLOWED: OrganisationAccessResult = { canRead: true, canWrite: true }

/**
 * Returns true if the current user's organisation is blocked, deleted, or subscription-expired.
 * Developers always get isReadOnly=false (they bypass org restrictions).
 * Users with no org membership get isReadOnly=false (product route handles access separately).
 */
export function useOrgReadOnly(): OrgReadOnlyState {
  const { org, isLoading: orgLoading }   = useUserOrg()
  const { isDeveloper, isLoading: devLoading } = useDeveloperAccess()

  const isLoading = orgLoading || devLoading

  if (isLoading) {
    return { isReadOnly: false, reason: '', org: null, organisation: null, access: ACCESS_ALLOWED, isLoading: true }
  }

  // Developers bypass all org-level restrictions
  if (isDeveloper) {
    return { isReadOnly: false, reason: '', org, organisation: org, access: ACCESS_ALLOWED, isLoading: false }
  }

  // No org membership — no restriction from this hook (ProductRoute handles it)
  if (!org) {
    return { isReadOnly: false, reason: '', org: null, organisation: null, access: ACCESS_ALLOWED, isLoading: false }
  }

  const access = canOrganisationWrite(org)
  if (!access.canWrite) {
    const reason = REASON_LABELS[access.reason ?? ''] ?? 'Read-only'
    return { isReadOnly: true, reason, org, organisation: org, access, isLoading: false }
  }

  return { isReadOnly: false, reason: '', org, organisation: org, access, isLoading: false }
}
