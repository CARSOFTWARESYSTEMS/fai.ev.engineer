import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Code2, Users, Settings2, Shield, Plus, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle2, Loader2, Lock, RefreshCw, Save,
  Bell, Flag, Wrench, ChevronDown, Trash2, Info, RotateCcw,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { BOOTSTRAP_DEVELOPER_EMAILS } from '../config/developerBootstrap'
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'developers' | 'configurations'

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
  onToggle,
  onRoleChange,
  onDelete,
  actionError,
}: {
  dev: DeveloperRecord
  currentEmail: string | null
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
      {deleteConfirm ? (
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

          {/* Toggle */}
          <button
            onClick={() => onToggle(dev)}
            title={dev.enabled ? 'Disable access' : 'Enable access'}
            className="text-text-secondary hover:text-primary transition-colors shrink-0"
          >
            {dev.enabled
              ? <ToggleRight className="w-6 h-6 text-primary" />
              : <ToggleLeft  className="w-6 h-6" />}
          </button>

          {/* Delete */}
          <button
            onClick={() => setDeleteConfirm(true)}
            title="Delete developer"
            disabled={isSelf}
            className="text-text-secondary hover:text-error transition-colors shrink-0
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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

// ─── Restore Default Configs panel ───────────────────────────────────────────

const RESTORABLE_CONFIGS = [
  { path: 'appConfig/betaBanner', description: 'Beta banner title, message, severity, and visibility' },
]

function RestoreConfigsPanel({ onSuccess }: { onSuccess?: () => void }) {
  const [status,   setStatus]   = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result,   setResult]   = useState<RestoreResult | null>(null)

  const handleRestore = async () => {
    setStatus('running')
    setResult(null)
    try {
      const r = await restoreDefaultConfigs()
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
  const [bannerKey, setBannerKey] = useState(0)

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
        title="Restore Default Configs"
        subtitle="Recreate deleted appConfig documents from factory defaults"
        icon={RotateCcw}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        defaultOpen={false}
      >
        <RestoreConfigsPanel onSuccess={() => setBannerKey(k => k + 1)} />
      </CollapsibleCard>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DeveloperSettingsPage() {
  const { firebaseUser } = useAuth()
  const { isDeveloper, isBootstrap, isDeveloperAdmin, isLoading } = useDeveloperAccess()
  const [activeTab, setActiveTab] = useState<Tab>('developers')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!isDeveloper) return <AccessDenied />

  const TABS: { id: Tab; label: string; icon: typeof Code2 }[] = [
    { id: 'developers',     label: 'User Management', icon: Users     },
    { id: 'configurations', label: 'Configurations', icon: Settings2 },
  ]

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
            Manage developer access and application configuration.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center border-b border-border mb-6 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
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

      </main>
    </div>
  )
}
