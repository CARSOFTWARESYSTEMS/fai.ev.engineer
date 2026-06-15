/**
 * Access Helpers — Phase 1.5
 *
 * Centralised permission flags for UI visibility.
 * No Firestore reads. No role migration.
 *
 * Phase 1.5: Partner and Organization menus are visible to bootstrap
 * developers only (for validation). Phase 2 will replace isBootstrap
 * with real partner/org membership queries.
 */
import { useDeveloperAccess } from '../services/useDeveloperAccess'

export interface AccessHelpers {
  canViewDeveloperSettings: boolean
  canViewPartner:           boolean
  canViewOrganization:      boolean
  isLoading:                boolean
}

export function useAccessHelpers(): AccessHelpers {
  const { isDeveloper, isBootstrap, isLoading } = useDeveloperAccess()

  return {
    canViewDeveloperSettings: isDeveloper,

    // Phase 1.5: bootstrap-only to allow UI validation without real partner records.
    // Phase 2: replace with `partnerAdmins/{uid}` Firestore check.
    canViewPartner: isBootstrap,

    // Phase 1.5: bootstrap-only to allow UI validation without org membership.
    // Phase 2: replace with `organizationMembers` collection query.
    canViewOrganization: isBootstrap,

    isLoading,
  }
}
