import type { AnyRole } from '../auth/AuthTypes'

type CheckableRole = AnyRole | string | undefined | null

export function canDeleteProject(role: CheckableRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'owner' || role === 'manager'
}

export function canBlockProject(role: CheckableRole): boolean {
  return canDeleteProject(role)
}

export function canRestoreProject(role: CheckableRole): boolean {
  return canDeleteProject(role)
}

export function canManageBilling(role: CheckableRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'partner_super_admin' ||
    role === 'partner_admin'
  )
}

export function canManagePartner(role: CheckableRole): boolean {
  return role === 'super_admin' || role === 'admin'
}

export function canManageOrganisation(role: CheckableRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'partner_super_admin' ||
    role === 'partner_admin'
  )
}

export function canViewUserLogs(role: CheckableRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'developer'
}

export function canRestorePermanentlyDeleted(role: CheckableRole): boolean {
  return role === 'super_admin'
}

export function canManageProducts(role: CheckableRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'partner_super_admin' ||
    role === 'partner_admin'
  )
}

export function canViewBilling(role: CheckableRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'developer' ||
    role === 'partner_super_admin' ||
    role === 'partner_admin' ||
    role === 'owner'
  )
}
