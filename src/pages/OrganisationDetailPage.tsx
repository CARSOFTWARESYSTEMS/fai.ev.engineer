import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Building2, ArrowLeft, Users, Package, CreditCard, AlertTriangle,
  Loader2, Plus, UserPlus, CheckCircle2,
} from 'lucide-react'
import {
  subscribeOrganisation,
  subscribeOrganisationMembers,
  addOrganisationMember,
  removeOrganisationMember,
  getOrganisationStatus,
  formatOrgExpiry,
  type Organisation,
  type OrganisationMember,
  type OrgStatus,
} from '../services/organisationService'
import { subscribePartnerById, type Partner } from '../services/partnerService'
import { listUsers } from '../services/roleManagementService'
import { useAuth } from '../auth/hooks/useAuth'
import type { OrganisationRole } from '../auth/AuthTypes'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'overview' | 'members' | 'subscription' | 'products'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TABS: { id: Section; label: string; icon: typeof Building2 }[] = [
  { id: 'overview',      label: 'Overview',      icon: Building2  },
  { id: 'members',       label: 'Members',        icon: Users      },
  { id: 'subscription',  label: 'Subscription',   icon: CreditCard },
  { id: 'products',      label: 'Products',       icon: Package    },
]

const ORG_ROLES: OrganisationRole[] = [
  'owner', 'manager', 'engineer', 'inspector', 'auditor', 'approver', 'viewer',
]

const ROLE_LABELS: Record<OrganisationRole, string> = {
  owner:     'Owner',
  manager:   'Manager',
  engineer:  'Engineer',
  inspector: 'Inspector',
  auditor:   'Auditor',
  approver:  'Approver',
  viewer:    'Viewer',
}

const STATUS_STYLES: Record<OrgStatus, string> = {
  active:    'bg-success/10 text-success border-success/20',
  trial:     'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-red-50 text-error border-red-200',
  inactive:  'bg-gray-100 text-text-secondary border-border',
}

const STATUS_LABELS: Record<OrgStatus, string> = {
  active:    'Active',
  trial:     'Trial',
  suspended: 'Suspended',
  inactive:  'Inactive',
}

const PRODUCT_NAMES: Record<string, string> = {
  fai_reports: 'Balloon Drawings + AS9102 FAI Reports',
  battery_pm:  'Battery Predictive Maintenance',
  motor_pm:    'Motor Predictive Maintenance',
  energy_mgmt: 'Energy Management',
  clean_room:  'Clean Room Solutions',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-text-secondary w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-text-primary">{value ?? '—'}</span>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ─── Overview section ─────────────────────────────────────────────────────────

function OverviewSection({ org, partner }: { org: Organisation; partner: Partner | null }) {
  const status = getOrganisationStatus(org)
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Overview">
        <InfoRow label="Name"           value={org.name} />
        <InfoRow label="Code"           value={<span className="font-mono text-xs">{org.code}</span>} />
        <InfoRow label="Status"         value={
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        } />
        <InfoRow label="Partner"        value={partner?.name ?? org.partnerId} />
        <InfoRow label="Owner Email"    value={org.ownerEmail} />
        <InfoRow label="Owner UID"      value={org.ownerUid ? <span className="font-mono text-xs">{org.ownerUid}</span> : '—'} />
        <InfoRow label="Created"        value={org.createdAt
          ? new Date(org.createdAt.seconds * 1000).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
          : '—'} />
      </SectionCard>

      <SectionCard title="Seat Limits">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { role: 'manager',   limit: org.managerLimit   },
            { role: 'engineer',  limit: org.engineerLimit  },
            { role: 'inspector', limit: org.inspectorLimit },
            { role: 'auditor',   limit: org.auditorLimit   },
            { role: 'approver',  limit: org.approverLimit  },
            { role: 'viewer',    limit: org.viewerLimit    },
          ].map(({ role, limit }) => (
            <div key={role} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-border">
              <span className="text-xs font-medium text-text-secondary capitalize">{role}</span>
              <span className="text-sm font-bold text-text-primary">{limit}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Members section ──────────────────────────────────────────────────────────

function MembersSection({
  org,
  members,
  callerUid,
}: {
  org: Organisation
  members: OrganisationMember[]
  callerUid: string
}) {
  const activeMembers = members.filter(m => m.active)
  const [addOpen,   setAddOpen]   = useState(false)
  const [addEmail,  setAddEmail]  = useState('')
  const [addRole,   setAddRole]   = useState<OrganisationRole>('engineer')
  const [searching, setSearching] = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [foundUser, setFoundUser] = useState<{ uid: string; email: string; displayName: string } | null>(null)
  const [feedback,  setFeedback]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function handleSearch() {
    if (!addEmail.trim()) return
    setSearching(true)
    try {
      const all = await listUsers()
      const q   = addEmail.toLowerCase()
      const match = all.find(u =>
        u.email?.toLowerCase() === q || u.email?.toLowerCase().includes(q),
      )
      setFoundUser(match ? { uid: match.uid, email: match.email, displayName: match.displayName } : null)
      if (!match) showFeedback('error', 'User not found. Email will be stored as pending.')
    } catch {
      showFeedback('error', 'Failed to search users.')
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    setAdding(true)
    try {
      await addOrganisationMember({
        organisationId: org.organisationId,
        userUid:        foundUser?.uid ?? '',
        userEmail:      addEmail.trim().toLowerCase(),
        role:           addRole,
        createdBy:      callerUid,
      })
      showFeedback('success', `${addEmail.trim()} added as ${addRole}.`)
      setAddEmail(''); setFoundUser(null); setAddOpen(false)
    } catch {
      showFeedback('error', 'Failed to add member.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(membershipId: string) {
    if (!window.confirm('Remove this member from the organisation?')) return
    try {
      await removeOrganisationMember(membershipId)
      showFeedback('success', 'Member removed.')
    } catch {
      showFeedback('error', 'Failed to remove member.')
    }
  }

  const byRole = ORG_ROLES.map(role => ({
    role,
    members: activeMembers.filter(m => m.role === role),
  })).filter(g => g.members.length > 0)

  return (
    <div className="flex flex-col gap-4">
      {feedback && (
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm
          ${feedback.type === 'success'
            ? 'bg-success/10 border border-success/20 text-success'
            : 'bg-error/10 border border-error/20 text-error'}`}>
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      <SectionCard title={`Members (${activeMembers.length})`}>
        {activeMembers.length === 0 ? (
          <p className="text-sm text-text-secondary italic py-2">No members yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {byRole.map(({ role, members: roleMembers }) => (
              <div key={role}>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
                  {ROLE_LABELS[role]} ({roleMembers.length})
                </p>
                <div className="flex flex-col divide-y divide-border">
                  {roleMembers.map(m => (
                    <div key={m.membershipId}
                      className="py-2.5 first:pt-1 last:pb-0 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {m.userEmail[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{m.userEmail}</p>
                        {!m.userUid && (
                          <p className="text-[10px] text-amber-600">pending — user not yet registered</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(m.membershipId)}
                        className="text-xs text-error hover:bg-red-50 px-2 py-1 rounded-lg
                          border border-error/20 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Add member */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setAddOpen(o => !o)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/60 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-text-primary text-sm">Add Member</p>
            <p className="text-[11px] text-text-secondary">Add a user to this organisation</p>
          </div>
        </button>
        {addOpen && (
          <div className="px-4 pb-4 pt-3 border-t border-border">
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="email"
                    value={addEmail}
                    onChange={e => { setAddEmail(e.target.value); setFoundUser(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                    placeholder="member@company.com"
                    className="flex-1 px-3 py-2 rounded-xl border border-border text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-3 py-2 rounded-xl border border-border text-sm font-medium
                      text-text-primary hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                  </button>
                </div>
                {foundUser && (
                  <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl
                    bg-success/5 border border-success/20 text-xs text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Found: {foundUser.displayName || foundUser.email}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
                  Role
                </label>
                <select
                  value={addRole}
                  onChange={e => setAddRole(e.target.value as OrganisationRole)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                >
                  {ORG_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={adding || !addEmail.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white
                    text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Subscription section ─────────────────────────────────────────────────────

function SubscriptionSection({ org }: { org: Organisation }) {
  const status = getOrganisationStatus(org)
  const start  = org.subscriptionStartDate
    ? new Date(org.subscriptionStartDate.seconds * 1000).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    : '—'

  return (
    <SectionCard title="Subscription">
      <InfoRow label="Plan"       value={
        <span className="capitalize">{org.subscriptionType}</span>
      } />
      <InfoRow label="Status"     value={
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      } />
      <InfoRow label="Start Date"   value={start} />
      <InfoRow label="Expiry Date"  value={formatOrgExpiry(org)} />
      <InfoRow label="Currency"     value={org.currency} />
      <div className="mt-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">
          Subscription editing will be available in Sprint 8 — Organisation User Management.
        </p>
      </div>
    </SectionCard>
  )
}

// ─── Products section ─────────────────────────────────────────────────────────

function ProductsSection({ org }: { org: Organisation }) {
  return (
    <SectionCard title="Enabled Products">
      {org.enabledProducts.length === 0 ? (
        <p className="text-sm text-text-secondary italic">No products enabled for this organisation.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {org.enabledProducts.map(id => (
            <div key={id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
              bg-success/5 border border-success/20">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {PRODUCT_NAMES[id] ?? id}
                </p>
                <p className="text-[10px] font-mono text-text-secondary">{id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">
          Product entitlement editing will be available in Sprint 8.
        </p>
      </div>
    </SectionCard>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function OrganisationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { firebaseUser } = useAuth()

  const [org,     setOrg]     = useState<Organisation | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [members, setMembers] = useState<OrganisationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<Section>('overview')

  useEffect(() => {
    if (!id) { setLoading(false); return }
    const unsub = subscribeOrganisation(id, o => {
      setOrg(o)
      setLoading(false)
    })
    return unsub
  }, [id])

  useEffect(() => {
    if (!org?.partnerId) return
    return subscribePartnerById(org.partnerId, setPartner)
  }, [org?.partnerId])

  useEffect(() => {
    if (!id) return
    return subscribeOrganisationMembers(id, setMembers)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-error" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-text-primary">Organisation Not Found</h1>
          <p className="text-sm text-text-secondary mt-1">This organisation does not exist or you don't have access.</p>
        </div>
        <Link to="/developer-settings" className="text-sm text-primary hover:underline">
          ← Back to Developer Settings
        </Link>
      </div>
    )
  }

  const status = getOrganisationStatus(org)

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/developer-settings"
                className="text-sm text-text-secondary hover:text-primary transition-colors shrink-0 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Developer Settings
              </Link>
              <span className="text-border">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary truncate">{org.name}</span>
                <span className={`hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0
                  ${STATUS_STYLES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-secondary shrink-0 hidden sm:block">
              {org.code}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Section tabs */}
        <div className="flex items-center border-b border-border mb-6 gap-0.5 overflow-x-auto">
          {SECTION_TABS.map(({ id: sid, label, icon: Icon }) => (
            <button
              key={sid}
              onClick={() => setSection(sid)}
              className={[
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold',
                'border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
                section === sid
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Section content */}
        {section === 'overview'     && <OverviewSection org={org} partner={partner} />}
        {section === 'members'      && (
          <MembersSection
            org={org}
            members={members}
            callerUid={firebaseUser?.uid ?? ''}
          />
        )}
        {section === 'subscription' && <SubscriptionSection org={org} />}
        {section === 'products'     && <ProductsSection org={org} />}

      </main>
    </div>
  )
}
