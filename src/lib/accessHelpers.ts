/**
 * Access Helpers — Phase 2
 *
 * Centralised permission flags for UI visibility.
 *
 * canViewPartner (Phase 2): Platform developers AND real partnerAdmins from Firestore.
 *   Bootstrap developers are always included via isDeveloper.
 *
 * canViewOrganization (Phase 1.5 still): bootstrap-only until org membership
 *   collection is wired up in Phase 3.
 */
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { usePartnerAccess } from '../services/partnerAccessService'

export interface AccessHelpers {
  canViewDeveloperSettings: boolean
  canViewPartner:           boolean
  canViewOrganization:      boolean
  isLoading:                boolean
}

export function useAccessHelpers(): AccessHelpers {
  const { isDeveloper, isBootstrap, isLoading: devLoading } = useDeveloperAccess()
  const { isPartnerAdminUser, isLoading: partnerLoading }   = usePartnerAccess()

  return {
    canViewDeveloperSettings: isDeveloper,

    // Phase 2: platform developers + real partnerAdmin records.
    // Bootstrap accounts are covered by isDeveloper.
    canViewPartner: isDeveloper || isPartnerAdminUser,

    // Phase 1.5: bootstrap-only until org membership is implemented (Phase 3).
    // Phase 3: replace with organizationMembers query.
    canViewOrganization: isBootstrap,

    isLoading: devLoading || partnerLoading,
  }
}
