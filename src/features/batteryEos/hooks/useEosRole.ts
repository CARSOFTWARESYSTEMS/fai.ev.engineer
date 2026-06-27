// ─── EOS Role Access Hook ─────────────────────────────────────────────────────
//
// Determines what capabilities a user has inside the EOS workspace.
//
// Role CTA Matrix (from EV.ENGINEER Engineering Standard):
// SA / AD / DV         → Info + Demo + Engineering
// PA  partner_admin    → Info + Demo + Engineering  (Sprint 1: all partner admins)
// OW  owner            → Info + Demo + Engineering
// MG  manager          → Info + Demo + Engineering
// EN  engineer         → Info + Demo + Engineering
// IN  inspector        → Info + Demo only
// AU  auditor          → Info + Demo only
// AP  approver         → Info + Demo only (can review stories)
// VW  viewer           → Info + Demo only

import { useMemo } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useUserOrg } from '../../../hooks/useUserOrg'
import { useDeveloperAccess } from '../../../services/useDeveloperAccess'
import { usePartnerAccess } from '../../../services/partnerAccessService'
import type { EosRoleAccess } from '../types/eos.types'

export function useEosRole(): EosRoleAccess {
  const { user }          = useAuth()
  const { orgRole }       = useUserOrg()
  const { isDeveloper }   = useDeveloperAccess()
  const { isPartnerAdminUser } = usePartnerAccess()

  return useMemo((): EosRoleAccess => {
    // Developers always have full access and can assign arbitrary emails
    if (isDeveloper) {
      return { canInfo: true, canDemo: true, canEngineering: true, isEngineer: true, isReviewer: true, isManager: true, isQA: true, canInviteNew: true }
    }

    const platformRole = user?.role
    const isAdmin      = platformRole === 'super_admin' || platformRole === 'admin'

    // Platform admins have full access and can assign arbitrary emails
    if (isAdmin) {
      return { canInfo: true, canDemo: true, canEngineering: true, isEngineer: true, isReviewer: true, isManager: true, isQA: true, canInviteNew: true }
    }

    // Partner admins → full access, can assign arbitrary emails
    if (isPartnerAdminUser) {
      return { canInfo: true, canDemo: true, canEngineering: true, isEngineer: false, isReviewer: true, isManager: true, isQA: true, canInviteNew: true }
    }

    // Org-level roles
    const role = orgRole

    const canEngineering = role === 'owner' || role === 'manager' || role === 'engineer' || role === 'inspector'
    const isManager      = role === 'owner' || role === 'manager'
    const isReviewer     = role === 'owner' || role === 'manager' || role === 'approver'
    const isEngineer     = role === 'engineer'
    const isQA           = role === 'inspector'
    const canInviteNew   = role === 'owner'   // only owners can assign outside the member list

    return {
      canInfo:        true,
      canDemo:        true,
      canEngineering,
      isEngineer,
      isReviewer,
      isManager,
      isQA,
      canInviteNew,
    }
  }, [isDeveloper, user?.role, orgRole, isPartnerAdminUser])
}
