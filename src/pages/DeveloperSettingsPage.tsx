import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Code2, Users, Settings2, Shield, Plus, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle2, Loader2, Lock, RefreshCw, Save,
  Bell, Flag, Wrench, ChevronDown, Trash2, Info, RotateCcw,
  Type, Palette, UserCog, Search, Filter,
  Database, Play, RotateCw, Download, Package,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { BOOTSTRAP_DEVELOPER_EMAILS } from '../config/developerBootstrap'
import {
  subscribeUsers,
  updateUserRole,
  canEditUserRole,
  getAllowedTargetRoles,
  type UserRecord,
} from '../services/roleManagementService'
import type { UserRole } from '../auth/AuthTypes'
import { useProductConfig } from '../config/hooks/useProductConfig'
import {
  seedDemoProjects,
  deleteDemoProjects,
  exportDemoDataset,
  getDemoProjectSummary,
  type SeedProgress,
  type SeedResult,
} from '../scripts/demoDataSeeder'
import {
  subscribeToDevelopers,
  addDeveloper,
  toggleDeveloper,
  updateDeveloperRole,
  deleteDeveloper,
  type DeveloperRecord,
  type DeveloperRole,
} from '../services/developerConfigService'
import {
  getBetaNotice,
  saveBetaNotice,
  restoreDefaultConfigs,
  BETA_NOTICE_DEFAULTS,
  type BetaNoticeConfig,
  type BetaNoticeSeverity,
  type RestoreResult,
} from '../services/betaNoticeService'
import {
  subscribeToWatermark,
  saveWatermark,
  resetWatermarkToDefault,
  WATERMARK_DEFAULTS,
  type WatermarkConfig,
  type WatermarkVariant,
} from '../services/watermarkService'
import {
  subscribeToBrandingPresets,
  subscribeToActiveBranding,
  createBrandingPreset,
  updateBrandingPreset,
  deleteBrandingPreset,
  setActiveBranding,
  restoreDefaultBranding,
  seedDefaultBrandings,
  type BrandingPreset,
} from '../services/brandingService'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'developers' | 'configurations' | 'users' | 'demo'

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <Lock className="w-6 h-6 text-red-500" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-text-primary">Access Denied</h1>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Developer Settings is restricted to authorised developers only.
        </p>
      </div>
      <Link to="/dashboard" className="btn-primary text-sm mt-1">
        ← Back to Dashboard
      </Link>
    </div>
  )
}

// ─── Feedback banner ──────────────────────────────────────────────────────────

function FeedbackBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm
      ${type === 'success'
        ? 'bg-success/10 border border-success/20 text-success'
        : 'bg-error/10 border border-error/20 text-error'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  )
}

// ─── Collapsible card ─────────────────────────────────────────────────────────

function CollapsibleCard({
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  badge,
  headerRight,
  disabled = false,
  children,
}: {
  title: string
  subtitle: string
  icon: typeof Shield
  iconBg: string
  iconColor: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  badge?: React.ReactNode
  headerRight?: React.ReactNode
  disabled?: boolean
  children: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (val: boolean) => isControlled ? onOpenChange?.(val) : setInternalOpen(val)

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={[
          'w-full flex items-center gap-3 p-4 sm:p-5 text-left transition-colors',
          disabled ? 'cursor-default opacity-60' : 'hover:bg-gray-50/60',
        ].join(' ')}
      >
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-text-primary leading-tight">{title}</h2>
            {badge}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">{subtitle}</p>
        </div>
        {/* Right action — stop propagation so it doesn't toggle the section */}
        {headerRight && (
          <div
            onClick={e => e.stopPropagation()}
            className="shrink-0"
          >
            {headerRight}
          </div>
        )}
        {!disabled && (
          <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 shrink-0
            ${open ? 'rotate-180' : ''}`} />
        )}
        {disabled && (
          <span className="text-[10px] font-semibold bg-gray-100 text-text-secondary px-2 py-0.5 rounded-full shrink-0">
            Soon
          </span>
        )}
      </button>

      {open && !disabled && (
        <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Developer avatar ─────────────────────────────────────────────────────────

function DevAvatar({ name }: { name: string }) {
  const initials = name.replace(/[^a-zA-Z\s]/g, '').split(' ')
    .filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || name.slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-primary select-none">{initials}</span>
    </div>
  )
}

// ─── Developer card ───────────────────────────────────────────────────────────

function DeveloperCard({
  dev,
  currentEmail,
  canManage,
  onToggle,
  onRoleChange,
  onDelete,
  actionError,
}: {
  dev: DeveloperRecord
  currentEmail: string | null
  canManage: boolean
  onToggle: (dev: DeveloperRecord) => void
  onRoleChange: (email: string, role: DeveloperRole) => void
  onDelete: (email: string) => Promise<void>
  actionError?: string
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isSelf = dev.email === currentEmail

  const addedDate = dev.addedAt
    ? new Date((dev.addedAt as unknown as { seconds: number }).seconds * 1000)
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(dev.email)
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  return (
    <div className="py-3 first:pt-1 last:pb-0">
      {canManage && deleteConfirm ? (
        // Confirm row
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-error shrink-0" />
          <p className="text-sm text-error flex-1 min-w-0 truncate">
            Delete <span className="font-semibold">{dev.displayName || dev.email}</span>?
          </p>
          <button
            onClick={() => setDeleteConfirm(false)}
            className="text-xs font-medium text-text-secondary hover:text-text-primary px-2 py-1 transition-colors shrink-0"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white
              bg-error hover:bg-error/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <DevAvatar name={dev.displayName || dev.email} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-semibold text-text-primary">
                {dev.displayName || dev.email}
              </span>
              {dev.displayName && (
                <span className="text-xs text-text-secondary truncate max-w-[180px]">{dev.email}</span>
              )}
              {isSelf && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                  bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  you
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canManage ? (
                <select
                  value={dev.role}
                  onChange={e => onRoleChange(dev.email, e.target.value as DeveloperRole)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                    cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30
                    appearance-none pr-4
                    ${dev.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-100'}`}
                  title="Change role"
                >
                  <option value="developer">developer</option>
                  <option value="admin">admin</option>
                </select>
              ) : (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                  ${dev.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                  {dev.role}
                </span>
              )}
              {addedDate && (
                <span className="text-[11px] text-text-secondary">
                  Added by {dev.addedBy} · {addedDate}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span className={`hidden sm:inline text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0
            ${dev.enabled
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-gray-100 text-text-secondary border border-border'}`}>
            {dev.enabled ? 'enabled' : 'disabled'}
          </span>

          {/* Toggle — admin only */}
          {canManage && (
            <button
              onClick={() => onToggle(dev)}
              title={dev.enabled ? 'Disable access' : 'Enable access'}
              className="text-text-secondary hover:text-primary transition-colors shrink-0"
            >
              {dev.enabled
                ? <ToggleRight className="w-6 h-6 text-primary" />
                : <ToggleLeft  className="w-6 h-6" />}
            </button>
          )}

          {/* Delete — admin only */}
          {canManage && (
            <button
              onClick={() => setDeleteConfirm(true)}
              title="Delete developer"
              disabled={isSelf}
              className="text-text-secondary hover:text-error transition-colors shrink-0
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {actionError && (
        <p className="text-xs text-error mt-1.5 ml-12">{actionError}</p>
      )}
    </div>
  )
}

// ─── Developers tab ───────────────────────────────────────────────────────────

function DevelopersTab({ currentEmail, canManage }: { currentEmail: string | null; canManage: boolean }) {
  const [firestoreDevs, setFirestoreDevs] = useState<DeveloperRecord[]>([])

  const [addEmail,       setAddEmail]       = useState('')
  const [addDisplayName, setAddDisplayName] = useState('')
  const [addRole,        setAddRole]        = useState<DeveloperRole>('developer')
  const [addFormOpen,    setAddFormOpen]    = useState(false)
  const [addStatus,      setAddStatus]      = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [addError,       setAddError]       = useState('')

  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    return subscribeToDevelopers(devs => setFirestoreDevs(devs))
  }, [])

  const setActionError = (email: string, msg: string) =>
    setActionErrors(prev => ({ ...prev, [email]: msg }))

  const handleAdd = async () => {
    const email = addEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddError('Enter a valid email address.')
      return
    }
    setAddStatus('saving')
    setAddError('')
    try {
      await addDeveloper(email, {
        displayName: addDisplayName.trim(),
        role:        addRole,
        addedBy:     currentEmail ?? 'unknown',
      })
      setAddEmail('')
      setAddDisplayName('')
      setAddRole('developer')
      setAddFormOpen(false)
      setAddStatus('done')
      setTimeout(() => setAddStatus('idle'), 3000)
    } catch (err) {
      setAddStatus('error')
      setAddError((err as Error).message || 'Failed to add developer.')
    }
  }

  const handleToggle = async (dev: DeveloperRecord) => {
    const enabledCount = firestoreDevs.filter(d => d.enabled).length
    if (dev.email === currentEmail && dev.enabled && enabledCount <= 1) {
      setActionError(dev.email, 'Cannot disable yourself — you are the only active developer.')
      return
    }
    setActionError(dev.email, '')
    try {
      await toggleDeveloper(dev.email, !dev.enabled)
    } catch (err) {
      setActionError(dev.email, (err as Error).message || 'Update failed.')
    }
  }

  const handleRoleChange = async (email: string, role: DeveloperRole) => {
    setActionError(email, '')
    try {
      await updateDeveloperRole(email, role)
    } catch (err) {
      setActionError(email, (err as Error).message || 'Failed to update role.')
    }
  }

  const handleDelete = async (email: string) => {
    if (email === currentEmail) {
      setActionError(email, 'Cannot delete your own account.')
      return
    }
    setActionError(email, '')
    try {
      await deleteDeveloper(email)
    } catch (err) {
      setActionError(email, (err as Error).message || 'Failed to delete developer.')
    }
  }

  const [managedCardOpen, setManagedCardOpen] = useState(false)

  const nonBootstrapDevs = firestoreDevs.filter(
    d => !(BOOTSTRAP_DEVELOPER_EMAILS as string[]).includes(d.email),
  )

  const managedCount = nonBootstrapDevs.length

  return (
    <div className="flex flex-col gap-3">

      {/* Bootstrap developers */}
      <CollapsibleCard
        title="Bootstrap Developers"
        subtitle="Hardcoded in source · Always active · Cannot be removed"
        icon={Shield}
        iconBg="bg-primary-light"
        iconColor="text-primary"
        defaultOpen={false}
      >
        <div className="flex flex-col gap-2">
          {BOOTSTRAP_DEVELOPER_EMAILS.map(email => {
            const isSelf = email === currentEmail
            return (
              <div key={email} className="flex items-center gap-2.5">
                {/* Green online indicator */}
                <span className="relative flex shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-success block" />
                  <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
                </span>
                <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{email}</span>
                {isSelf && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                    bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    you
                  </span>
                )}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                  bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                  Super Admin
                </span>
              </div>
            )
          })}
        </div>
      </CollapsibleCard>

      {/* Managed developers */}
      <CollapsibleCard
        title="Managed Developers"
        subtitle="Stored in Firestore · Role, access, and delete available anytime"
        icon={Users}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        open={managedCardOpen}
        onOpenChange={setManagedCardOpen}
        badge={
          managedCount > 0
            ? <span className="text-[11px] font-semibold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                {managedCount}
              </span>
            : undefined
        }
        headerRight={
          canManage ? (
            <button
              onClick={() => { setManagedCardOpen(true); setAddFormOpen(true); setAddError('') }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold
                px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Developer
            </button>
          ) : (
            <span className="text-[10px] font-semibold text-text-secondary bg-gray-100
              px-2.5 py-1 rounded-lg border border-border">
              View only
            </span>
          )
        }
      >
        <div className="flex flex-col gap-3">

          {addStatus === 'done' && (
            <FeedbackBanner type="success" message="Developer added successfully." />
          )}

          {/* Add form — only visible to admin developers */}
          {canManage && addFormOpen && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary-light/30 flex flex-col gap-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">New Developer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="developer@example.com"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Display Name</label>
                  <input
                    type="text"
                    value={addDisplayName}
                    onChange={e => setAddDisplayName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Role</label>
                  <select
                    value={addRole}
                    onChange={e => setAddRole(e.target.value as DeveloperRole)}
                    className="appearance-none pl-3 pr-7 py-2 text-sm border border-border
                      rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mt-4 flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => { setAddFormOpen(false); setAddError('') }}
                    className="text-sm font-medium text-text-secondary hover:text-error transition-colors px-3 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={addStatus === 'saving'}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold
                      px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90
                      transition-colors disabled:opacity-50"
                  >
                    {addStatus === 'saving'
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Plus className="w-3.5 h-3.5" />}
                    Add
                  </button>
                </div>
              </div>
              {addError && <p className="text-xs text-error">{addError}</p>}
            </div>
          )}

          {/* List */}
          {nonBootstrapDevs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Users className="w-7 h-7 text-border mx-auto mb-2" />
              <p className="text-sm font-medium text-text-secondary">No managed developers yet</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Click "Add Developer" above to grant access.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {nonBootstrapDevs.map(dev => (
                <DeveloperCard
                  key={dev.email}
                  dev={dev}
                  currentEmail={currentEmail}
                  canManage={canManage}
                  onToggle={handleToggle}
                  onRoleChange={handleRoleChange}
                  onDelete={handleDelete}
                  actionError={actionErrors[dev.email]}
                />
              ))}
            </div>
          )}

          {/* Role legend */}
          <div className="pt-2 border-t border-border flex flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">developer</span>
              <span className="text-[11px] text-text-secondary">Access to Developer Settings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">admin</span>
              <span className="text-[11px] text-text-secondary">Full config access</span>
            </div>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  )
}

// ─── Beta Banner config panel ─────────────────────────────────────────────────

function BetaBannerConfig() {
  const [form, setForm]             = useState<BetaNoticeConfig>(BETA_NOTICE_DEFAULTS)
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [feedback, setFeedback]     = useState('')

  const loadConfig = async () => {
    setLoadStatus('loading')
    setFeedback('')
    try {
      const config = await getBetaNotice()
      setForm(config)
      setLoadStatus('idle')
    } catch {
      setLoadStatus('error')
      setFeedback('Failed to load config from Firestore.')
    }
  }

  useEffect(() => { void loadConfig() }, [])

  const handleSave = async () => {
    setSaveStatus('saving')
    setFeedback('')
    try {
      await saveBetaNotice(form)
      setSaveStatus('saved')
      setFeedback('Config saved. Banner will update live on all open sessions.')
      setTimeout(() => { setSaveStatus('idle'); setFeedback('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to save config.')
    }
  }

  const handleReset = async () => {
    setSaveStatus('saving')
    setFeedback('')
    try {
      await saveBetaNotice(BETA_NOTICE_DEFAULTS)
      setForm(BETA_NOTICE_DEFAULTS)
      setSaveStatus('saved')
      setFeedback('Reset to defaults and saved.')
      setTimeout(() => { setSaveStatus('idle'); setFeedback('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to reset config.')
    }
  }

  const isBusy = saveStatus === 'saving' || loadStatus === 'loading'

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-secondary">
          Shown on Dashboard, Projects, and PDF Viewer.
        </p>
        <button
          onClick={loadConfig}
          disabled={isBusy}
          title="Reload from Firestore"
          className="inline-flex items-center gap-1.5 text-xs font-medium
            text-text-secondary hover:text-primary border border-border rounded-lg
            px-3 py-1.5 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadStatus === 'loading' ? 'animate-spin' : ''}`} />
          Reload
        </button>
      </div>

      {/* Enabled toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-gray-50/50">
        <div>
          <p className="text-sm font-medium text-text-primary">Banner Enabled</p>
          <p className="text-xs text-text-secondary">Show the beta banner across all pages</p>
        </div>
        <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
          {form.enabled
            ? <ToggleRight className="w-7 h-7 text-primary" />
            : <ToggleLeft  className="w-7 h-7 text-text-secondary" />}
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5 block">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        />
      </div>

      {/* Message */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5 block">
          Message
        </label>
        <textarea
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white
            resize-none leading-relaxed"
        />
      </div>

      {/* Severity + Dismissible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5 block">
            Severity
          </label>
          <div className="relative">
            <select
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value as BetaNoticeSeverity }))}
              className="appearance-none w-full pl-3 pr-7 py-2 text-sm border border-border
                rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="error">Error (red)</option>
              <option value="warning">Warning (amber)</option>
              <option value="info">Info (blue)</option>
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-xs">▾</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5 block">
            Dismissible
          </label>
          <div className="flex items-center gap-2 py-2">
            <button onClick={() => setForm(f => ({ ...f, dismissible: !f.dismissible }))}>
              {form.dismissible
                ? <ToggleRight className="w-7 h-7 text-primary" />
                : <ToggleLeft  className="w-7 h-7 text-text-secondary" />}
            </button>
            <span className="text-sm text-text-secondary">
              {form.dismissible ? 'Users can dismiss' : 'Permanent (no X)'}
            </span>
          </div>
        </div>
      </div>

      {/* Live preview */}
      {form.enabled && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Preview
          </p>
          <div className={`rounded-xl border px-4 py-2.5 flex items-start gap-2.5
            ${form.severity === 'error'   ? 'bg-red-50 border-red-200' :
              form.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                                            'bg-blue-50 border-blue-200'}`}>
            {form.severity === 'info'
              ? <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              : <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5
                  ${form.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`} />}
            <p className={`text-xs font-medium leading-relaxed flex-1
              ${form.severity === 'error'   ? 'text-red-700' :
                form.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>
              <span className="font-bold">{form.title}:</span>{' '}{form.message}
            </p>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <FeedbackBanner
          type={saveStatus === 'error' || loadStatus === 'error' ? 'error' : 'success'}
          message={feedback}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-border flex-wrap">
        <button
          onClick={handleReset}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 text-sm font-medium
            text-text-secondary hover:text-error border border-border rounded-lg
            px-4 py-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={isBusy}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold
            px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90
            transition-colors disabled:opacity-50"
        >
          {saveStatus === 'saving'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />}
          Save Config
        </button>
      </div>
    </div>
  )
}

// ─── Watermark config panel ───────────────────────────────────────────────────

function WatermarkConfigPanel() {
  const { firebaseUser } = useAuth()
  const [form, setForm]             = useState<WatermarkConfig>(WATERMARK_DEFAULTS)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [feedback, setFeedback]     = useState('')

  useEffect(() => { return subscribeToWatermark(setForm) }, [])

  const handleSave = async () => {
    setSaveStatus('saving')
    setFeedback('')
    try {
      await saveWatermark(form, firebaseUser?.email ?? 'developer')
      setSaveStatus('saved')
      setFeedback('Watermark config saved. Updates live across all open sessions.')
      setTimeout(() => { setSaveStatus('idle'); setFeedback('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to save.')
    }
  }

  const handleReset = async () => {
    setSaveStatus('saving')
    setFeedback('')
    try {
      await resetWatermarkToDefault(firebaseUser?.email ?? 'developer')
      setForm(WATERMARK_DEFAULTS)
      setSaveStatus('saved')
      setFeedback('Reset to defaults and saved.')
      setTimeout(() => { setSaveStatus('idle'); setFeedback('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to reset.')
    }
  }

  const isBusy = saveStatus === 'saving'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-secondary">
        Background watermark shown on all authenticated pages. Never appears in PDF exports.
      </p>

      {/* Enabled toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-gray-50/50">
        <div>
          <p className="text-sm font-medium text-text-primary">Watermark Enabled</p>
          <p className="text-xs text-text-secondary">Show watermark text across all pages</p>
        </div>
        <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
          {form.enabled
            ? <ToggleRight className="w-7 h-7 text-primary" />
            : <ToggleLeft  className="w-7 h-7 text-text-secondary" />}
        </button>
      </div>

      {/* Text input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Watermark Text
          </label>
          <span className={`text-xs ${form.text.length >= 45 ? 'text-amber-600' : 'text-text-secondary'}`}>
            {form.text.length}/50
          </span>
        </div>
        <input
          type="text"
          value={form.text}
          onChange={e => setForm(f => ({ ...f, text: e.target.value.slice(0, 50) }))}
          maxLength={50}
          placeholder="FAI AS9102 BETA TESTING"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-mono uppercase"
        />
      </div>

      {/* Opacity slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Opacity
          </label>
          <span className="text-xs font-mono text-text-secondary">
            {(form.opacity * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={0.01}
          max={0.20}
          step={0.01}
          value={form.opacity}
          onChange={e => setForm(f => ({ ...f, opacity: parseFloat(e.target.value) }))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
          <span>1% (subtle)</span>
          <span>20% (visible)</span>
        </div>
      </div>

      {/* Variant selector */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
          Colour Variant
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['light', 'dark', 'auto'] as WatermarkVariant[]).map(v => (
            <label key={v}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                form.variant === v
                  ? 'border-primary bg-primary-light text-primary font-semibold'
                  : 'border-border bg-white text-text-secondary hover:border-primary/30'
              }`}>
              <input
                type="radio"
                name="watermarkVariant"
                value={v}
                checked={form.variant === v}
                onChange={() => setForm(f => ({ ...f, variant: v }))}
                className="sr-only"
              />
              {v === 'light' && 'Light (dark text)'}
              {v === 'dark'  && 'Dark (white text)'}
              {v === 'auto'  && 'Auto (per-page)'}
            </label>
          ))}
        </div>
        {form.variant === 'auto' && (
          <p className="text-[11px] text-text-secondary mt-1.5">
            Auto uses dark text on light pages, white text on the PDF workspace.
          </p>
        )}
      </div>

      {/* Live preview */}
      {form.enabled && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Preview</p>
          <div className="grid grid-cols-2 gap-2">
            {(['light', 'dark'] as const).map(variant => {
              const color = variant === 'dark'
                ? `rgba(255,255,255,${form.opacity})`
                : `rgba(17,24,39,${form.opacity})`
              const isSelected = form.variant === variant || form.variant === 'auto'
              return (
                <div key={variant}
                  className={`relative h-20 rounded-xl overflow-hidden flex items-center justify-center transition-all
                    ${isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}
                    ${variant === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                  <span
                    className="text-xl font-black tracking-widest uppercase whitespace-nowrap -rotate-[35deg] select-none"
                    style={{ color }}>
                    {form.text || WATERMARK_DEFAULTS.text}
                  </span>
                  <span className={`absolute bottom-1.5 right-2 text-[9px] font-semibold
                    ${variant === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {variant}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <FeedbackBanner
          type={saveStatus === 'error' ? 'error' : 'success'}
          message={feedback}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-border flex-wrap">
        <button
          onClick={handleReset}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 text-sm font-medium
            text-text-secondary hover:text-error border border-border rounded-lg
            px-4 py-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={isBusy}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold
            px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90
            transition-colors disabled:opacity-50"
        >
          {isBusy
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />}
          Save Config
        </button>
      </div>
    </div>
  )
}

// ─── Domain manager (reusable sub-component for branding form) ───────────────

function isValidHostname(value: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(value)
}

function DomainManager({
  domains,
  onChange,
}: {
  domains: string[]
  onChange: (domains: string[]) => void
}) {
  const [input,    setInput]    = useState('')
  const [inputErr, setInputErr] = useState('')

  const handleAdd = () => {
    const val = input.trim().toLowerCase()
    if (!val) return
    if (!isValidHostname(val)) {
      setInputErr('Invalid hostname format (e.g. fai.ev.engineer)')
      return
    }
    if (domains.includes(val)) {
      setInputErr('Domain already added.')
      return
    }
    onChange([...domains, val])
    setInput('')
    setInputErr('')
  }

  const handleRemove = (d: string) => onChange(domains.filter(x => x !== d))

  return (
    <div>
      <label className="text-xs font-medium text-text-secondary mb-1.5 block">
        Domains
        <span className="ml-1 text-[10px] text-text-secondary font-normal">
          — branding auto-loads when hostname matches
        </span>
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setInputErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="fai.ev.engineer"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg font-mono
            focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-2 text-sm font-semibold bg-primary text-white rounded-lg
            hover:bg-primary/90 transition-colors shrink-0"
        >
          Add
        </button>
      </div>
      {inputErr && <p className="text-xs text-error mt-1">{inputErr}</p>}
      {domains.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {domains.map(d => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 text-xs font-mono bg-primary-light
                text-primary px-2.5 py-1 rounded-full border border-primary/20"
            >
              {d}
              <button
                type="button"
                onClick={() => handleRemove(d)}
                className="text-primary/60 hover:text-error transition-colors leading-none"
                aria-label={`Remove ${d}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {domains.length === 0 && (
        <p className="text-[11px] text-text-secondary mt-1.5 italic">
          No domains — branding will not auto-load for any hostname.
        </p>
      )}
    </div>
  )
}

// ─── Seed default brandings panel ────────────────────────────────────────────

function SeedBrandingsPanel() {
  const { firebaseUser } = useAuth()
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ seeded: string[]; updated: string[]; errors: string[] } | null>(null)

  const handleSeed = async () => {
    setStatus('running')
    setResult(null)
    try {
      const r = await seedDefaultBrandings(firebaseUser?.email ?? 'developer')
      setResult(r)
      setStatus(r.errors.length > 0 ? 'error' : 'done')
    } catch (err) {
      setResult({ seeded: [], updated: [], errors: [(err as Error).message || 'Unexpected error.'] })
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-secondary">
        Creates or updates the two default partner brandings (<code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">fai</code> and <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">ifab</code>) with
        correct domain mappings and contact details. Safe to run repeatedly — matches by <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">businessCode</code>.
      </p>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-border">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Brandings to seed</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { code: 'fai',  name: 'FAI Engineer',  domain: 'fai.ev.engineer',  email: 'info@itelematics.com',  wa: '918880423666' },
            { code: 'ifab', name: 'iFab Tech',     domain: 'fai.ifab.tech',    email: 'sri@ifab.tech',         wa: '447714296479' },
          ].map(b => (
            <div key={b.code} className="flex items-start gap-3 px-4 py-3">
              <code className="text-xs font-mono text-primary bg-primary-light px-1.5 py-0.5 rounded shrink-0 mt-0.5">{b.code}</code>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{b.name}</p>
                <p className="text-[11px] text-text-secondary">{b.domain} · {b.email} · wa:{b.wa}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {result && (
        <div className="flex flex-col gap-1">
          {result.seeded.map(name => (
            <div key={name} className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs"><span className="font-semibold">{name}</span> — created</span>
            </div>
          ))}
          {result.updated.map(name => (
            <div key={name} className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs"><span className="font-semibold">{name}</span> — updated</span>
            </div>
          ))}
          {result.errors.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-error">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs">{msg}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1 border-t border-border">
        <p className="text-[11px] text-text-secondary flex-1">
          Tech support number <code className="text-[10px] bg-gray-100 px-1 py-0.5 rounded">+919108206147</code> applied to both.
        </p>
        <button
          onClick={handleSeed}
          disabled={status === 'running'}
          className="inline-flex items-center gap-2 text-sm font-semibold
            px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg
            transition-colors disabled:opacity-50 shrink-0"
        >
          {status === 'running'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Database className="w-4 h-4" />}
          Seed Brandings
        </button>
      </div>
    </div>
  )
}

// ─── Branding settings panel ──────────────────────────────────────────────────

type BrandingFormState = {
  businessName:           string
  businessCode:           string
  poweredByText:          string
  poweredByUrl:           string
  website:                string
  supportEmail:           string
  supportPhone:           string
  whatsappNumber:         string
  technicalSupportNumber: string
  domains:                string[]
  enabled:                boolean
  businessCodeCustomized: boolean
}

const EMPTY_BRANDING_FORM: BrandingFormState = {
  businessName:           '',
  businessCode:           '',
  poweredByText:          'EV.ENGINEER',
  poweredByUrl:           'https://ev.engineer',
  website:                '',
  supportEmail:           '',
  supportPhone:           '',
  whatsappNumber:         '',
  technicalSupportNumber: '',
  domains:                [],
  enabled:                true,
  businessCodeCustomized: false,
}

function suggestBrandingCode(name: string): string {
  return name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9\-_]/g, '') ?? ''
}

function BrandingSettingsPanel() {
  const { firebaseUser } = useAuth()
  const [presets, setPresets]               = useState<BrandingPreset[]>([])
  const [activeBrandingId, setActiveBrandingId] = useState<string | null>(null)
  const [form, setForm]                     = useState<BrandingFormState>(EMPTY_BRANDING_FORM)
  const [editingPreset, setEditingPreset]   = useState<BrandingPreset | null>(null)
  const [formOpen, setFormOpen]             = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus]         = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [feedback, setFeedback]             = useState('')

  useEffect(() => {
    const unsub1 = subscribeToBrandingPresets(setPresets)
    const unsub2 = subscribeToActiveBranding(preset => setActiveBrandingId(preset?.brandingId ?? null))
    return () => { unsub1(); unsub2() }
  }, [])

  const openAdd = () => {
    setEditingPreset(null)
    setForm(EMPTY_BRANDING_FORM)
    setFormOpen(true)
    setFeedback('')
    setSaveStatus('idle')
  }

  const openEdit = (preset: BrandingPreset) => {
    setEditingPreset(preset)
    setForm({
      businessName:           preset.businessName,
      businessCode:           preset.businessCode,
      poweredByText:          preset.poweredByText,
      poweredByUrl:           preset.poweredByUrl,
      website:                preset.website               ?? '',
      supportEmail:           preset.supportEmail          ?? '',
      supportPhone:           preset.supportPhone          ?? '',
      whatsappNumber:         preset.whatsappNumber        ?? '',
      technicalSupportNumber: preset.technicalSupportNumber ?? '',
      domains:                preset.domains               ?? [],
      enabled:                preset.enabled,
      businessCodeCustomized: true,
    })
    setFormOpen(true)
    setFeedback('')
    setSaveStatus('idle')
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingPreset(null)
    setSaveStatus('idle')
    setFeedback('')
  }

  const handleNameChange = (val: string) =>
    setForm(f => ({
      ...f,
      businessName: val,
      businessCode: f.businessCodeCustomized ? f.businessCode : suggestBrandingCode(val),
    }))

  const handleCodeChange = (val: string) =>
    setForm(f => ({
      ...f,
      businessCode:          val.toLowerCase().replace(/[^a-z0-9\-_]/g, ''),
      businessCodeCustomized: true,
    }))

  const handleSaveForm = async () => {
    if (!form.businessName.trim())  { setFeedback('Business name is required.');     setSaveStatus('error'); return }
    if (!form.businessCode.trim())  { setFeedback('Business code is required.');     setSaveStatus('error'); return }
    if (!form.poweredByText.trim()) { setFeedback('"Powered by" text is required.'); setSaveStatus('error'); return }
    if (!form.poweredByUrl.trim())  { setFeedback('"Powered by" URL is required.');  setSaveStatus('error'); return }

    setSaveStatus('saving')
    setFeedback('')
    try {
      const email = firebaseUser?.email ?? 'developer'
      const data = {
        businessName:           form.businessName.trim(),
        businessCode:           form.businessCode.trim(),
        poweredByText:          form.poweredByText.trim(),
        poweredByUrl:           form.poweredByUrl.trim(),
        website:                form.website.trim(),
        supportEmail:           form.supportEmail.trim(),
        supportPhone:           form.supportPhone.trim(),
        whatsappNumber:         form.whatsappNumber.trim(),
        technicalSupportNumber: form.technicalSupportNumber.trim(),
        domains:                form.domains,
        enabled:                form.enabled,
        createdBy:              email,
      }
      if (editingPreset) {
        await updateBrandingPreset(editingPreset.brandingId, data)
      } else {
        await createBrandingPreset(data)
      }
      setSaveStatus('saved')
      setFeedback(editingPreset ? 'Preset updated.' : 'Preset created.')
      setTimeout(closeForm, 1500)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to save.')
    }
  }

  const handleSetActive = async (brandingId: string) => {
    try {
      await setActiveBranding(brandingId, firebaseUser?.email ?? 'developer')
    } catch (err) {
      setFeedback((err as Error).message || 'Failed to set active branding.')
      setSaveStatus('error')
    }
  }

  const handleClearActive = async () => {
    try {
      await setActiveBranding(null, firebaseUser?.email ?? 'developer')
    } catch (err) {
      setFeedback((err as Error).message || 'Failed to deactivate branding.')
      setSaveStatus('error')
    }
  }

  const handleDelete = async (brandingId: string) => {
    try {
      await deleteBrandingPreset(brandingId)
      if (activeBrandingId === brandingId) {
        await setActiveBranding(null, firebaseUser?.email ?? 'developer')
      }
      setDeleteConfirmId(null)
    } catch (err) {
      setFeedback((err as Error).message || 'Failed to delete preset.')
      setSaveStatus('error')
    }
  }

  const handleRestoreDefault = async () => {
    setSaveStatus('saving')
    setFeedback('')
    try {
      await restoreDefaultBranding(firebaseUser?.email ?? 'developer')
      setSaveStatus('saved')
      setFeedback('Default branding restored and set as active.')
      setTimeout(() => { setSaveStatus('idle'); setFeedback('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to restore default branding.')
    }
  }

  const isBusy = saveStatus === 'saving'

  // Preview: show the form draft when editing, otherwise the active preset
  const previewBranding = formOpen
    ? { businessName: form.businessName || 'Business Name', poweredByText: form.poweredByText || 'powered by EV.ENGINEER', poweredByUrl: form.poweredByUrl || '#' }
    : presets.find(p => p.brandingId === activeBrandingId) ?? null

  return (
    <div className="flex flex-col gap-4">

      {/* Header preview */}
      {previewBranding && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Header Preview{formOpen ? ' (draft)' : ' (active)'}
          </p>
          <div className="flex items-center gap-2.5 px-4 py-3 bg-white border border-border rounded-xl">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <div className="flex flex-col gap-1 leading-none">
              <span className="text-sm font-bold text-text-primary">{previewBranding.businessName}</span>
              <span className="text-[10px] text-text-secondary">
                powered by{' '}
                <a href={previewBranding.poweredByUrl} target="_blank" rel="noopener noreferrer"
                  className="hover:underline hover:text-primary transition-colors">
                  {previewBranding.poweredByText.replace(/^powered by\s+/i, '') || 'EV.ENGINEER'}
                </a>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No active branding warning */}
      {!activeBrandingId && !formOpen && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          No active branding set — app headers are showing fallback name "FAI Engineer".
        </div>
      )}

      {/* Preset list */}
      {presets.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-border flex items-center justify-between">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              Branding Presets
            </p>
            <span className="text-[11px] text-text-secondary">
              {presets.length} preset{presets.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-border">
            {presets.map(preset => {
              const isActive   = preset.brandingId === activeBrandingId
              const isDeleting = deleteConfirmId   === preset.brandingId
              return (
                <div key={preset.brandingId} className="px-4 py-3">
                  {isDeleting ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
                      <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                      <p className="text-sm text-error flex-1">
                        Delete <span className="font-semibold">{preset.businessName}</span>?
                      </p>
                      <button onClick={() => setDeleteConfirmId(null)}
                        className="text-xs font-medium text-text-secondary hover:text-text-primary px-2 py-1 transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(preset.brandingId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white
                          bg-error hover:bg-error/90 px-3 py-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-3 h-3" />Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-text-primary">{preset.businessName}</span>
                          <span className="font-mono text-[10px] bg-primary-light text-primary px-1.5 py-0.5 rounded-full">
                            {preset.businessCode}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                              bg-success/10 text-success border border-success/20">
                              active
                            </span>
                          )}
                          {!preset.enabled && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                              bg-gray-100 text-text-secondary border border-border">
                              disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">{preset.poweredByText}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {!isActive ? (
                          <button onClick={() => handleSetActive(preset.brandingId)}
                            className="text-xs font-semibold text-primary border border-primary/30
                              bg-primary-light hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors">
                            Set Active
                          </button>
                        ) : (
                          <button onClick={handleClearActive}
                            className="text-xs font-medium text-text-secondary border border-border
                              hover:border-error/40 hover:text-error px-2.5 py-1.5 rounded-lg transition-colors">
                            Deactivate
                          </button>
                        )}
                        <button onClick={() => openEdit(preset)}
                          className="text-xs font-medium text-text-secondary border border-border
                            hover:text-primary hover:border-primary/30 px-2.5 py-1.5 rounded-lg transition-colors">
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirmId(preset.brandingId)}
                          className="p-1.5 text-text-secondary hover:text-error transition-colors rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {presets.length === 0 && !formOpen && (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Palette className="w-7 h-7 text-border mx-auto mb-2" />
          <p className="text-sm font-medium text-text-secondary">No branding presets</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Add a preset or restore the default iTelematics branding below.
          </p>
        </div>
      )}

      {/* Add / Edit form */}
      {formOpen && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary-light/30 flex flex-col gap-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">
            {editingPreset ? `Editing: ${editingPreset.businessName}` : 'New Branding Preset'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Business Name *</label>
              <input type="text" value={form.businessName}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="iTelematics Software Private Limited"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Business Code *</label>
              <input type="text" value={form.businessCode}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="itelematics"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">"Powered By" Text *</label>
              <input type="text" value={form.poweredByText}
                onChange={e => setForm(f => ({ ...f, poweredByText: e.target.value }))}
                placeholder="EV.ENGINEER"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">"Powered By" URL *</label>
              <input type="url" value={form.poweredByUrl}
                onChange={e => setForm(f => ({ ...f, poweredByUrl: e.target.value }))}
                placeholder="https://ev.engineer"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Website</label>
              <input type="url" value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://itelematics.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Support Email</label>
              <input type="email" value={form.supportEmail}
                onChange={e => setForm(f => ({ ...f, supportEmail: e.target.value }))}
                placeholder="info@itelematics.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Support Phone</label>
              <input type="tel" value={form.supportPhone}
                onChange={e => setForm(f => ({ ...f, supportPhone: e.target.value }))}
                placeholder="+919108206147"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">WhatsApp Number</label>
              <input type="tel" value={form.whatsappNumber}
                onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                placeholder="919108206147"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
              <p className="text-[10px] text-text-secondary mt-0.5">Digits only, no + prefix (e.g. 919108206147)</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-text-secondary mb-1 block">Technical Support Number</label>
              <input type="tel" value={form.technicalSupportNumber}
                onChange={e => setForm(f => ({ ...f, technicalSupportNumber: e.target.value }))}
                placeholder="919108206147"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
              <p className="text-[10px] text-text-secondary mt-0.5">Global tech support number — shown alongside sales contact</p>
            </div>
          </div>

          {/* Domain management */}
          <DomainManager
            domains={form.domains}
            onChange={domains => setForm(f => ({ ...f, domains }))}
          />

          <div className="flex items-center gap-2">
            <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
              {form.enabled
                ? <ToggleRight className="w-6 h-6 text-primary" />
                : <ToggleLeft  className="w-6 h-6 text-text-secondary" />}
            </button>
            <span className="text-sm text-text-secondary">{form.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>

          {feedback && saveStatus === 'error' && (
            <FeedbackBanner type="error" message={feedback} />
          )}

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <button onClick={closeForm}
              className="text-sm font-medium text-text-secondary hover:text-error transition-colors px-3 py-2">
              Cancel
            </button>
            <button onClick={handleSaveForm}
              disabled={isBusy}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold
                px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90
                transition-colors disabled:opacity-50">
              {isBusy
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />}
              {editingPreset ? 'Update' : 'Create'} Preset
            </button>
          </div>
        </div>
      )}

      {/* Feedback outside form */}
      {feedback && saveStatus !== 'error' && !formOpen && (
        <FeedbackBanner type="success" message={feedback} />
      )}

      {/* Actions footer */}
      <div className="flex items-center gap-3 pt-3 border-t border-border flex-wrap">
        <button onClick={handleRestoreDefault}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 text-sm font-medium
            text-text-secondary hover:text-error border border-border rounded-lg
            px-4 py-2 transition-colors disabled:opacity-50">
          <RefreshCw className="w-3.5 h-3.5" />
          Restore Default Branding
        </button>
        {!formOpen && (
          <button onClick={openAdd}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold
              px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Preset
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Restore Default Configs panel ───────────────────────────────────────────

const RESTORABLE_CONFIGS = [
  { path: 'appConfig/betaBanner',    description: 'Beta banner title, message, severity, and visibility' },
  { path: 'appConfig/watermark',     description: 'Watermark text, opacity, variant, and enabled flag' },
  { path: 'appConfig/activeBranding', description: 'Active branding pointer + default iTelematics preset in brandings/' },
]

function RestoreConfigsPanel({ onSuccess }: { onSuccess?: () => void }) {
  const { firebaseUser } = useAuth()
  const [status,   setStatus]   = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result,   setResult]   = useState<RestoreResult | null>(null)

  const handleRestore = async () => {
    setStatus('running')
    setResult(null)
    try {
      const r = await restoreDefaultConfigs(firebaseUser?.email ?? 'developer')
      setResult(r)
      setStatus(r.errors.length > 0 ? 'error' : 'done')
      if (r.restored.length > 0) onSuccess?.()
    } catch (err) {
      setResult({ restored: [], errors: [(err as Error).message || 'Unexpected error.'] })
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-secondary">
        Recreates missing or deleted <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">appConfig</code> documents
        using hardcoded defaults. Safe to run — existing values are overwritten only if the document is restored.
      </p>

      {/* List of what will be restored */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-border">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
            Documents that will be restored
          </p>
        </div>
        <div className="divide-y divide-border">
          {RESTORABLE_CONFIGS.map(cfg => (
            <div key={cfg.path} className="flex items-start gap-3 px-4 py-3">
              <code className="text-xs font-mono text-primary bg-primary-light px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                {cfg.path}
              </code>
              <p className="text-xs text-text-secondary">{cfg.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Result feedback */}
      {result && (
        <div className="flex flex-col gap-1.5">
          {result.restored.map(path => (
            <div key={path} className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <code className="text-xs">{path}</code>
              <span className="text-xs">restored successfully</span>
            </div>
          ))}
          {result.errors.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-error">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs">{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="flex items-center gap-3 pt-1 border-t border-border">
        <p className="text-[11px] text-text-secondary flex-1">
          Restores {RESTORABLE_CONFIGS.length} document{RESTORABLE_CONFIGS.length !== 1 ? 's' : ''} to factory defaults.
        </p>
        <button
          onClick={handleRestore}
          disabled={status === 'running'}
          className="inline-flex items-center gap-2 text-sm font-semibold
            px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg
            transition-colors disabled:opacity-50 shrink-0"
        >
          {status === 'running'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RotateCcw className="w-4 h-4" />}
          Restore Default Configs
        </button>
      </div>
    </div>
  )
}

// ─── Configurations tab ───────────────────────────────────────────────────────

function ConfigurationsTab() {
  const [bannerKey,   setBannerKey]   = useState(0)
  const [watermarkKey, setWatermarkKey] = useState(0)
  const [brandingKey,  setBrandingKey]  = useState(0)

  const bumpAll = () => {
    setBannerKey(k => k + 1)
    setWatermarkKey(k => k + 1)
    setBrandingKey(k => k + 1)
  }

  return (
    <div className="flex flex-col gap-3">
      <CollapsibleCard
        title="Banner Configuration"
        subtitle="Announcement banner shown on Dashboard, Projects, and PDF Viewer"
        icon={Bell}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        defaultOpen={false}
      >
        <BetaBannerConfig key={bannerKey} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Watermark Configuration"
        subtitle="Background watermark text shown on all authenticated pages — never in exports"
        icon={Type}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        defaultOpen={false}
      >
        <WatermarkConfigPanel key={watermarkKey} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Branding Settings"
        subtitle="Active partner branding — business name and powered-by link in all app headers"
        icon={Palette}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        defaultOpen={false}
      >
        <BrandingSettingsPanel key={brandingKey} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Feature Flags"
        subtitle="Toggle features on/off per user or organisation"
        icon={Flag}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        defaultOpen={false}
        disabled
      >
        <div />
      </CollapsibleCard>

      <CollapsibleCard
        title="Maintenance Mode"
        subtitle="Put the app into read-only maintenance state"
        icon={Wrench}
        iconBg="bg-gray-100"
        iconColor="text-text-secondary"
        defaultOpen={false}
        disabled
      >
        <div />
      </CollapsibleCard>

      <CollapsibleCard
        title="Seed Default Brandings"
        subtitle="Create or update FAI Engineer and iFab Tech branding presets with domain mappings"
        icon={Database}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        defaultOpen={false}
      >
        <SeedBrandingsPanel />
      </CollapsibleCard>

      <CollapsibleCard
        title="Restore Default Configs"
        subtitle="Recreate deleted appConfig documents from factory defaults"
        icon={RotateCcw}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        defaultOpen={false}
      >
        <RestoreConfigsPanel onSuccess={bumpAll} />
      </CollapsibleCard>
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  manager:     'Manager',
  engineer:    'Engineer',
  user:        'User (legacy)',
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  admin:       'bg-red-50 text-red-700 border-red-200',
  manager:     'bg-blue-50 text-blue-700 border-blue-100',
  engineer:    'bg-green-50 text-green-700 border-green-200',
  user:        'bg-gray-100 text-text-secondary border-border',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
      ${ROLE_BADGE[role] ?? ROLE_BADGE.user}`}>
      {ROLE_LABEL[role] ?? role}
    </span>
  )
}

// ─── User avatar ──────────────────────────────────────────────────────────────

function UserAvatar({ name, photoURL }: { name: string; photoURL?: string }) {
  const initials = name.replace(/[^a-zA-Z\s]/g, '').split(' ')
    .filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?'
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        referrerPolicy="no-referrer"
        className="w-9 h-9 rounded-full border border-border shrink-0 object-cover"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-primary select-none">{initials}</span>
    </div>
  )
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function fmtDate(val: unknown): string {
  if (!val) return '—'
  try {
    const d = typeof val === 'object' && 'toDate' in (val as object)
      ? (val as { toDate: () => Date }).toDate()
      : new Date(val as string)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function fmtRelative(val: unknown): string {
  if (!val) return '—'
  try {
    const d = typeof val === 'object' && 'toDate' in (val as object)
      ? (val as { toDate: () => Date }).toDate()
      : new Date(val as string)
    const diff = Date.now() - d.getTime()
    const mins  = Math.floor(diff / 60_000)
    if (mins < 1)    return 'just now'
    if (mins < 60)   return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs  < 24)   return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30)   return `${days}d ago`
    return fmtDate(val)
  } catch {
    return '—'
  }
}

// ─── Inline role change row ───────────────────────────────────────────────────

function RoleChangeRow({
  user: targetUser,
  callerRole,
  isBootstrap,
  callerUid,
  callerEmail,
  onDone,
}: {
  user:        UserRecord
  callerRole:  UserRole
  isBootstrap: boolean
  callerUid:   string
  callerEmail: string
  onDone:      () => void
}) {
  const allowedRoles = getAllowedTargetRoles(callerRole, isBootstrap).filter(r => r !== targetUser.role)
  const [selected, setSelected]   = useState<UserRole>(allowedRoles[0] ?? targetUser.role)
  const [confirm,  setConfirm]    = useState(false)
  const [saving,   setSaving]     = useState(false)
  const [error,    setError]      = useState('')

  const handleConfirm = async () => {
    setSaving(true)
    setError('')
    try {
      await updateUserRole({
        targetUid:      targetUser.uid,
        targetEmail:    targetUser.email,
        previousRole:   targetUser.role,
        newRole:        selected,
        changedByUid:   callerUid,
        changedByEmail: callerEmail,
      })
      onDone()
    } catch (err) {
      setError((err as Error).message || 'Failed to update role.')
      setSaving(false)
    }
  }

  if (!confirm) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value as UserRole)}
          className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-border rounded-lg
            bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          {allowedRoles.map(r => (
            <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>
          ))}
        </select>
        <button
          onClick={() => setConfirm(true)}
          className="text-xs font-semibold text-white bg-primary hover:bg-primary/90
            px-3 py-1.5 rounded-lg transition-colors"
        >
          Apply
        </button>
        <button onClick={onDone} className="text-xs text-text-secondary hover:text-error transition-colors px-2">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span className="text-xs text-text-primary">
        Change <span className="font-semibold">{targetUser.displayName || targetUser.email}</span>'s role
        from <span className="font-semibold">{ROLE_LABEL[targetUser.role]}</span>
        {' → '}<span className="font-semibold">{ROLE_LABEL[selected]}</span>?
      </span>
      {error && <span className="text-xs text-error">{error}</span>}
      <button onClick={() => setConfirm(false)} disabled={saving}
        className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 transition-colors">
        No
      </button>
      <button onClick={handleConfirm} disabled={saving}
        className="inline-flex items-center gap-1 text-xs font-semibold text-white
          bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Yes, Change
      </button>
    </div>
  )
}

// ─── Product users tab ────────────────────────────────────────────────────────

function ProductUsersTab({
  callerUid,
  callerEmail,
  callerRole,
  isBootstrap,
}: {
  callerUid:   string
  callerEmail: string
  callerRole:  UserRole
  isBootstrap: boolean
}) {
  const [users, setUsers]           = useState<UserRecord[]>([])
  const [loading, setLoading]       = useState(true)
  const [search,  setSearch]        = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortKey, setSortKey]       = useState<'name' | 'created' | 'login'>('name')
  const [editingUid, setEditingUid] = useState<string | null>(null)
  const [feedback, setFeedback]     = useState('')

  useEffect(() => {
    return subscribeUsers(received => {
      setUsers(received)
      setLoading(false)
    })
  }, [])

  // Filter + sort (client-side — list is small)
  const filtered = users
    .filter(u => {
      const q = search.toLowerCase()
      const matchSearch = !q
        || u.displayName?.toLowerCase().includes(q)
        || u.email?.toLowerCase().includes(q)
        || u.organizationName?.toLowerCase().includes(q)
        || u.organizationCode?.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      return matchSearch && matchRole
    })
    .sort((a, b) => {
      if (sortKey === 'name') {
        return (a.displayName || a.email).localeCompare(b.displayName || b.email)
      }
      const getMs = (v: unknown) => {
        if (!v) return 0
        try {
          return typeof v === 'object' && 'toDate' in (v as object)
            ? (v as { toDate: () => Date }).toDate().getTime()
            : new Date(v as string).getTime()
        } catch { return 0 }
      }
      if (sortKey === 'created') return getMs(b.createdAt) - getMs(a.createdAt)
      return getMs(b.lastLoginAt) - getMs(a.lastLoginAt)
    })

  const handleRoleDone = (msg: string) => {
    setEditingUid(null)
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 3500)
  }

  const ROLE_FILTER_OPTIONS = ['all', 'super_admin', 'admin', 'manager', 'engineer', 'user']

  return (
    <div className="flex flex-col gap-4">

      {/* Summary + controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, or organization…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-text-secondary" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 text-sm border border-border rounded-lg
              bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">All roles</option>
            {ROLE_FILTER_OPTIONS.slice(1).map(r => (
              <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as typeof sortKey)}
            className="appearance-none pl-3 pr-7 py-2 text-sm border border-border rounded-lg
              bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="name">Name A–Z</option>
            <option value="created">Newest first</option>
            <option value="login">Last login</option>
          </select>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <FeedbackBanner type="success" message={feedback} />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-14 border border-dashed border-border rounded-xl">
          <Users className="w-7 h-7 text-border mx-auto mb-2" />
          <p className="text-sm font-medium text-text-secondary">
            {search || roleFilter !== 'all' ? 'No users match your filters.' : 'No users found.'}
          </p>
        </div>
      )}

      {/* User list */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-border flex items-center justify-between">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              Users
            </p>
            <span className="text-[11px] text-text-secondary">
              {filtered.length} of {users.length}
            </span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(u => {
              const isSelf    = u.uid === callerUid
              const canEdit   = canEditUserRole(callerRole, isBootstrap, u.role, isSelf)
              const isEditing = editingUid === u.uid

              return (
                <div key={u.uid} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <UserAvatar name={u.displayName || u.email} photoURL={u.photoURL} />

                    <div className="flex-1 min-w-0">
                      {/* Name + role */}
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-text-primary">
                          {u.displayName || '(no name)'}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                            bg-amber-50 text-amber-700 border border-amber-200">
                            you
                          </span>
                        )}
                        <RoleBadge role={u.role} />
                        {!u.profileCompleted && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                            bg-gray-100 text-text-secondary border border-border">
                            incomplete profile
                          </span>
                        )}
                      </div>

                      {/* Email */}
                      <p className="text-xs text-text-secondary truncate">{u.email}</p>

                      {/* Org */}
                      {(u.organizationName || u.organizationCode) && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-text-secondary">
                            {u.organizationName || u.organizationCode}
                          </span>
                          {u.organizationCode && u.organizationName && (
                            <span className="font-mono text-[10px] bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded-full">
                              {u.organizationCode}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-text-secondary">
                          Joined: {fmtDate(u.createdAt)}
                        </span>
                        <span className="text-[11px] text-text-secondary">
                          Last login: {fmtRelative(u.lastLoginAt)}
                        </span>
                        {u.subscriptionPlan && (
                          <span className="text-[10px] font-mono bg-gray-50 text-text-secondary
                            px-1.5 py-0.5 rounded border border-border">
                            {u.subscriptionPlan}
                          </span>
                        )}
                      </div>

                      {/* Inline role change */}
                      {isEditing && (
                        <div className="mt-3 p-3 rounded-xl bg-primary-light/30 border border-primary/20">
                          <RoleChangeRow
                            user={u}
                            callerRole={callerRole}
                            isBootstrap={isBootstrap}
                            callerUid={callerUid}
                            callerEmail={callerEmail}
                            onDone={() => handleRoleDone(`Role updated for ${u.displayName || u.email}.`)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && !isEditing && (
                      <button
                        onClick={() => setEditingUid(u.uid)}
                        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium
                          text-text-secondary border border-border hover:text-primary
                          hover:border-primary/30 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        Change Role
                      </button>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => setEditingUid(null)}
                        className="shrink-0 text-xs font-medium text-text-secondary hover:text-error
                          transition-colors px-2.5 py-1.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Role capability legend */}
      <div className="p-4 rounded-xl border border-border bg-gray-50/50">
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Your Role Change Permissions
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {getAllowedTargetRoles(callerRole, isBootstrap).map(r => (
            <div key={r} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
              <span className="text-[11px] text-text-secondary">Can assign <span className="font-semibold">{ROLE_LABEL[r]}</span></span>
            </div>
          ))}
          {getAllowedTargetRoles(callerRole, isBootstrap).length === 0 && (
            <p className="text-[11px] text-text-secondary italic">No role changes allowed for your current role.</p>
          )}
        </div>
        <p className="text-[11px] text-text-secondary mt-2 pt-2 border-t border-border">
          Role changes are written atomically with an append-only audit entry. No change can be undone.
        </p>
      </div>
    </div>
  )
}

// ─── Demo data tab ────────────────────────────────────────────────────────────

const DEMO_PROJECT_LABELS = [
  { name: 'Aerospace Bracket — Aft Fuselage',  status: 'completed',   balloons: 30 },
  { name: 'Aerospace Housing — Actuator',       status: 'in-progress', balloons: 45 },
  { name: 'Mounting Plate — Avionics Bay',      status: 'review',      balloons: 25 },
  { name: 'CNC Machined Part — Valve Body',     status: 'draft',       balloons: 20 },
  { name: 'Battery Cooling Plate — EV Module',  status: 'in-progress', balloons: 40 },
  { name: 'Precision Fixture — CMM Master',     status: 'completed',   balloons: 35 },
]

function DemoDataTab({
  uid,
  productKey,
  organizationCode,
  organizationName,
}: {
  uid:              string
  productKey:       string
  organizationCode: string
  organizationName: string
}) {
  const [existingCount, setExistingCount] = useState<number | null>(null)
  const [existingNames, setExistingNames] = useState<string[]>([])
  const [seeding,       setSeeding]       = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [exporting,     setExporting]     = useState(false)
  const [progress,      setProgress]      = useState<SeedProgress | null>(null)
  const [results,       setResults]       = useState<SeedResult[]>([])
  const [error,         setError]         = useState('')
  const [feedback,      setFeedback]      = useState('')

  // Load existing demo project count on mount
  useEffect(() => {
    getDemoProjectSummary(uid).then(s => {
      setExistingCount(s.count)
      setExistingNames(s.names)
    }).catch(() => setExistingCount(0))
  }, [uid])

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 4000)
  }

  const handleCreate = async () => {
    setSeeding(true)
    setError('')
    setResults([])
    setProgress(null)
    try {
      const res = await seedDemoProjects(uid, organizationCode, organizationName, productKey, setProgress)
      setResults(res)
      setExistingCount(res.length)
      setExistingNames(res.map(r => r.projectName))
      showFeedback(`Created ${res.length} demo projects successfully.`)
    } catch (err) {
      setError((err as Error).message || 'Seeding failed.')
    } finally {
      setSeeding(false)
      setProgress(null)
    }
  }

  const handleReset = async () => {
    setDeleting(true)
    setError('')
    setResults([])
    try {
      const deleted = await deleteDemoProjects(uid)
      showFeedback(`Deleted ${deleted} demo project${deleted !== 1 ? 's' : ''}. Re-creating…`)
      setExistingCount(0)
      setExistingNames([])
    } catch (err) {
      setError((err as Error).message || 'Delete failed.')
      setDeleting(false)
      return
    }
    setDeleting(false)
    await handleCreate()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const deleted = await deleteDemoProjects(uid)
      setExistingCount(0)
      setExistingNames([])
      setResults([])
      showFeedback(`Deleted ${deleted} demo project${deleted !== 1 ? 's' : ''}.`)
    } catch (err) {
      setError((err as Error).message || 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      await exportDemoDataset(uid)
      showFeedback('Demo dataset exported as JSON.')
    } catch (err) {
      setError((err as Error).message || 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  const busy = seeding || deleting || exporting

  return (
    <div className="flex flex-col gap-5">

      {/* Warning banner */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-amber-200 bg-amber-50">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Demo data only</p>
          <p className="text-xs text-amber-700 mt-0.5">
            These projects appear in the live project list tagged as demo data. Use for testing and demonstrations only.
            All demo projects are owned by your account and can be deleted at any time.
          </p>
        </div>
      </div>

      {/* Existing demo status */}
      <div className="p-4 rounded-xl border border-border bg-gray-50/50">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-sm font-semibold text-text-primary">Current Demo Projects</p>
          {existingCount === null
            ? <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
            : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-border text-text-secondary">
                {existingCount} project{existingCount !== 1 ? 's' : ''}
              </span>
          }
        </div>
        {existingNames.length > 0 && (
          <ul className="space-y-1">
            {existingNames.map(name => (
              <li key={name} className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                {name}
              </li>
            ))}
          </ul>
        )}
        {existingCount === 0 && (
          <p className="text-xs text-text-secondary italic">No demo projects found for your account.</p>
        )}
      </div>

      {/* Feedback */}
      {feedback && <FeedbackBanner type="success" message={feedback} />}
      {error    && <FeedbackBanner type="error"   message={error}    />}

      {/* Progress */}
      {seeding && progress && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary-light/30">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-sm font-semibold text-primary">
              Seeding {progress.projectIndex + 1} / {progress.totalProjects}
            </p>
          </div>
          <p className="text-xs text-text-secondary truncate">{progress.projectName}</p>
          <p className="text-xs text-text-secondary">{progress.step}</p>
          <div className="mt-2 h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((progress.projectIndex) / progress.totalProjects) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Seed results */}
      {results.length > 0 && !seeding && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-border">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Created Projects</p>
          </div>
          <div className="divide-y divide-border">
            {results.map(r => (
              <div key={r.projectId} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{r.projectName}</p>
                  <p className="text-[10px] text-text-secondary font-mono">{r.projectId.slice(0, 12)}…</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary shrink-0">
                  <span>{r.balloonCount} balloons</span>
                  <span>·</span>
                  <span>{r.form3Count} F3</span>
                  <span>·</span>
                  <span>{r.form2Count} F2</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={busy}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-primary/30
            bg-primary-light hover:bg-primary/10 text-primary font-semibold text-sm
            transition-colors disabled:opacity-50"
        >
          {seeding
            ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            : <Play className="w-4 h-4 shrink-0" />
          }
          <div className="text-left">
            <p className="font-semibold">Create Demo Projects</p>
            <p className="text-[11px] font-normal text-primary/70">6 projects · 195 features total</p>
          </div>
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          disabled={busy || existingCount === 0}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border
            bg-white hover:bg-gray-50 text-text-primary font-semibold text-sm
            transition-colors disabled:opacity-40"
        >
          {deleting
            ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            : <RotateCw className="w-4 h-4 shrink-0" />
          }
          <div className="text-left">
            <p className="font-semibold">Reset Demo Projects</p>
            <p className="text-[11px] font-normal text-text-secondary">Delete existing + re-seed</p>
          </div>
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={busy || existingCount === 0}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border
            bg-white hover:bg-gray-50 text-text-primary font-semibold text-sm
            transition-colors disabled:opacity-40"
        >
          {exporting
            ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            : <Download className="w-4 h-4 shrink-0" />
          }
          <div className="text-left">
            <p className="font-semibold">Export Demo Dataset</p>
            <p className="text-[11px] font-normal text-text-secondary">Downloads JSON snapshot</p>
          </div>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={busy || existingCount === 0}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-200
            bg-red-50 hover:bg-red-100 text-error font-semibold text-sm
            transition-colors disabled:opacity-40"
        >
          {deleting
            ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            : <Trash2 className="w-4 h-4 shrink-0" />
          }
          <div className="text-left">
            <p className="font-semibold">Delete Demo Projects</p>
            <p className="text-[11px] font-normal text-error/70">Removes all demo data</p>
          </div>
        </button>
      </div>

      {/* What gets created */}
      <div className="p-4 rounded-xl border border-border bg-gray-50/50">
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Demo Project Catalogue
        </p>
        <div className="space-y-2">
          {DEMO_PROJECT_LABELS.map(p => (
            <div key={p.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <span className="text-xs text-text-primary truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                  p.status === 'completed'   ? 'bg-green-50 text-green-700 border-green-200' :
                  p.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-100'  :
                  p.status === 'review'      ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>{p.status}</span>
                <span className="text-[10px] text-text-secondary">{p.balloons} ft</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-text-secondary mt-3 pt-3 border-t border-border">
          Each project includes Form 1, Form 2 material rows, Form 3 inspection results, and
          balloon+feature data. Two projects are in <span className="font-semibold">completed</span> state
          and are immediately ready for FAIR Export.
        </p>
      </div>

    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DeveloperSettingsPage() {
  const { firebaseUser, user, isLoading: authLoading } = useAuth()
  const { isDeveloper, isBootstrap, isDeveloperAdmin, isLoading: devLoading } = useDeveloperAccess()
  const { productKey, organizationConfig } = useProductConfig()
  const [activeTab, setActiveTab] = useState<Tab>('developers')

  const isProductAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isLoading      = authLoading || devLoading

  // If only a product admin (not a developer), default them to the users tab
  useEffect(() => {
    if (!isLoading && !isDeveloper && isProductAdmin) {
      setActiveTab('users')
    }
  }, [isLoading, isDeveloper, isProductAdmin])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!isDeveloper && !isProductAdmin) return <AccessDenied />

  const TABS: { id: Tab; label: string; icon: typeof Code2; visible: boolean }[] = [
    { id: 'developers',     label: 'Developer Access', icon: Users,     visible: isDeveloper    },
    { id: 'configurations', label: 'Configurations',   icon: Settings2, visible: isDeveloper    },
    { id: 'users',          label: 'Product Users',    icon: UserCog,   visible: isProductAdmin },
    { id: 'demo',           label: 'Demo Data',        icon: Database,  visible: isProductAdmin || isDeveloper },
  ]
  const visibleTabs = TABS.filter(t => t.visible)

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/dashboard"
                className="text-sm text-text-secondary hover:text-primary transition-colors shrink-0"
              >
                ← Dashboard
              </Link>
              <span className="text-border">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary truncate">
                  Developer Settings
                </span>
                {isBootstrap && (
                  <span className="hidden sm:block text-[10px] font-semibold px-2 py-0.5
                    rounded-full bg-primary-light text-primary border border-primary/20 shrink-0">
                    bootstrap
                  </span>
                )}
                {!isDeveloper && isProductAdmin && (
                  <span className="hidden sm:block text-[10px] font-semibold px-2 py-0.5
                    rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    {user?.role === 'super_admin' ? 'super admin' : 'admin'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Shield className="w-4 h-4 text-text-secondary" />
              <span className="hidden sm:block text-xs text-text-secondary truncate max-w-[180px]">
                {firebaseUser?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Developer Settings</h1>
          <p className="text-sm text-text-secondary mt-1">
            {isDeveloper
              ? 'Manage developer access and application configuration.'
              : 'Manage product user roles and organization access.'}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center border-b border-border mb-6 gap-1">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold',
                'border-b-2 -mb-px transition-colors',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'developers'     && <DevelopersTab currentEmail={firebaseUser?.email ?? null} canManage={isDeveloperAdmin} />}
        {activeTab === 'configurations' && <ConfigurationsTab />}
        {activeTab === 'users'          && isProductAdmin && (
          <ProductUsersTab
            callerUid={firebaseUser?.uid ?? ''}
            callerEmail={firebaseUser?.email ?? ''}
            callerRole={user?.role ?? 'engineer'}
            isBootstrap={isBootstrap}
          />
        )}
        {activeTab === 'demo'           && (isProductAdmin || isDeveloper) && (
          <DemoDataTab
            uid={firebaseUser?.uid ?? ''}
            productKey={productKey}
            organizationCode={organizationConfig.organizationCode}
            organizationName={organizationConfig.organizationName}
          />
        )}

      </main>
    </div>
  )
}
