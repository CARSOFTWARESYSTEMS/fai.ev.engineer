import type { AnyRole } from '../auth/AuthTypes'

type Role = AnyRole | string | undefined | null

// Platform admins (super_admin, admin, developer) + partner admins have full org management.
export function canManageOrganisation(role: Role): boolean {
  return [
    'super_admin', 'admin', 'developer',
    'partner_super_admin', 'partner_admin',
  ].includes(role ?? '')
}

// Org owner + platform admins + partner admins can add/remove members.
export function canManageMembers(role: Role): boolean {
  return [
    'super_admin', 'admin', 'developer',
    'partner_super_admin', 'partner_admin',
    'owner',
  ].includes(role ?? '')
}

// Owner + platform admins + partner admins can change member roles.
export function canChangeRole(role: Role): boolean {
  return [
    'super_admin', 'admin', 'developer',
    'partner_super_admin', 'partner_admin',
    'owner',
  ].includes(role ?? '')
}

// Owner + platform admins + partner admins can deactivate members.
export function canDeactivateMember(role: Role): boolean {
  return [
    'super_admin', 'admin', 'developer',
    'partner_super_admin', 'partner_admin',
    'owner',
  ].includes(role ?? '')
}

// Owner + platform admins + partner admins can remove members.
export function canRemoveMember(role: Role): boolean {
  return [
    'super_admin', 'admin', 'developer',
    'partner_super_admin', 'partner_admin',
    'owner',
  ].includes(role ?? '')
}

// All organisation members + platform admins can view the activity log.
export function canViewActivityLog(role: Role): boolean {
  return [
    'super_admin', 'admin', 'developer',
    'partner_super_admin', 'partner_admin',
    'owner', 'manager', 'engineer',
    'inspector', 'auditor', 'approver', 'viewer',
  ].includes(role ?? '')
}
