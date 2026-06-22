import { useUserOrg } from './useUserOrg'
import { getOrganisationStatus, type Organisation } from '../services/organisationService'
import { useDeveloperAccess } from '../services/useDeveloperAccess'

export interface OrgReadOnlyState {
  isReadOnly: boolean
  reason:     string
  org:        Organisation | null
  isLoading:  boolean
}

/**
 * Returns true if the current user's organisation is blocked, deleted, or subscription-expired.
 * Developers always get isReadOnly=false (they bypass org restrictions).
 * Users with no org membership get isReadOnly=false (product route handles access separately).
 */
export function useOrgReadOnly(): OrgReadOnlyState {
  const { org, isLoading: orgLoading } = useUserOrg()
  const { isDeveloper, isLoading: devLoading } = useDeveloperAccess()

  const isLoading = orgLoading || devLoading

  if (isLoading) {
    return { isReadOnly: false, reason: '', org: null, isLoading: true }
  }

  // Developers bypass all org-level restrictions
  if (isDeveloper) {
    return { isReadOnly: false, reason: '', org, isLoading: false }
  }

  // No org membership — no restriction from this hook (ProductRoute handles it)
  if (!org) {
    return { isReadOnly: false, reason: '', org: null, isLoading: false }
  }

  if (org.lifecycleStatus === 'blocked') {
    return { isReadOnly: true, reason: 'Organisation Blocked', org, isLoading: false }
  }
  if (org.lifecycleStatus === 'deleted' || org.lifecycleStatus === 'permanently_deleted') {
    return { isReadOnly: true, reason: 'Organisation Deleted', org, isLoading: false }
  }

  const status = getOrganisationStatus(org)
  if (status === 'suspended') {
    return { isReadOnly: true, reason: 'Subscription Expired', org, isLoading: false }
  }

  return { isReadOnly: false, reason: '', org, isLoading: false }
}
