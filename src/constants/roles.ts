import type { PlatformRole, PartnerRole, OrganisationRole } from '../auth/AuthTypes'

export const PLATFORM_ROLES: PlatformRole[] = ['super_admin', 'admin', 'developer']
export const PARTNER_ROLES: PartnerRole[] = ['partner_super_admin', 'partner_admin']
export const ORGANISATION_ROLES: OrganisationRole[] = [
  'owner',
  'manager',
  'engineer',
  'inspector',
  'auditor',
  'approver',
  'viewer',
]
