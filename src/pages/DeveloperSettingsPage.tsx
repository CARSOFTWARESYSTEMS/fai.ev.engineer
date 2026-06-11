import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Code2, Users, Settings2, Shield, Plus, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle2, Loader2, Lock, RefreshCw, Save,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { BOOTSTRAP_DEVELOPER_EMAILS } from '../config/developerBootstrap'
import {
  subscribeToDevelopers,
  addDeveloper,
  toggleDeveloper,
  type DeveloperRecord,
  type DeveloperRole,
} from '../services/developerConfigService'
import {
  getBetaNotice,
  saveBetaNotice,
  BETA_NOTICE_DEFAULTS,
  type BetaNoticeConfig,
  type BetaNoticeSeverity,
} from '../services/betaNoticeService'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'developers' | 'configurations'

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
      <Lock className="w-10 h-10 text-text-secondary" />
      <h1 className="text-xl font-bold text-text-primary">Access Denied</h1>
      <p className="text-sm text-text-secondary text-center max-w-sm">
        Developer Settings is restricted to authorised developers only.
      </p>
      <Link to="/dashboard"
        className="btn-primary text-sm mt-2">← Back to Dashboard</Link>
    </div>
  )
}

// ─── Inline feedback banner ───────────────────────────────────────────────────

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

// ─── Developers tab ───────────────────────────────────────────────────────────

function DevelopersTab({ currentEmail }: { currentEmail: string | null }) {
  const [firestoreDevs, setFirestoreDevs] = useState<DeveloperRecord[]>([])
  const [loadError,     setLoadError]     = useState(false)

  const [addEmail,       setAddEmail]       = useState('')
  const [addDisplayName, setAddDisplayName] = useState('')
  const [addRole,        setAddRole]        = useState<DeveloperRole>('developer')
  const [addFormOpen,    setAddFormOpen]    = useState(false)
  const [addStatus,      setAddStatus]      = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [addError,       setAddError]       = useState('')

  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    return subscribeToDevelopers(devs => {
      setFirestoreDevs(devs)
      setLoadError(false)
    })
  }, [])

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
    const isDisablingSelf = dev.email === currentEmail
    const enabledFirestoreCount = firestoreDevs.filter(d => d.enabled).length
    if (isDisablingSelf && enabledFirestoreCount <= 1) {
      setToggleErrors(prev => ({
        ...prev,
        [dev.email]: 'Cannot disable yourself — you are the only active developer.',
      }))
      return
    }
    setToggleErrors(prev => ({ ...prev, [dev.email]: '' }))
    try {
      await toggleDeveloper(dev.email, !dev.enabled)
    } catch (err) {
      setToggleErrors(prev => ({
        ...prev,
        [dev.email]: (err as Error).message || 'Update failed.',
      }))
    }
  }

  // Firestore devs that aren't bootstrap (avoid duplicate rows)
  const nonBootstrapDevs = firestoreDevs.filter(
    d => !(BOOTSTRAP_DEVELOPER_EMAILS as string[]).includes(d.email),
  )

  return (
    <div className="flex flex-col gap-5">

      {/* Bootstrap developers — always active */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-text-primary">Bootstrap Developers</h2>
          <span className="text-xs text-text-secondary ml-1">Hardcoded · Always active</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {BOOTSTRAP_DEVELOPER_EMAILS.map(email => (
            <div key={email} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{email}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                bg-primary-light text-primary border border-primary/20 shrink-0">
                bootstrap
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                bg-success/10 text-success border border-success/20 shrink-0">
                active
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Managed developers (Firestore) */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-text-primary">Managed Developers</h2>
            {firestoreDevs.length > 0 && (
              <span className="text-xs font-semibold bg-primary-light text-primary
                px-2 py-0.5 rounded-full">{firestoreDevs.length}</span>
            )}
          </div>
          <button
            onClick={() => setAddFormOpen(o => !o)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold
              px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90
              transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Developer
          </button>
        </div>

        {addStatus === 'done' && (
          <div className="mb-4">
            <FeedbackBanner type="success" message="Developer added successfully." />
          </div>
        )}

        {loadError && (
          <div className="mb-4">
            <FeedbackBanner type="error" message="Could not load developer list. Check Firestore rules." />
          </div>
        )}

        {/* Add developer form */}
        {addFormOpen && (
          <div className="mb-4 p-4 rounded-xl border border-border bg-gray-50 flex flex-col gap-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Add Developer
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Email *
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Display Name
                </label>
                <input
                  type="text"
                  value={addDisplayName}
                  onChange={e => setAddDisplayName(e.target.value)}
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
                  className="text-sm font-medium text-text-secondary hover:text-error
                    transition-colors px-3 py-2"
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
                  Add Developer
                </button>
              </div>
            </div>
            {addError && (
              <p className="text-xs text-error">{addError}</p>
            )}
          </div>
        )}

        {/* Developer list */}
        {nonBootstrapDevs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <Users className="w-7 h-7 text-border mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              No managed developers yet. Add one above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {nonBootstrapDevs.map(dev => (
              <div key={dev.email} className="py-3">
                <div className="flex items-start gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {dev.displayName || dev.email}
                      </p>
                      {dev.displayName && (
                        <span className="text-xs text-text-secondary truncate">
                          {dev.email}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                        ${dev.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-50 text-blue-700'}`}>
                        {dev.role}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Added by {dev.addedBy}
                      {dev.addedAt && ` · ${new Date((dev.addedAt as unknown as { seconds: number }).seconds * 1000).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0
                    ${dev.enabled
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-gray-100 text-text-secondary border border-border'}`}>
                    {dev.enabled ? 'enabled' : 'disabled'}
                  </span>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(dev)}
                    title={dev.enabled ? 'Disable developer' : 'Enable developer'}
                    className="text-text-secondary hover:text-primary transition-colors shrink-0"
                  >
                    {dev.enabled
                      ? <ToggleRight className="w-6 h-6 text-primary" />
                      : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>

                {toggleErrors[dev.email] && (
                  <p className="text-xs text-error mt-1">{toggleErrors[dev.email]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Configurations tab ───────────────────────────────────────────────────────

function ConfigurationsTab() {
  const [form, setForm]           = useState<BetaNoticeConfig>(BETA_NOTICE_DEFAULTS)
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [feedback, setFeedback]   = useState('')

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
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-text-primary">Beta Banner Configuration</h2>
          </div>
          <button
            onClick={loadConfig}
            disabled={isBusy}
            title="Reload current Firestore values"
            className="inline-flex items-center gap-1.5 text-xs font-medium
              text-text-secondary hover:text-primary border border-border rounded-lg
              px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadStatus === 'loading' ? 'animate-spin' : ''}`} />
            Load Current Config
          </button>
        </div>

        <div className="flex flex-col gap-4">

          {/* Enabled toggle */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Banner Enabled</p>
              <p className="text-xs text-text-secondary">Show the beta banner across all pages</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
              className="transition-colors"
            >
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

          {/* Severity + Dismissible — side by side */}
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
                <button
                  onClick={() => setForm(f => ({ ...f, dismissible: !f.dismissible }))}
                  className="transition-colors"
                >
                  {form.dismissible
                    ? <ToggleRight className="w-7 h-7 text-primary" />
                    : <ToggleLeft  className="w-7 h-7 text-text-secondary" />}
                </button>
                <span className="text-sm text-text-secondary">
                  {form.dismissible ? 'Users can dismiss' : 'Permanent (no X button)'}
                </span>
              </div>
            </div>
          </div>

          {/* Live preview */}
          {form.enabled && (
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Preview (light)
              </p>
              <div className={`rounded-xl border px-4 py-2.5 flex items-start gap-2.5
                ${form.severity === 'error'   ? 'bg-red-50 border-red-200' :
                  form.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                                                'bg-blue-50 border-blue-200'}`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5
                  ${form.severity === 'error'   ? 'text-red-600' :
                    form.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                <p className={`text-xs font-medium leading-relaxed flex-1
                  ${form.severity === 'error'   ? 'text-red-700' :
                    form.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>
                  <span className="font-bold">{form.title}:</span>{' '}{form.message}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Feedback */}
        {feedback && (
          <div className="mt-4">
            <FeedbackBanner
              type={saveStatus === 'error' || loadStatus === 'error' ? 'error' : 'success'}
              message={feedback}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border flex-wrap">
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
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DeveloperSettingsPage() {
  const { firebaseUser } = useAuth()
  const { isDeveloper, isBootstrap, isLoading } = useDeveloperAccess()
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
    { id: 'developers',     label: 'Developers',     icon: Users     },
    { id: 'configurations', label: 'Configurations', icon: Settings2 },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard"
                className="text-sm text-text-secondary hover:text-primary transition-colors shrink-0">
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
        {activeTab === 'developers'     && <DevelopersTab currentEmail={firebaseUser?.email ?? null} />}
        {activeTab === 'configurations' && <ConfigurationsTab />}

      </main>
    </div>
  )
}
