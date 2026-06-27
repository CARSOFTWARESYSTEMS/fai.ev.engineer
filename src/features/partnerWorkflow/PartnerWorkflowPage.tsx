import { useEffect, useState } from 'react'
import {
  Plus, Eye, ShieldAlert, Trash2, ChevronLeft, Loader2,
  Globe, Shield, Users2, Building2, CreditCard, Package,
  CheckCircle2,
} from 'lucide-react'
import {
  subscribePartners,
  subscribeBlockedPartners,
  subscribeDeletedPartners,
  createPartner,
  getReadablePartnerError,
  isValidPartnerDomain,
  type Partner,
} from '../../services/partnerService'
import { subscribePartnerOrganisations, type Organisation } from '../../services/organisationService'
import { subscribePartnerAdmins, useCurrentPartner } from '../../services/partnerAccessService'
import { useDeveloperAccess } from '../../services/useDeveloperAccess'
import { useAuth } from '../../auth/hooks/useAuth'
import { FeedbackBanner } from './shared'
import { PartnerBrandingSection }       from './sections/PartnerBrandingSection'
import { PartnerAdminUsersSection }     from './sections/PartnerAdminUsersSection'
import { PartnerOrganisationsSection }  from './sections/PartnerOrganisationsSection'
import { PartnerSubscriptionSection }   from './sections/PartnerSubscriptionSection'
import { PartnerEntitlementsSection }   from './sections/PartnerEntitlementsSection'


type Level    = 'landing' | 'list' | 'selected'
type ListMode = 'active'  | 'blocked' | 'deleted'
type Section  = 'branding' | 'admins' | 'orgs' | 'subscription' | 'entitlements'



// ─── Partner Card (Level 2) ───────────────────────────────────────────────────

function PartnerCard({ partner, onOpen }: { partner: Partner; onOpen: (p: Partner) => void }) {
  const [orgCount,   setOrgCount]   = useState<number | null>(null)
  const [adminCount, setAdminCount] = useState<number | null>(null)

  useEffect(() => subscribePartnerOrganisations(partner.partnerId, (orgs: Organisation[]) => setOrgCount(orgs.length)), [partner.partnerId])
  useEffect(() => subscribePartnerAdmins(partner.partnerId, admins => setAdminCount(admins.length)), [partner.partnerId])

  const statusColor =
    partner.lifecycleStatus === 'active'    ? 'bg-success/10 text-success border-success/20' :
    partner.lifecycleStatus === 'blocked'   ? 'bg-amber-50 text-amber-700 border-amber-200'  :
    partner.lifecycleStatus === 'deleted'   ? 'bg-red-50 text-error border-red-200'          :
    partner.lifecycleStatus === 'inactive'  ? 'bg-gray-100 text-text-secondary border-border':
                                              'bg-gray-100 text-text-secondary border-border'

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-text-primary truncate">{partner.name}</h3>
          <p className="text-[11px] font-mono text-text-secondary mt-0.5">{partner.code}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 capitalize ${statusColor}`}>
          {partner.lifecycleStatus}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span className="font-mono truncate">{partner.primaryDomain || '—'}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Orgs',     value: orgCount   ?? '…' },
          { label: 'Admins',   value: adminCount ?? '…' },
          { label: 'Products', value: partner.enabledProducts.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl py-2">
            <p className="text-sm font-bold text-text-primary tabular-nums">{value}</p>
            <p className="text-[10px] text-text-secondary">{label}</p>
          </div>
        ))}
      </div>

      <button onClick={() => onOpen(partner)}
        className="w-full text-sm font-semibold text-white bg-primary hover:bg-primary/90
          py-2 rounded-xl transition-colors">
        Open Partner →
      </button>
    </div>
  )
}

// ─── Level 3: Workflow sections for selected partner ──────────────────────────

const SECTIONS: { id: Section; label: string; iconBg: string; iconColor: string; icon: typeof Globe }[] = [
  { id: 'branding',      label: 'Branding',             iconBg: 'bg-primary-light', iconColor: 'text-primary',       icon: Globe    },
  { id: 'admins',        label: 'Admin Users',          iconBg: 'bg-purple-50',     iconColor: 'text-purple-600',    icon: Users2   },
  { id: 'orgs',          label: 'Organisations',        iconBg: 'bg-success/10',    iconColor: 'text-success',       icon: Building2 },
  { id: 'subscription',  label: 'Subscription',         iconBg: 'bg-orange-50',     iconColor: 'text-orange-600',    icon: CreditCard },
  { id: 'entitlements',  label: 'Product Entitlements', iconBg: 'bg-indigo-50',     iconColor: 'text-indigo-600',    icon: Package  },
]

interface WorkflowProps {
  partner:          Partner
  isDeveloperAdmin: boolean
  callerUid:        string
  callerEmail:      string
}

function PartnerWorkflow({ partner, isDeveloperAdmin, callerUid, callerEmail }: WorkflowProps) {
  const [section, setSection] = useState<Section>('branding')

  return (
    <div className="flex flex-col gap-5">
      {/* Section picker */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(s => {
            const Icon = s.icon
            const active = section === s.id
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={[
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all',
                  active
                    ? `${s.iconBg} ${s.iconColor} border-current/30`
                    : 'text-text-secondary border-border hover:border-primary/30 hover:text-primary',
                ].join(' ')}>
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active section */}
      {section === 'branding' && (
        <PartnerBrandingSection partner={partner} isDeveloperAdmin={isDeveloperAdmin} callerEmail={callerEmail} />
      )}
      {section === 'admins' && (
        <PartnerAdminUsersSection partnerId={partner.partnerId} callerUid={callerUid} callerEmail={callerEmail} isDeveloperAdmin={isDeveloperAdmin} />
      )}
      {section === 'orgs' && (
        <PartnerOrganisationsSection partnerId={partner.partnerId} partnerName={partner.name} callerUid={callerUid} callerEmail={callerEmail} />
      )}
      {section === 'subscription' && (
        <PartnerSubscriptionSection partnerId={partner.partnerId} partnerName={partner.name} />
      )}
      {section === 'entitlements' && (
        <PartnerEntitlementsSection partner={partner} isDeveloperAdmin={isDeveloperAdmin} />
      )}
    </div>
  )
}

// ─── Create Partner Form ──────────────────────────────────────────────────────

interface CreateFormProps {
  callerUid:   string
  callerEmail: string
  onCreated:   (partner: Partner) => void
  onCancel:    () => void
}

function CreatePartnerForm({ callerUid, onCreated, onCancel }: CreateFormProps) {
  const [name,      setName]      = useState('')
  const [code,      setCode]      = useState('')
  const [domain,    setDomain]    = useState('')
  const [support,   setSupport]   = useState('')
  const [creating,  setCreating]  = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!name) return
    const derived = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10)
    setCode(derived)
  }, [name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim())    { setError('Name is required.'); return }
    if (!code.trim())    { setError('Code is required.'); return }
    if (!domain.trim())  { setError('Primary domain is required.'); return }
    if (!isValidPartnerDomain(domain.trim())) { setError('Invalid domain format (hostname only, no https://).'); return }
    setCreating(true)
    try {
      const id = await createPartner({
        name:            name.trim(),
        code:            code.trim().toLowerCase(),
        primaryDomain:   domain.trim().toLowerCase(),
        domains:         [domain.trim().toLowerCase()],
        supportEmail:    support.trim() || undefined,
        enabled:         true,
        lifecycleStatus: 'active',
        enabledProducts: [],
        createdBy:       callerUid,
      })
      // Build a minimal partner to pass back (real data arrives via subscription)
      const created: Partner = {
        partnerId:       id,
        name:            name.trim(),
        code:            code.trim().toLowerCase(),
        primaryDomain:   domain.trim().toLowerCase(),
        domains:         [domain.trim().toLowerCase()],
        supportEmail:    support.trim() || undefined,
        enabled:         true,
        lifecycleStatus: 'active',
        enabledProducts: [],
        createdAt:       null,
        updatedAt:       null,
        createdBy:       callerUid,
      }
      onCreated(created)
    } catch (err) {
      setError(`Failed to create: ${getReadablePartnerError(err)}`)
    } finally { setCreating(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4 max-w-lg">
      <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">New Partner</p>

      {error && <FeedbackBanner type="error" message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-text-secondary block mb-1">Name <span className="text-error">*</span></label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Acme Aviation"
            className="w-full px-3 py-2 rounded-xl border border-border text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Code <span className="text-error">*</span></label>
          <input required value={code} onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
            placeholder="acmeaviation" maxLength={20}
            className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Primary Domain <span className="text-error">*</span></label>
          <input required value={domain} onChange={e => setDomain(e.target.value.toLowerCase().replace(/\s/g, ''))}
            placeholder="fai.acme.com"
            className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-text-secondary block mb-1">Support Email</label>
          <input type="email" value={support} onChange={e => setSupport(e.target.value)} placeholder="support@acme.com"
            className="w-full px-3 py-2 rounded-xl border border-border text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="text-sm text-text-secondary hover:text-text-primary px-4 py-2 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={creating}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5
            bg-success text-white rounded-xl hover:bg-success/90 transition-colors disabled:opacity-50">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Create Partner
        </button>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  mode: 'developer' | 'partner'
}

export function PartnerWorkflowPage({ mode }: Props) {
  const { firebaseUser } = useAuth()
  const { isDeveloperAdmin } = useDeveloperAccess()
  const { partner: myPartner, partners: myPartners, isLoading: partnerLoading } = useCurrentPartner()

  const [level,           setLevel]           = useState<Level>(mode === 'developer' ? 'landing' : 'selected')
  const [listMode,        setListMode]        = useState<ListMode>('active')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [feedback,        setFeedback]        = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showCreate,      setShowCreate]      = useState(false)

  // Partner lists (developer mode)
  const [activePartners,  setActivePartners]  = useState<Partner[]>([])
  const [blockedPartners, setBlockedPartners] = useState<Partner[]>([])
  const [deletedPartners, setDeletedPartners] = useState<Partner[]>([])

  // In developer mode, subscribe to all partner lists
  useEffect(() => {
    if (mode !== 'developer') return
    const u1 = subscribePartners(setActivePartners)
    const u2 = subscribeBlockedPartners(setBlockedPartners)
    const u3 = subscribeDeletedPartners(setDeletedPartners)
    return () => { u1(); u2(); u3() }
  }, [mode])

  // A single mapping opens directly. Multiple mappings land on a chooser so
  // every partner associated with the admin account is visible on /partner.
  useEffect(() => {
    if (mode !== 'partner' || partnerLoading) return
    if (myPartners.length <= 1) {
      setSelectedPartner(myPartner)
      setLevel('selected')
      return
    }

    if (!selectedPartner) {
      setLevel('list')
      return
    }

    const refreshedSelection = myPartners.find(p => p.partnerId === selectedPartner.partnerId)
    if (refreshedSelection) {
      setSelectedPartner(refreshedSelection)
    } else {
      setSelectedPartner(null)
      setLevel('list')
    }
  }, [mode, myPartner, myPartners, partnerLoading, selectedPartner])

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  function openPartner(p: Partner) {
    setSelectedPartner(p)
    setLevel('selected')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToList(mode: ListMode) {
    setListMode(mode)
    setLevel('list')
    setShowCreate(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToLanding() {
    setLevel('landing')
    setSelectedPartner(null)
    setShowCreate(false)
  }

  function goToMappedPartners() {
    setSelectedPartner(null)
    setLevel('list')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const callerUid   = firebaseUser?.uid   ?? ''
  const callerEmail = firebaseUser?.email ?? ''

  const listPartners =
    listMode === 'active'  ? activePartners  :
    listMode === 'blocked' ? blockedPartners :
                             deletedPartners

  // ── Partner mode: loading ─────────────────────────────────────────────────

  if (mode === 'partner' && partnerLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (mode === 'partner' && myPartners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <Shield className="w-10 h-10 text-text-secondary" />
        <p className="text-sm font-semibold text-text-primary">No partner found</p>
        <p className="text-xs text-text-secondary">Your account is not associated with any partner.</p>
      </div>
    )
  }

  if (mode === 'partner' && myPartners.length > 1 && !selectedPartner) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Your Partners</h1>
          <p className="text-sm text-text-secondary mt-1">
            {myPartners.length} partners are mapped to {callerEmail || 'your account'}. Select one to manage its configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myPartners.map(p => (
            <PartnerCard key={p.partnerId} partner={p} onOpen={openPartner} />
          ))}
        </div>
      </div>
    )
  }

  // ── Level 3: Selected partner ─────────────────────────────────────────────

  if (level === 'selected' && selectedPartner) {
    return (
      <div className="flex flex-col gap-5">
        {feedback && <FeedbackBanner type={feedback.type} message={feedback.msg} />}

        {/* Partner header */}
        <div className="card p-5">
          <div className="flex items-start gap-4">
            {(mode === 'developer' || myPartners.length > 1) && (
              <button onClick={mode === 'developer' ? goToLanding : goToMappedPartners}
                aria-label={mode === 'developer' ? 'Back to partners' : 'Back to mapped partners'}
                className="mt-0.5 text-text-secondary hover:text-text-primary transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-lg font-bold text-text-primary">{selectedPartner.name}</h1>
                <span className="text-xs font-mono text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20">
                  {selectedPartner.code}
                </span>
                <span className={[
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize',
                  selectedPartner.lifecycleStatus === 'active'  ? 'bg-success/10 text-success border-success/20' :
                  selectedPartner.lifecycleStatus === 'blocked' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  selectedPartner.lifecycleStatus === 'deleted' ? 'bg-red-50 text-error border-red-200'         :
                  'bg-gray-100 text-text-secondary border-border',
                ].join(' ')}>
                  {selectedPartner.lifecycleStatus}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">{selectedPartner.primaryDomain || '—'}</span>
                {selectedPartner.domains.length > 1 && (
                  <span className="text-text-secondary">+{selectedPartner.domains.length - 1} more</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workflow sections */}
        <PartnerWorkflow
          partner={selectedPartner}
          isDeveloperAdmin={isDeveloperAdmin}
          callerUid={callerUid}
          callerEmail={callerEmail}
        />
      </div>
    )
  }

  // ── Level 2: Partner list ─────────────────────────────────────────────────

  if (level === 'list') {
    const listTitle =
      listMode === 'active'  ? 'Active Partners'  :
      listMode === 'blocked' ? 'Blocked Partners' : 'Deleted Partners'

    const listEmpty =
      listMode === 'active'  ? 'No active partners yet.' :
      listMode === 'blocked' ? 'No blocked partners.'    : 'No deleted partners.'

    return (
      <div className="flex flex-col gap-5">
        {feedback && <FeedbackBanner type={feedback.type} message={feedback.msg} />}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button onClick={goToLanding}
            className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary
              hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Partners
          </button>
          <span className="text-text-secondary">/</span>
          <span className="text-sm font-semibold text-text-primary">{listTitle}</span>
        </div>

        {/* List subtype pills */}
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'active'  as ListMode, label: `Active (${activePartners.length})`,   color: 'text-success'      },
            { id: 'blocked' as ListMode, label: `Blocked (${blockedPartners.length})`,  color: 'text-amber-700'   },
            { id: 'deleted' as ListMode, label: `Deleted (${deletedPartners.length})`,  color: 'text-error'       },
          ]).map(({ id, label, color }) => (
            <button key={id} onClick={() => setListMode(id)}
              className={[
                'text-sm font-semibold px-3 py-1.5 rounded-xl border transition-all',
                listMode === id
                  ? `${color} bg-gray-50 border-current/30`
                  : 'text-text-secondary border-border hover:border-primary/30',
              ].join(' ')}>
              {label}
            </button>
          ))}
        </div>

        {listPartners.length === 0
          ? <p className="text-sm text-text-secondary italic py-4">{listEmpty}</p>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listPartners.map(p => (
                <PartnerCard key={p.partnerId} partner={p} onOpen={openPartner} />
              ))}
            </div>
          )
        }
      </div>
    )
  }

  // ── Level 1: Landing (developer only) ─────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {feedback && <FeedbackBanner type={feedback.type} message={feedback.msg} />}

      {/* CTA cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Create */}
        <button onClick={() => setShowCreate(true)}
          className="card p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left
            border-success/20 hover:border-success/40 group">
          <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center
            group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-bold text-text-primary">Create Partner</p>
            <p className="text-xs text-text-secondary mt-0.5">Register a new partner organisation</p>
          </div>
          <span className="text-xs font-semibold text-success">Create →</span>
        </button>

        {/* View Active */}
        <button onClick={() => goToList('active')}
          className="card p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left
            border-primary/20 hover:border-primary/40 group">
          <div className="w-10 h-10 rounded-2xl bg-primary-light flex items-center justify-center
            group-hover:scale-110 transition-transform">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-text-primary">View Partners</p>
            <p className="text-xs text-text-secondary mt-0.5">{activePartners.length} active partner{activePartners.length !== 1 ? 's' : ''}</p>
          </div>
          <span className="text-xs font-semibold text-primary">View →</span>
        </button>

        {/* Blocked */}
        <button onClick={() => goToList('blocked')}
          className="card p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left
            border-amber-200 hover:border-amber-400 group">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center
            group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-text-primary">Blocked Partners</p>
            <p className="text-xs text-text-secondary mt-0.5">{blockedPartners.length} blocked</p>
          </div>
          <span className="text-xs font-semibold text-amber-600">Review →</span>
        </button>

        {/* Deleted */}
        <button onClick={() => goToList('deleted')}
          className="card p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left
            border-red-200 hover:border-red-300 group">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center
            group-hover:scale-110 transition-transform">
            <Trash2 className="w-5 h-5 text-error" />
          </div>
          <div>
            <p className="font-bold text-text-primary">Deleted Partners</p>
            <p className="text-xs text-text-secondary mt-0.5">{deletedPartners.length} deleted</p>
          </div>
          <span className="text-xs font-semibold text-error">View →</span>
        </button>
      </div>

      {/* Create form (inline) */}
      {showCreate && (
        <CreatePartnerForm
          callerUid={callerUid}
          callerEmail={callerEmail}
          onCreated={p => {
            showFeedback('success', `Partner "${p.name}" created successfully.`)
            setShowCreate(false)
            openPartner(p)
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Recent active partners preview */}
      {!showCreate && activePartners.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Recent Partners</p>
            <button onClick={() => goToList('active')} className="text-xs font-medium text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePartners.slice(0, 3).map(p => (
              <PartnerCard key={p.partnerId} partner={p} onOpen={openPartner} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
