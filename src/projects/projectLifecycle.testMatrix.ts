import {
  isProjectEditable,
  isProjectOpenAllowed,
  isProjectVisibleToUser,
  type ProjectLifecycleStatus,
} from './projectLifecycle'

const project = (lifecycleStatus: ProjectLifecycleStatus) => ({ lifecycleStatus })

/** Lightweight assertions for repositories without a configured unit-test runner. */
export function runProjectLifecycleTestMatrix(): void {
  const checks: Array<[string, boolean]> = [
    ['active visible', isProjectVisibleToUser(project('active'), 'engineer')],
    ['active open', isProjectOpenAllowed(project('active'), 'engineer')],
    ['inactive visible', isProjectVisibleToUser(project('inactive'), 'engineer')],
    ['inactive open', isProjectOpenAllowed(project('inactive'), 'engineer')],
    ['blocked visible', isProjectVisibleToUser(project('blocked'), 'engineer')],
    ['blocked not open', !isProjectOpenAllowed(project('blocked'), 'engineer')],
    ['blocked not editable', !isProjectEditable(project('blocked'), 'admin')],
    ['deleted hidden from engineer', !isProjectVisibleToUser(project('deleted'), 'engineer')],
    ['deleted visible to manager', isProjectVisibleToUser(project('deleted'), 'manager')],
    ['deleted visible to admin', isProjectVisibleToUser(project('deleted'), 'admin')],
    ['permanent hidden from admin list', !isProjectVisibleToUser(project('permanently_deleted'), 'admin')],
    ['permanent visible to super admin', isProjectVisibleToUser(project('permanently_deleted'), 'super_admin')],
  ]
  const failed = checks.filter(([, passed]) => !passed).map(([name]) => name)
  if (failed.length) throw new Error(`Project lifecycle matrix failed: ${failed.join(', ')}`)
}
