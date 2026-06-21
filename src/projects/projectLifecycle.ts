import type { UserRole } from '../auth/AuthTypes'
import type { FAIProject } from './project.types'

export type ProjectLifecycleStatus =
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'deleted'
  | 'permanently_deleted'

export type ProjectActorRole = UserRole | 'developer' | undefined

export function getProjectLifecycleStatus(
  project: Pick<FAIProject, 'lifecycleStatus'>,
): ProjectLifecycleStatus {
  return project.lifecycleStatus ?? 'active'
}

/** Backward-compatible name used by older lifecycle admin components. */
export const getEffectiveLifecycleStatus = getProjectLifecycleStatus

export function isManagerOrAdminRole(role: ProjectActorRole): boolean {
  return role === 'manager' || role === 'admin' || role === 'super_admin' || role === 'developer'
}

export function isProjectVisibleToUser(
  project: Pick<FAIProject, 'lifecycleStatus'>,
  role: ProjectActorRole,
): boolean {
  const status = getProjectLifecycleStatus(project)
  if (status === 'permanently_deleted') return role === 'super_admin'
  if (status === 'deleted') return isManagerOrAdminRole(role)
  return true
}

export function isProjectOpenAllowed(
  project: Pick<FAIProject, 'lifecycleStatus'>,
  _role: ProjectActorRole,
): boolean {
  const status = getProjectLifecycleStatus(project)
  return status === 'active' || status === 'inactive'
}

export function isProjectEditable(
  project: Pick<FAIProject, 'lifecycleStatus'>,
  role: ProjectActorRole,
): boolean {
  return isProjectOpenAllowed(project, role)
}

export function isProjectHiddenFromNormalUser(
  project: Pick<FAIProject, 'lifecycleStatus'>,
): boolean {
  const status = getProjectLifecycleStatus(project)
  return status === 'deleted' || status === 'permanently_deleted'
}

export function isProjectBlocked(project: Pick<FAIProject, 'lifecycleStatus'>): boolean {
  return getProjectLifecycleStatus(project) === 'blocked'
}

export function isProjectSoftDeleted(project: Pick<FAIProject, 'lifecycleStatus'>): boolean {
  return isProjectHiddenFromNormalUser(project)
}
