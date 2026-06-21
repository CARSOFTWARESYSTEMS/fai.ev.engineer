import { useEffect, useState, useMemo, useCallback, createContext, useContext } from 'react'
import {
  Phone, Mail, MessageCircle, ChevronDown, ChevronRight,
  Search, Users, AlertCircle, Loader2, UserX,
  Globe, FolderOpen, Folder, FileText, ExternalLink,
  ShieldBan, Trash2, RotateCcw, SkullIcon, UserCheck,
  Building2, Clock, ScrollText,
} from 'lucide-react'
import {
  subscribeAllUsers,
  groupUsersBySignupDomain,
  buildContactLinks,
  domainDisplayLabel,
  getEffectiveLifecycleStatus,
  getEffectiveProjectLifecycleStatus,
  LEGACY_DOMAIN,
  type DirectoryUser,
} from '../../services/userDirectoryService'
import {
  setUserLifecycleStatus,
  restoreUser,
  markUserPermanentlyDeleted,
  movePermanentlyDeletedToDeleted,
  setProjectLifecycleStatus,
  restoreProject,
  markProjectPermanentlyDeleted,
  canPerformLifecycleAction,
  getLifecycleStatusLabel,
  LIFECYCLE_STATUS_ORDER,
  type LifecycleStatus,
} from '../../services/lifecycleService'
import { getUserProjects } from '../../projects/project.service'
import type { FAIProject } from '../../projects/project.types'
import type { UserRole } from '../../auth/AuthTypes'
import { useAuth } from '../../auth/hooks/useAuth'
import { isBootstrapDeveloper } from '../../config/developerBootstrap'
import { logLifecycleChanged } from '../../services/userActivityLogService'
import { UserActivityLogModal } from './UserActivityLogModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const LIFECYCLE_CATEGORY_LABELS: Record<LifecycleStatus, string> = {
  active:              'Active Users',
  inactive:            'Inactive Users',
  blocked:             'Blocked Users',
  deleted:             'Deleted Users',
  permanently_deleted: 'Permanently Deleted Users',
}

const PROJECT_LIFECYCLE_LABELS: Record<LifecycleStatus, string> = {
  active:              'Active Projects',
  inactive:            'Inactive Projects',
  blocked:             'Blocked Projects',
  deleted:             'Deleted Projects',
  permanently_deleted: 'Permanently Deleted Projects',
}

const LIFECYCLE_BADGE: Record<LifecycleStatus, string> = {
  active:              'bg-green-100 text-green-700 border-green-200',
  inactive:            'bg-amber-100 text-amber-700 border-amber-200',
  blocked:             'bg-red-100 text-red-700 border-red-200',
  deleted:             'bg-gray-100 text-gray-500 border-gray-200',
  permanently_deleted: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: unknown): string {
  if (!ts) return '—'
  try {
    const d = typeof (ts as { toDate?: () => Date }).toDate === 'function'
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as string)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

// Resolves a stored "changedBy" value to a human-readable email.
// Old records (Sprint 1) stored the Firebase UID; Sprint 2 onwards stores email directly.
// This resolver falls back to a UID→email lookup against the loaded user directory.
const EmailResolverCtx = createContext<(raw: string | undefined) => string | undefined>(r => r)

function resolveEmailFromUsers(raw: string | undefined, users: DirectoryUser[]): string | undefined {
  if (!raw) return undefined
  if (raw.includes('@')) return raw                           // already an email
  return users.find(u => u.uid === raw)?.email ?? raw        // resolve UID or return as-is
}

function roleBadgeClass(role: UserRole): string {
  const map: Record<UserRole, string> = {
    super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
    admin:       'bg-red-100 text-red-700 border-red-200',
    manager:     'bg-amber-100 text-amber-700 border-amber-200',
    engineer:    'bg-blue-100 text-blue-700 border-blue-200',
    user:        'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[role] ?? map.user
}

const WORKFLOW_STATUS: Record<string, { label: string; cls: string }> = {
  'draft':       { label: 'Draft',       cls: 'bg-slate-100  text-slate-600'  },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-100   text-blue-700'   },
  'review':      { label: 'Review',      cls: 'bg-amber-100  text-amber-700'  },
  'completed':   { label: 'Completed',   cls: 'bg-green-100  text-green-700'  },
  'complete':    { label: 'Completed',   cls: 'bg-green-100  text-green-700'  },
  'archived':    { label: 'Archived',    cls: 'bg-gray-100   text-gray-500'   },
}

function WorkflowStatusBadge({ status }: { status: string }) {
  const s = WORKFLOW_STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  )
}

function LifecycleBadge({ status }: { status: LifecycleStatus }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${LIFECYCLE_BADGE[status]}`}>
      {getLifecycleStatusLabel(status)}
    </span>
  )
}

function Avatar({ user }: { user: DirectoryUser }) {
  const initials = (user.displayName || user.email || '?')
    .split(' ').slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('')
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-primary">{initials || '?'}</span>
    </div>
  )
}

// ─── Lifecycle Context ────────────────────────────────────────────────────────

interface LifecycleContext {
  changedBy?: string
  changedAt?: unknown
  reason?: string
}

function extractLifecycleContext(
  obj: Record<string, unknown>,
  status: LifecycleStatus,
): LifecycleContext {
  if (status === 'blocked') return {
    changedBy: obj.blockedBy as string | undefined,
    changedAt: obj.blockedAt,
    reason:    obj.blockedReason as string | undefined,
  }
  if (status === 'deleted') return {
    changedBy: obj.deletedBy as string | undefined,
    changedAt: obj.deletedAt,
    reason:    obj.deletedReason as string | undefined,
  }
  if (status === 'permanently_deleted') return {
    changedBy: obj.permanentlyDeletedBy as string | undefined,
    changedAt: obj.permanentlyDeletedAt,
    reason:    obj.permanentlyDeletedReason as string | undefined,
  }
  return {}
}

function hasContext(ctx: LifecycleContext): boolean {
  return !!(ctx.changedBy || ctx.changedAt || ctx.reason)
}

// ─── Lifecycle Action Modal ────────────────────────────────────────────────────

type LifecycleAction =
  | 'block'
  | 'unblock'
  | 'delete'
  | 'restore'
  | 'permanently_delete'
  | 'activate'
  | 'move_to_deleted'

interface ActionConfig {
  title:        string
  description:  string
  note:         string
  confirmLabel: string
  confirmCls:   string
  icon:         React.ReactNode
  showReason:   boolean
  requireReason?: boolean
}

const USER_ACTION_CONFIG: Record<LifecycleAction, ActionConfig> = {
  block: {
    title:        'Block User',
    description:  'This user will not be able to log in or access the application.',
    note:         'Data is preserved. Firebase Auth account is not deleted. Google Drive files are not deleted. This is a lifecycle state change.',
    confirmLabel: 'Block User',
    confirmCls:   'bg-red-600 hover:bg-red-700 text-white',
    icon:         <ShieldBan className="w-5 h-5 text-red-600" />,
    showReason:   true,
  },
  unblock: {
    title:        'Set Active',
    description:  'This user will be set to active and can log in normally.',
    note:         'No data changes. This is a lifecycle state change.',
    confirmLabel: 'Set Active',
    confirmCls:   'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon:         <UserCheck className="w-5 h-5 text-emerald-600" />,
    showReason:   false,
  },
  delete: {
    title:        'Mark User Deleted',
    description:  'This user will not be able to access the application. They can be restored later.',
    note:         'Data is preserved. Firebase Auth account is not deleted. Google Drive files are not deleted. This is a lifecycle state change.',
    confirmLabel: 'Mark Deleted',
    confirmCls:   'bg-orange-600 hover:bg-orange-700 text-white',
    icon:         <Trash2 className="w-5 h-5 text-orange-600" />,
    showReason:   true,
  },
  restore: {
    title:        'Restore to Active',
    description:  'This user will be restored to active and can log in normally.',
    note:         'No data changes. This is a lifecycle state change.',
    confirmLabel: 'Restore to Active',
    confirmCls:   'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon:         <RotateCcw className="w-5 h-5 text-emerald-600" />,
    showReason:   false,
  },
  permanently_delete: {
    title:        'Mark Permanently Deleted',
    description:  'This is a final tracking state. The user will only appear under Permanently Deleted Users.',
    note:         'Data is preserved. Firebase Auth account is NOT deleted. Google Drive files are NOT deleted. This is a tracking state only.',
    confirmLabel: 'Mark Permanently Deleted',
    confirmCls:   'bg-zinc-700 hover:bg-zinc-800 text-white',
    icon:         <SkullIcon className="w-5 h-5 text-zinc-600" />,
    showReason:   true,
    requireReason: true,
  },
  activate: {
    title:        'Activate User',
    description:  'This user will be set to active and can log in normally.',
    note:         'No data changes. This is a lifecycle state change.',
    confirmLabel: 'Activate User',
    confirmCls:   'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon:         <UserCheck className="w-5 h-5 text-emerald-600" />,
    showReason:   false,
  },
  move_to_deleted: {
    title:        'Move Back to Deleted',
    description:  'This user will be moved from permanently deleted back to deleted status. From deleted, they can be restored to active.',
    note:         'Data is preserved. This action is restricted to Super Admin only. The user remains inaccessible until fully restored to active.',
    confirmLabel: 'Move Back to Deleted',
    confirmCls:   'bg-orange-600 hover:bg-orange-700 text-white',
    icon:         <RotateCcw className="w-5 h-5 text-orange-600" />,
    showReason:   true,
  },
}

const PROJECT_ACTION_CONFIG: Record<LifecycleAction, ActionConfig> = {
  block: {
    title:        'Block Project',
    description:  'Normal users will not be able to open or edit this project.',
    note:         'All project data is preserved. Google Drive files are not deleted. Admins/Developers can still view the project for support.',
    confirmLabel: 'Block Project',
    confirmCls:   'bg-red-600 hover:bg-red-700 text-white',
    icon:         <ShieldBan className="w-5 h-5 text-red-600" />,
    showReason:   true,
  },
  unblock: {
    title:        'Set Project Active',
    description:  'This project will be set to active and accessible by authorized users.',
    note:         'No data changes. This is a lifecycle state change.',
    confirmLabel: 'Set Active',
    confirmCls:   'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon:         <UserCheck className="w-5 h-5 text-emerald-600" />,
    showReason:   false,
  },
  delete: {
    title:        'Mark Project Deleted',
    description:  'This project will not be accessible by normal users. It can be restored later.',
    note:         'All project data is preserved. Balloons, Features, Forms, PDF references, and audit trail are kept. Google Drive files are not deleted.',
    confirmLabel: 'Mark Deleted',
    confirmCls:   'bg-orange-600 hover:bg-orange-700 text-white',
    icon:         <Trash2 className="w-5 h-5 text-orange-600" />,
    showReason:   true,
  },
  restore: {
    title:        'Restore Project to Active',
    description:  'This project will be restored to active and accessible by authorized users.',
    note:         'No data changes. This is a lifecycle state change.',
    confirmLabel: 'Restore to Active',
    confirmCls:   'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon:         <RotateCcw className="w-5 h-5 text-emerald-600" />,
    showReason:   false,
  },
  permanently_delete: {
    title:        'Mark Project Permanently Deleted',
    description:  'This is a final tracking state. The project will only appear under Permanently Deleted Projects.',
    note:         'Data is preserved. Firestore documents are NOT physically deleted. Google Drive files are NOT deleted. This is a tracking state only.',
    confirmLabel: 'Mark Permanently Deleted',
    confirmCls:   'bg-zinc-700 hover:bg-zinc-800 text-white',
    icon:         <SkullIcon className="w-5 h-5 text-zinc-600" />,
    showReason:   true,
    requireReason: true,
  },
  activate: {
    title:        'Activate Project',
    description:  'This project will be set to active and accessible by authorized users.',
    note:         'No data changes. This is a lifecycle state change.',
    confirmLabel: 'Activate Project',
    confirmCls:   'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon:         <UserCheck className="w-5 h-5 text-emerald-600" />,
    showReason:   false,
  },
  move_to_deleted: {
    title:        'Move Project Back to Deleted',
    description:  'This project will be moved from permanently deleted back to deleted status. From deleted, it can be restored to active.',
    note:         'Data is preserved. This action is restricted to Super Admin only. The project remains inaccessible to normal users until restored.',
    confirmLabel: 'Move Back to Deleted',
    confirmCls:   'bg-orange-600 hover:bg-orange-700 text-white',
    icon:         <RotateCcw className="w-5 h-5 text-orange-600" />,
    showReason:   true,
  },
}

function LifecycleActionModal({
  config,
  name,
  processing,
  context,
  onConfirm,
  onCancel,
}: {
  config:      ActionConfig
  name:        string
  processing:  boolean
  context?:    LifecycleContext
  onConfirm:   (reason?: string) => void
  onCancel:    () => void
}) {
  const [reason, setReason] = useState('')
  const canConfirm = !processing && (!config.requireReason || reason.trim().length >= 3)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 border border-border flex items-center justify-center shrink-0">
            {config.icon}
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">{config.title}</h2>
            <p className="text-xs text-text-secondary mt-0.5 truncate max-w-[280px]">{name}</p>
          </div>
        </div>

        {/* Lifecycle context — shown for restore/reactivate/move_to_deleted so admin can review who changed it and why */}
        {context && hasContext(context) && (
          <div className="rounded-xl border border-border bg-slate-50 px-3 py-2.5 mb-3 space-y-1.5 text-xs">
            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
              Lifecycle Context
            </p>
            {context.changedBy && (
              <div className="flex items-start gap-1.5">
                <span className="text-text-secondary/70 w-20 shrink-0">Changed By</span>
                <span className="text-text-primary font-medium break-all">{context.changedBy}</span>
              </div>
            )}
            {!!context.changedAt && (
              <div className="flex items-start gap-1.5">
                <span className="text-text-secondary/70 w-20 shrink-0">Changed At</span>
                <span className="text-text-primary font-medium">{fmtDate(context.changedAt)}</span>
              </div>
            )}
            {context.reason && (
              <div className="flex items-start gap-1.5">
                <span className="text-text-secondary/70 w-20 shrink-0">Reason</span>
                <span className="text-text-primary font-medium">{context.reason}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-text-secondary mb-3">{config.description}</p>

        <div className="text-xs rounded-lg border px-3 py-2.5 mb-4 space-y-1"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}>
          <p className="text-amber-700">{config.note}</p>
        </div>

        {config.showReason && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Reason {config.requireReason ? <span className="text-red-500">*</span> : '(optional)'}
            </label>
            <input
              autoFocus
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canConfirm) onConfirm(reason || undefined) }}
              placeholder={config.requireReason ? 'Required — enter a reason' : 'Optional reason…'}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary border border-border rounded-xl hover:bg-background transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={!canConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${config.confirmCls}`}
          >
            {processing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Action Buttons ───────────────────────────────────────────────────

function ContactActions({ user }: { user: DirectoryUser }) {
  const links = buildContactLinks(user)
  return (
    <div className="flex items-center gap-1">
      <a
        href={links.tel ?? undefined}
        onClick={links.tel ? undefined : e => e.preventDefault()}
        title={links.tel ? `Call ${user.displayName}` : 'No phone number'}
        className={[
          'inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs transition-colors',
          links.tel
            ? 'border-border text-text-secondary hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
            : 'border-border/50 text-text-secondary/30 cursor-not-allowed',
        ].join(' ')}
      >
        <Phone className="w-3.5 h-3.5" />
      </a>
      <a
        href={links.mailto}
        title={`Email ${user.displayName}`}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border text-text-secondary hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <Mail className="w-3.5 h-3.5" />
      </a>
      <a
        href={links.whatsapp ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={links.whatsapp ? undefined : e => e.preventDefault()}
        title={links.whatsapp ? `WhatsApp ${user.displayName}` : 'No phone number'}
        className={[
          'inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs transition-colors',
          links.whatsapp
            ? 'border-border text-text-secondary hover:text-green-600 hover:border-green-300 hover:bg-green-50'
            : 'border-border/50 text-text-secondary/30 cursor-not-allowed',
        ].join(' ')}
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

// ─── Lifecycle Action Buttons (per user row) ─────────────────────────────────

function UserLifecycleActions({
  effectiveStatus,
  onAction,
}: {
  effectiveStatus: LifecycleStatus
  onAction: (action: LifecycleAction) => void
}) {
  const { user: adminUser } = useAuth()
  const canMoveToDeleted = canPerformLifecycleAction(
    'move_to_deleted',
    adminUser?.role ?? '',
    adminUser?.email ?? '',
  )

  if (effectiveStatus === 'permanently_deleted') {
    if (!canMoveToDeleted) return null
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => onAction('move_to_deleted')} title="Move Back to Deleted"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {effectiveStatus === 'active' && (
        <>
          <button onClick={() => onAction('block')} title="Block User"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors">
            <ShieldBan className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('delete')} title="Mark Deleted"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {effectiveStatus === 'inactive' && (
        <>
          <button onClick={() => onAction('activate')} title="Activate User"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors">
            <UserCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('block')} title="Block User"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors">
            <ShieldBan className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('delete')} title="Mark Deleted"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {effectiveStatus === 'blocked' && (
        <>
          <button onClick={() => onAction('unblock')} title="Set Active"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('delete')} title="Mark Deleted"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {effectiveStatus === 'deleted' && (
        <>
          <button onClick={() => onAction('restore')} title="Restore to Active"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('permanently_delete')} title="Mark Permanently Deleted"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors">
            <SkullIcon className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Project Sub-panel ────────────────────────────────────────────────────────

function ProjectLifecycleActionBtns({
  effectiveStatus,
  onAction,
}: {
  effectiveStatus: LifecycleStatus
  onAction: (action: LifecycleAction) => void
}) {
  const { user: adminUser } = useAuth()
  const canMoveToDeleted = canPerformLifecycleAction(
    'move_to_deleted',
    adminUser?.role ?? '',
    adminUser?.email ?? '',
  )

  if (effectiveStatus === 'permanently_deleted') {
    if (!canMoveToDeleted) return null
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => onAction('move_to_deleted')} title="Move Back to Deleted"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {(effectiveStatus === 'active' || effectiveStatus === 'inactive') && (
        <>
          <button onClick={() => onAction('block')} title="Block Project"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors">
            <ShieldBan className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('delete')} title="Mark Deleted"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {effectiveStatus === 'blocked' && (
        <>
          <button onClick={() => onAction('unblock')} title="Set Active"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('delete')} title="Mark Deleted"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {effectiveStatus === 'deleted' && (
        <>
          <button onClick={() => onAction('restore')} title="Restore to Active"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAction('permanently_delete')} title="Mark Permanently Deleted"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors">
            <SkullIcon className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  )
}

interface ProjectActionState {
  project:    FAIProject
  action:     LifecycleAction
  processing: boolean
  context?:   LifecycleContext
}

function ProjectSubPanel({
  uid,
  ownerEmail,
  adminUid,
  adminEmail,
  adminRole,
}: {
  uid:        string
  ownerEmail?: string
  adminUid:   string
  adminEmail: string
  adminRole:  string
}) {
  const resolveEmail = useContext(EmailResolverCtx)
  const [projects, setProjects] = useState<FAIProject[] | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<ProjectActionState | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getUserProjects(uid).then(list => {
      if (!cancelled) { setProjects(list); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [uid])

  async function handleProjectAction(reason?: string) {
    if (!modal) return
    const { project, action } = modal
    const prevStatus = getEffectiveProjectLifecycleStatus(project)
    setModal(m => m ? { ...m, processing: true } : null)

    const PROJECT_ACTION_NEW_STATUS: Partial<Record<LifecycleAction, LifecycleStatus>> = {
      block:              'blocked',
      unblock:            'active',
      activate:           'active',
      delete:             'deleted',
      restore:            'active',
      permanently_delete: 'permanently_deleted',
      move_to_deleted:    'deleted',
    }

    try {
      if (action === 'block') {
        await setProjectLifecycleStatus(project.projectId, prevStatus, 'blocked', adminUid, adminEmail, reason)
        setProjects(prev => prev?.map(p => p.projectId === project.projectId ? { ...p, lifecycleStatus: 'blocked' } : p) ?? null)
      } else if (action === 'unblock' || action === 'activate') {
        await restoreProject(project.projectId, prevStatus, adminUid, adminEmail)
        setProjects(prev => prev?.map(p => p.projectId === project.projectId ? { ...p, lifecycleStatus: 'active' } : p) ?? null)
      } else if (action === 'delete') {
        await setProjectLifecycleStatus(project.projectId, prevStatus, 'deleted', adminUid, adminEmail, reason)
        setProjects(prev => prev?.map(p => p.projectId === project.projectId ? { ...p, lifecycleStatus: 'deleted' } : p) ?? null)
      } else if (action === 'restore') {
        await restoreProject(project.projectId, prevStatus, adminUid, adminEmail)
        setProjects(prev => prev?.map(p => p.projectId === project.projectId ? { ...p, lifecycleStatus: 'active' } : p) ?? null)
      } else if (action === 'permanently_delete') {
        await markProjectPermanentlyDeleted(project.projectId, prevStatus, adminUid, adminEmail, reason)
        setProjects(prev => prev?.map(p => p.projectId === project.projectId ? { ...p, lifecycleStatus: 'permanently_deleted' } : p) ?? null)
      } else if (action === 'move_to_deleted') {
        await movePermanentlyDeletedToDeleted('project', project.projectId, adminUid, adminEmail, adminRole, reason)
        setProjects(prev => prev?.map(p => p.projectId === project.projectId ? { ...p, lifecycleStatus: 'deleted' } : p) ?? null)
      }
      const newStatus = PROJECT_ACTION_NEW_STATUS[action]
      if (newStatus && ownerEmail !== undefined) {
        logLifecycleChanged({
          targetUid:      uid,
          targetEmail:    ownerEmail,
          previousStatus: prevStatus,
          newStatus,
          actorUid:       adminUid,
          actorEmail:     adminEmail,
          reason,
          targetType:     'project',
          targetName:     project.projectName,
        }).catch(() => {})
      }
    } catch (err) {
      console.error('Project lifecycle action failed:', err)
    } finally {
      setModal(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 text-xs text-text-secondary">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading projects…
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 text-xs text-text-secondary">
        <FolderOpen className="w-3.5 h-3.5 opacity-50" />
        No projects found for this user.
      </div>
    )
  }

  // Group projects by effective lifecycle status
  const grouped = new Map<LifecycleStatus, FAIProject[]>(
    LIFECYCLE_STATUS_ORDER.map(s => [s, []])
  )
  for (const p of projects) {
    const s = getEffectiveProjectLifecycleStatus(p)
    grouped.get(s)!.push(p)
  }

  return (
    <>
      {modal && (
        <LifecycleActionModal
          config={PROJECT_ACTION_CONFIG[modal.action]}
          name={modal.project.projectName || '(Untitled)'}
          processing={modal.processing}
          context={modal.context}
          onConfirm={handleProjectAction}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="divide-y divide-border/30">
        {LIFECYCLE_STATUS_ORDER.map(lc => {
          const bucket = grouped.get(lc) ?? []
          if (bucket.length === 0) return null
          return (
            <ProjectLifecycleBucket
              key={lc}
              category={lc}
              projects={bucket}
              onAction={(p, action) => {
                const prevStatus = getEffectiveProjectLifecycleStatus(p)
                const rawCtx = extractLifecycleContext(p as unknown as Record<string, unknown>, prevStatus)
                const context: LifecycleContext = { ...rawCtx, changedBy: resolveEmail(rawCtx.changedBy) }
                setModal({ project: p, action, processing: false, context })
              }}
            />
          )
        })}
      </div>
      <div className="px-4 py-2 text-[10px] text-text-secondary/60">
        {projects.length} project{projects.length !== 1 ? 's' : ''} total
      </div>
    </>
  )
}

function ProjectLifecycleBucket({
  category, projects, onAction,
}: {
  category:  LifecycleStatus
  projects:  FAIProject[]
  onAction:  (p: FAIProject, action: LifecycleAction) => void
}) {
  const [open, setOpen] = useState(category === 'active' || category === 'blocked')

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50/80 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-3 h-3 text-text-secondary/50 shrink-0" />
               : <ChevronRight className="w-3 h-3 text-text-secondary/50 shrink-0" />}
        <span className="text-xs font-semibold text-text-secondary">
          {PROJECT_LIFECYCLE_LABELS[category]}
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${LIFECYCLE_BADGE[category]}`}>
          {projects.length}
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-text-secondary uppercase tracking-wide border-b border-border/40">
                <th className="py-2 px-4 text-left font-semibold">Project Name</th>
                <th className="py-2 px-4 text-left font-semibold">Part #</th>
                <th className="py-2 px-4 text-left font-semibold">Status</th>
                <th className="py-2 px-4 text-left font-semibold">Updated</th>
                <th className="py-2 px-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const effLc = getEffectiveProjectLifecycleStatus(p)
                const isRestricted = effLc !== 'active' && effLc !== 'inactive'
                return (
                  <tr key={p.projectId}
                    className={`border-b border-border/30 transition-colors ${isRestricted ? 'opacity-60 bg-gray-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-2 px-4 font-medium max-w-[180px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className={`w-3 h-3 shrink-0 ${isRestricted ? 'text-gray-400' : 'text-primary/60'}`} />
                        <span className={`truncate ${isRestricted ? 'text-text-secondary' : 'text-text-primary'}`}>
                          {p.projectName || '(Untitled)'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 font-mono text-text-secondary">{p.partNumber || '—'}</td>
                    <td className="py-2 px-4"><WorkflowStatusBadge status={p.status} /></td>
                    <td className="py-2 px-4 text-text-secondary whitespace-nowrap">{fmtDate(p.updatedAt)}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-1">
                        {p.googleDriveViewUrl ? (
                          <a href={p.googleDriveViewUrl} target="_blank" rel="noopener noreferrer"
                            title="View PDF in Google Drive"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span title="No PDF uploaded"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/40 text-text-secondary/25 cursor-not-allowed">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <ProjectLifecycleActionBtns
                          effectiveStatus={effLc}
                          onAction={action => onAction(p, action)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Lifecycle Category Section (inside domain group) ────────────────────────

function LifecycleCategorySection({
  category,
  users,
  defaultOpen,
  onAction,
}: {
  category:    LifecycleStatus
  users:       DirectoryUser[]
  defaultOpen: boolean
  onAction:    (user: DirectoryUser, action: LifecycleAction) => void
}) {
  const [open, setOpen] = useState(defaultOpen)

  const label = LIFECYCLE_CATEGORY_LABELS[category]

  return (
    <div className="border-t border-border/40 first:border-t-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-background/60 transition-colors text-left"
      >
        {open
          ? <ChevronDown  className="w-3.5 h-3.5 text-text-secondary/50 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-secondary/50 shrink-0" />}
        <span className="text-xs font-semibold text-text-secondary">{label}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${LIFECYCLE_BADGE[category]}`}>
          {users.length}
        </span>
      </button>

      {open && users.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background text-xs text-text-secondary uppercase tracking-wide">
                  <th className="py-2 px-4 text-left font-semibold">Name</th>
                  <th className="py-2 px-4 text-left font-semibold">Email</th>
                  <th className="py-2 px-4 text-left font-semibold">Phone</th>
                  <th className="py-2 px-4 text-left font-semibold">Organization</th>
                  <th className="py-2 px-4 text-left font-semibold">Role</th>
                  <th className="py-2 px-4 text-left font-semibold">Last Login</th>
                  <th className="py-2 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <UserRow
                    key={u.uid}
                    user={u}
                    effectiveStatus={category}
                    onAction={action => onAction(u, action)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden p-3 space-y-2">
            {users.map(u => (
              <UserCard
                key={u.uid}
                user={u}
                effectiveStatus={category}
                onAction={action => onAction(u, action)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── User Row (desktop table) ─────────────────────────────────────────────────

function UserRow({
  user, effectiveStatus, onAction,
}: {
  user: DirectoryUser; effectiveStatus: LifecycleStatus; onAction: (a: LifecycleAction) => void
}) {
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const { user: adminUser } = useAuth()
  const isRestricted = effectiveStatus !== 'active' && effectiveStatus !== 'inactive'
  const canViewLog = adminUser?.role === 'super_admin' || isBootstrapDeveloper(adminUser?.email)

  return (
    <>
      <tr className={`border-b border-border/50 transition-colors ${isRestricted ? 'opacity-60 bg-gray-50/60' : projectsOpen ? 'bg-primary/5' : 'hover:bg-background/50'}`}>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar user={user} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className={`text-sm font-medium truncate ${isRestricted ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {user.displayName || '(No name)'}
                </p>
                {effectiveStatus !== 'active' && <LifecycleBadge status={effectiveStatus} />}
              </div>
              {!user.profileCompleted && effectiveStatus === 'active' && (
                <span className="text-[10px] text-amber-600 font-medium">Profile incomplete</span>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-text-secondary truncate max-w-[160px]">{user.email}</td>
        <td className="py-3 px-4 text-sm text-text-secondary font-mono">
          {user.mobileNumber?.trim() || <span className="text-text-secondary/40 not-italic font-sans">—</span>}
        </td>
        <td className="py-3 px-4 text-sm text-text-secondary truncate max-w-[140px]">
          {user.organizationName || <span className="text-text-secondary/40">—</span>}
        </td>
        <td className="py-3 px-4">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeClass(user.role)}`}>
            {user.role}
          </span>
        </td>
        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">{fmtDate(user.lastLoginAt)}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            <ContactActions user={user} />
            <button
              onClick={() => setProjectsOpen(o => !o)}
              title={projectsOpen ? 'Hide projects' : 'View projects'}
              className={[
                'inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs transition-colors ml-1',
                projectsOpen
                  ? 'border-primary/40 text-primary bg-primary/10'
                  : 'border-border/70 text-text-secondary/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5',
              ].join(' ')}
            >
              {projectsOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
            </button>
            {canViewLog && (
              <button
                onClick={() => setLogOpen(true)}
                title="View activity log"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/60 hover:text-violet-600 hover:border-violet-400 hover:bg-violet-50 transition-colors"
              >
                <ScrollText className="w-3.5 h-3.5" />
              </button>
            )}
            <UserLifecycleActions effectiveStatus={effectiveStatus} onAction={onAction} />
          </div>
        </td>
      </tr>
      {projectsOpen && adminUser && (
        <tr className="border-b border-border/50">
          <td colSpan={7} className="p-0">
            <div className="bg-slate-50/60 border-l-2 border-primary/30 ml-4 mr-4 my-2 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-white/60">
                <FolderOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-text-primary">
                  Projects by {user.displayName || user.email}
                </span>
              </div>
              <ProjectSubPanel
                uid={user.uid}
                ownerEmail={user.email}
                adminUid={adminUser.uid}
                adminEmail={adminUser.email}
                adminRole={adminUser.role}
              />
            </div>
          </td>
        </tr>
      )}
      {logOpen && (
        <tr>
          <td colSpan={7} className="p-0">
            <UserActivityLogModal targetUid={user.uid} targetEmail={user.email} onClose={() => setLogOpen(false)} />
          </td>
        </tr>
      )}
    </>
  )
}

// ─── User Card (mobile) ───────────────────────────────────────────────────────

function UserCard({
  user, effectiveStatus, onAction,
}: {
  user: DirectoryUser; effectiveStatus: LifecycleStatus; onAction: (a: LifecycleAction) => void
}) {
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const { user: adminUser } = useAuth()
  const isRestricted = effectiveStatus !== 'active' && effectiveStatus !== 'inactive'
  const canViewLog = adminUser?.role === 'super_admin' || isBootstrapDeveloper(adminUser?.email)

  return (
    <div className={`border rounded-xl shadow-sm transition-colors ${isRestricted ? 'opacity-60 bg-gray-50 border-gray-200' : 'bg-white border-border'}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar user={user} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`text-sm font-semibold truncate ${isRestricted ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {user.displayName || '(No name)'}
                </p>
                {effectiveStatus !== 'active' && <LifecycleBadge status={effectiveStatus} />}
              </div>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${roleBadgeClass(user.role)}`}>
            {user.role}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {user.mobileNumber?.trim() && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Phone className="w-3 h-3 shrink-0" /><span className="font-mono truncate">{user.mobileNumber}</span>
            </div>
          )}
          {user.organizationName && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Building2 className="w-3 h-3 shrink-0" /><span className="truncate">{user.organizationName}</span>
            </div>
          )}
          {user.lastLoginAt && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Clock className="w-3 h-3 shrink-0" /><span>{fmtDate(user.lastLoginAt)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <ContactActions user={user} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setProjectsOpen(o => !o)}
              className={[
                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
                projectsOpen
                  ? 'text-primary border-primary/40 bg-primary/10'
                  : 'text-text-secondary border-border hover:text-primary hover:border-primary/30 hover:bg-primary/5',
              ].join(' ')}
            >
              {projectsOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
              Projects
            </button>
            {canViewLog && (
              <button
                onClick={() => setLogOpen(true)}
                title="View activity log"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-violet-600 hover:border-violet-400 hover:bg-violet-50 transition-colors"
              >
                <ScrollText className="w-3.5 h-3.5" />
                Log
              </button>
            )}
            <UserLifecycleActions effectiveStatus={effectiveStatus} onAction={onAction} />
          </div>
        </div>
      </div>
      {projectsOpen && adminUser && (
        <div className="border-t border-border bg-slate-50/60">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
            <FolderOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-text-primary">Projects</span>
          </div>
          <ProjectSubPanel
            uid={user.uid}
            ownerEmail={user.email}
            adminUid={adminUser.uid}
            adminEmail={adminUser.email}
            adminRole={adminUser.role}
          />
        </div>
      )}
      {logOpen && (
        <UserActivityLogModal targetUid={user.uid} targetEmail={user.email} onClose={() => setLogOpen(false)} />
      )}
    </div>
  )
}

// ─── Domain Group ─────────────────────────────────────────────────────────────

function DomainGroup({
  domain,
  users,
  defaultOpen,
  onAction,
}: {
  domain:      string
  users:       DirectoryUser[]
  defaultOpen: boolean
  onAction:    (user: DirectoryUser, action: LifecycleAction) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const label    = domainDisplayLabel(domain)
  const isLegacy = domain === LEGACY_DOMAIN

  // Group users by effective lifecycle status
  const byStatus = useMemo(() => {
    const map = new Map<LifecycleStatus, DirectoryUser[]>(
      LIFECYCLE_STATUS_ORDER.map(s => [s, []])
    )
    for (const u of users) {
      const s = getEffectiveLifecycleStatus(u)
      map.get(s)!.push(u)
    }
    return map
  }, [users])

  const nonEmptyCategories = LIFECYCLE_STATUS_ORDER.filter(s => (byStatus.get(s)?.length ?? 0) > 0)

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-background/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Globe className={`w-4 h-4 ${isLegacy ? 'text-text-secondary/50' : 'text-primary'}`} />
          <span className={`text-sm font-semibold ${isLegacy ? 'text-text-secondary' : 'text-text-primary'}`}>{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
          <div className="flex gap-1">
            {nonEmptyCategories.map(s => (
              <span key={s} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${LIFECYCLE_BADGE[s]}`}>
                {byStatus.get(s)!.length} {s === 'permanently_deleted' ? 'perm' : s}
              </span>
            ))}
          </div>
        </div>
        {open
          ? <ChevronDown  className="w-4 h-4 text-text-secondary shrink-0" />
          : <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border">
          {LIFECYCLE_STATUS_ORDER.map(lc => {
            const bucket = byStatus.get(lc) ?? []
            return (
              <LifecycleCategorySection
                key={lc}
                category={lc}
                users={bucket}
                defaultOpen={lc === 'active' || lc === 'blocked'}
                onAction={onAction}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ users }: { users: DirectoryUser[] }) {
  const grouped   = groupUsersBySignupDomain(users)
  const domains   = [...grouped.keys()].filter(k => k !== LEGACY_DOMAIN)
  const legacy    = grouped.get(LEGACY_DOMAIN)?.length ?? 0

  let active = 0, inactive = 0, blocked = 0
  for (const u of users) {
    const s = getEffectiveLifecycleStatus(u)
    if (s === 'active')   active++
    else if (s === 'inactive') inactive++
    else if (s === 'blocked') blocked++
  }

  const cards = [
    { label: 'Total Users',      value: users.length,   color: 'text-primary'     },
    { label: 'Active',           value: active,         color: 'text-emerald-600' },
    { label: 'Inactive / Other', value: inactive,       color: 'text-amber-600'   },
    { label: 'Blocked',          value: blocked,        color: 'text-red-600'     },
    { label: 'Known Domains',    value: domains.length, color: 'text-primary'     },
    { label: 'Legacy / Unknown', value: legacy,         color: 'text-gray-500'    },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs text-text-secondary mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main ContactsTab ─────────────────────────────────────────────────────────

const ROLE_OPTIONS: Array<UserRole | 'all'> = ['all', 'engineer', 'manager', 'admin', 'super_admin', 'user']

interface ModalState {
  user:       DirectoryUser
  action:     LifecycleAction
  processing: boolean
  context?:   LifecycleContext
}

export function ContactsTab() {
  const { user: adminUser } = useAuth()

  const [allUsers,     setAllUsers]     = useState<DirectoryUser[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState<UserRole | 'all'>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [modal,        setModal]        = useState<ModalState | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeAllUsers(users => {
      setAllUsers(users); setLoading(false); setError(false)
    })
    return unsub
  }, [])

  const availableDomains = useMemo(() => {
    const set = new Set<string>()
    for (const u of allUsers) set.add(u.signupDomain || LEGACY_DOMAIN)
    return [...set].sort((a, b) => {
      if (a === LEGACY_DOMAIN) return 1
      if (b === LEGACY_DOMAIN) return -1
      return a.localeCompare(b)
    })
  }, [allUsers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allUsers.filter(u => {
      if (roleFilter   !== 'all' && u.role !== roleFilter)                              return false
      if (domainFilter !== 'all' && (u.signupDomain || LEGACY_DOMAIN) !== domainFilter) return false
      if (!q) return true
      return (
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobileNumber?.includes(q) ||
        u.organizationName?.toLowerCase().includes(q)
      )
    })
  }, [allUsers, search, roleFilter, domainFilter])

  const grouped = useMemo(() => groupUsersBySignupDomain(filtered), [filtered])

  const emailResolver = useCallback(
    (raw: string | undefined) => resolveEmailFromUsers(raw, allUsers),
    [allUsers],
  )

  const requestAction = useCallback((user: DirectoryUser, action: LifecycleAction) => {
    const prevStatus = getEffectiveLifecycleStatus(user)
    const rawCtx = extractLifecycleContext(user as unknown as Record<string, unknown>, prevStatus)
    const context: LifecycleContext = { ...rawCtx, changedBy: emailResolver(rawCtx.changedBy) }
    setModal({ user, action, processing: false, context })
  }, [emailResolver])

  async function handleConfirmAction(reason?: string) {
    if (!modal || !adminUser) return
    const { user, action } = modal
    const prevStatus = getEffectiveLifecycleStatus(user)

    setModal(m => m ? { ...m, processing: true } : null)

    const ACTION_NEW_STATUS: Partial<Record<LifecycleAction, LifecycleStatus>> = {
      block:              'blocked',
      unblock:            'active',
      activate:           'active',
      delete:             'deleted',
      restore:            'active',
      permanently_delete: 'permanently_deleted',
      move_to_deleted:    'deleted',
    }

    try {
      if (action === 'block') {
        await setUserLifecycleStatus(user.uid, prevStatus, 'blocked', adminUser.uid, adminUser.email, reason)
      } else if (action === 'unblock' || action === 'activate') {
        await restoreUser(user.uid, prevStatus, adminUser.uid, adminUser.email)
      } else if (action === 'delete') {
        await setUserLifecycleStatus(user.uid, prevStatus, 'deleted', adminUser.uid, adminUser.email, reason)
      } else if (action === 'restore') {
        await restoreUser(user.uid, prevStatus, adminUser.uid, adminUser.email)
      } else if (action === 'permanently_delete') {
        await markUserPermanentlyDeleted(user.uid, prevStatus, adminUser.uid, adminUser.email, reason)
      } else if (action === 'move_to_deleted') {
        await movePermanentlyDeletedToDeleted('user', user.uid, adminUser.uid, adminUser.email, adminUser.role, reason)
      }
      const newStatus = ACTION_NEW_STATUS[action]
      if (newStatus) {
        logLifecycleChanged({
          targetUid:      user.uid,
          targetEmail:    user.email,
          previousStatus: prevStatus,
          newStatus,
          actorUid:       adminUser.uid,
          actorEmail:     adminUser.email,
          reason,
          targetType:     'user',
          targetName:     user.displayName || user.email,
        }).catch(() => {})
      }
    } catch (err) {
      console.error('Lifecycle action failed:', err)
    } finally {
      setModal(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-error">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Failed to load users. Check Firestore permissions.</span>
      </div>
    )
  }

  return (
    <EmailResolverCtx.Provider value={emailResolver}>
      <>
      {modal && (
        <LifecycleActionModal
          config={USER_ACTION_CONFIG[modal.action]}
          name={modal.user.displayName || modal.user.email || ''}
          processing={modal.processing}
          context={modal.context}
          onConfirm={handleConfirmAction}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="space-y-6">
        <SummaryCards users={allUsers} />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or org…"
              className="input-field pl-9 text-sm w-full"
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
            className="input-field text-sm w-full sm:w-44">
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r}</option>)}
          </select>
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}
            className="input-field text-sm w-full sm:w-56">
            <option value="all">All Domains</option>
            {availableDomains.map(d => <option key={d} value={d}>{domainDisplayLabel(d)}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users className="w-4 h-4" />
          <span>
            {filtered.length === allUsers.length
              ? `${allUsers.length} users across ${grouped.size} ${grouped.size === 1 ? 'domain' : 'domains'}`
              : `${filtered.length} of ${allUsers.length} users`}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
            <UserX className="w-10 h-10 opacity-30" />
            <p className="text-sm">No users match your filters.</p>
          </div>
        ) : (
          <div>
            {[...grouped.entries()].map(([domain, users], idx) => (
              <DomainGroup
                key={domain}
                domain={domain}
                users={users}
                defaultOpen={idx === 0}
                onAction={requestAction}
              />
            ))}
          </div>
        )}
      </div>
      </>
    </EmailResolverCtx.Provider>
  )
}
