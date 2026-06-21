import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Building2, ArrowLeft, Users, Package, CreditCard, AlertTriangle,
  Loader2, Plus, UserPlus, CheckCircle2, Activity, ShieldCheck,
  ChevronDown,
} from 'lucide-react'
import {
  subscribeOrganisation,
  subscribeOrganisationMembers,
  addOrganisationMember,
  updateMemberRole,
  deactivateMember,
  reactivateMember,
  removeOrganisationMember,
  getOrganisationStatus,
  formatOrgExpiry,
  canAddOrganisationMember,
  getSeatLimitMessage,
  type Organisation,
  type OrganisationMember,
  type MembershipStatus,
  type OrgStatus,
} from '../services/organisationService'
import {
  subscribeOrganisationActivityLogs,
  logOrgActivity,
  ACTIVITY_FILTER_EVENTS,
  EVENT_LABELS,
  EVENT_COLOURS,
  type OrgActivityLog,
  type OrgActivityFilter,
} from '../services/organisationActivityLogService'
import { subscribePartnerById, type Partner } from '../services/partnerService'
import { listUsers } from '../services/roleManagementService'
import { useAuth } from '../auth/hooks/useAuth'
import { isBootstrapDeveloper } from '../config/developerBootstrap'
import type { OrganisationRole } from '../auth/AuthTypes'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'overview' | 'members' | 'users' | 'subscription' | 'products' | 'activity'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TABS: { id: Section; label: string; icon: typeof Building2 }[] = [
  { id: 'overview',      label: 'Overview',      icon: Building2   },
  { id: 'members',       label: 'Members',        icon: UserPlus    },
  { id: 'users',         label: 'Users',          icon: Users       },
  { id: 'subscription',  label: 'Subscription',   icon: CreditCard  },
  { id: 'products',      label: 'Products',       icon: Package     },
  { id: 'activity',      label: 'Activity',       icon: Activity    },
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

const MEMBERSHIP_STYLES: Record<MembershipStatus, string> = {
  active:   'bg-success/10 text-success border-success/20',
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-gray-100 text-text-secondary border-border',
  removed:  'bg-red-50 text-error border-red-200',
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

function FeedbackRow({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm
      ${type === 'success'
        ? 'bg-success/10 border border-success/20 text-success'
        : 'bg-error/10 border border-error/20 text-error'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  )
}

// ─── Overview section ─────────────────────────────────────────────────────────

function OverviewSection({ org, partner }: { org: Organisation; partner: Partner | null }) {
  const status = getOrganisationStatus(org)
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Overview">
        <InfoRow label="Name"        value={org.name} />
        <InfoRow label="Code"        value={<span className="font-mono text-xs">{org.code}</span>} />
        <InfoRow label="Status"      value={
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        } />
        <InfoRow label="Partner"     value={partner?.name ?? org.partnerId} />
        <InfoRow label="Owner Email" value={org.ownerEmail} />
        <InfoRow label="Owner UID"   value={org.ownerUid ? <span className="font-mono text-xs">{org.ownerUid}</span> : '—'} />
        <InfoRow label="Created"     value={org.createdAt
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
              <span className={`text-sm font-bold ${limit === 0 ? 'text-text-secondary' : 'text-text-primary'}`}>
                {limit === 0 ? '—' : limit}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Members section (add new members) ───────────────────────────────────────

function MembersSection({
  org, members, callerUid, callerEmail, canManage,
}: {
  org: Organisation; members: OrganisationMember[]
  callerUid: string; callerEmail: string; canManage: boolean
}) {
  const activeMembers = members.filter(
    m => m.membershipStatus === 'active' || m.membershipStatus === 'pending',
  )
  const [addOpen,   setAddOpen]   = useState(false)
  const [addEmail,  setAddEmail]  = useState('')
  const [addRole,   setAddRole]   = useState<OrganisationRole>('engineer')
  const [searching, setSearching] = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [foundUser, setFoundUser] = useState<{ uid: string; email: string; displayName: string } | null>(null)
  const [feedback,  setFeedback]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 5000)
  }

  async function handleSearch() {
    if (!addEmail.trim()) return
    setSearching(true)
    try {
      const all   = await listUsers()
      const q     = addEmail.toLowerCase()
      const match = all.find(u => u.email?.toLowerCase() === q || u.email?.toLowerCase().includes(q))
      setFoundUser(match ? { uid: match.uid, email: match.email, displayName: match.displayName } : null)
      if (!match) showFeedback('error', 'User not found — membership will be created as pending.')
    } catch {
      showFeedback('error', 'Failed to search users.')
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    if (!canAddOrganisationMember(org, members, addRole)) {
      showFeedback('error', getSeatLimitMessage(addRole))
      return
    }
    setAdding(true)
    try {
      await addOrganisationMember({
        organisationId: org.organisationId,
        userUid:        foundUser?.uid ?? '',
        userEmail:      addEmail.trim().toLowerCase(),
        role:           addRole,
        createdBy:      callerUid,
      })
      await logOrgActivity({
        organisationId: org.organisationId,
        eventType:      'member.added',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `${addEmail.trim()} added as ${addRole}`,
        metadata:       { email: addEmail.trim(), role: addRole },
      })
      showFeedback('success', `${addEmail.trim()} added as ${ROLE_LABELS[addRole]}.`)
      setAddEmail(''); setFoundUser(null); setAddOpen(false)
    } catch {
      showFeedback('error', 'Failed to add member.')
    } finally {
      setAdding(false)
    }
  }

  const byRole = ORG_ROLES.map(role => ({
    role,
    count: activeMembers.filter(m => m.role === role).length,
  }))

  return (
    <div className="flex flex-col gap-4">
      {feedback && <FeedbackRow type={feedback.type} msg={feedback.msg} />}

      <SectionCard title={`Active Members (${activeMembers.length})`}>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {byRole.filter(r => r.count > 0 || ['owner','manager','engineer'].includes(r.role)).map(({ role, count }) => (
            <div key={role} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-border">
              <span className="text-xs font-medium text-text-secondary capitalize">{role}</span>
              <span className={`text-sm font-bold ${count > 0 ? 'text-text-primary' : 'text-text-secondary'}`}>{count}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {canManage && (
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
                      required type="email" value={addEmail}
                      onChange={e => { setAddEmail(e.target.value); setFoundUser(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                      placeholder="member@company.com"
                      className="flex-1 px-3 py-2 rounded-xl border border-border text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                    <button
                      type="button" onClick={handleSearch} disabled={searching}
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
                    {ORG_ROLES.map(r => {
                      const allowed = canAddOrganisationMember(org, members, r)
                      return (
                        <option key={r} value={r} disabled={!allowed}>
                          {ROLE_LABELS[r]}{!allowed ? ' (limit reached)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit" disabled={adding || !addEmail.trim()}
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
      )}
    </div>
  )
}

// ─── Users section (manage existing members) ─────────────────────────────────

function UsersSection({
  org, members, callerUid, callerEmail, canManage,
}: {
  org: Organisation; members: OrganisationMember[]
  callerUid: string; callerEmail: string; canManage: boolean
}) {
  const [feedback,    setFeedback]    = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [roleEditing, setRoleEditing] = useState<string | null>(null)
  const [newRole,     setNewRole]     = useState<OrganisationRole>('engineer')
  const [saving,      setSaving]      = useState(false)

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 5000)
  }

  const activeOwners = members.filter(
    m => m.role === 'owner' && m.membershipStatus !== 'removed',
  )

  async function handleRoleChange(member: OrganisationMember) {
    if (newRole === member.role) { setRoleEditing(null); return }
    if (newRole === 'owner') {
      const otherOwners = activeOwners.filter(o => o.membershipId !== member.membershipId)
      if (otherOwners.length > 0) {
        showFeedback('error', 'An organisation can only have one Owner.')
        setRoleEditing(null); return
      }
    }
    if (member.role === 'owner' && newRole !== 'owner' && activeOwners.length <= 1) {
      showFeedback('error', 'Cannot remove the last Owner. Assign a new Owner first.')
      setRoleEditing(null); return
    }
    if (member.userUid === callerUid && member.role === 'owner') {
      showFeedback('error', 'You cannot downgrade your own Owner role.')
      setRoleEditing(null); return
    }
    setSaving(true)
    try {
      const prevRole = member.role
      await updateMemberRole(member.membershipId, newRole)
      await logOrgActivity({
        organisationId: org.organisationId,
        eventType:      'member.role_changed',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `${member.userEmail} role changed: ${prevRole} → ${newRole}`,
        metadata:       { membershipId: member.membershipId, from: prevRole, to: newRole },
      })
      showFeedback('success', `${member.userEmail} updated to ${ROLE_LABELS[newRole]}.`)
    } catch {
      showFeedback('error', 'Failed to change role.')
    } finally {
      setSaving(false); setRoleEditing(null)
    }
  }

  async function handleDeactivate(member: OrganisationMember) {
    if (!window.confirm(`Deactivate ${member.userEmail}?`)) return
    try {
      await deactivateMember(member.membershipId)
      await logOrgActivity({
        organisationId: org.organisationId,
        eventType:      'member.deactivated',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `${member.userEmail} (${member.role}) deactivated`,
      })
      showFeedback('success', `${member.userEmail} deactivated.`)
    } catch {
      showFeedback('error', 'Failed to deactivate member.')
    }
  }

  async function handleReactivate(member: OrganisationMember) {
    try {
      await reactivateMember(member.membershipId)
      await logOrgActivity({
        organisationId: org.organisationId,
        eventType:      'member.reactivated',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `${member.userEmail} (${member.role}) reactivated`,
      })
      showFeedback('success', `${member.userEmail} reactivated.`)
    } catch {
      showFeedback('error', 'Failed to reactivate member.')
    }
  }

  async function handleRemove(member: OrganisationMember) {
    if (member.role === 'owner' && activeOwners.length <= 1) {
      showFeedback('error', 'Cannot remove the last Owner.')
      return
    }
    if (!window.confirm(`Permanently remove ${member.userEmail} from this organisation?`)) return
    try {
      await removeOrganisationMember(member.membershipId)
      await logOrgActivity({
        organisationId: org.organisationId,
        eventType:      'member.removed',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `${member.userEmail} (${member.role}) removed`,
      })
      showFeedback('success', `${member.userEmail} removed.`)
    } catch {
      showFeedback('error', 'Failed to remove member.')
    }
  }

  const visibleMembers = members.filter(m => m.membershipStatus !== 'removed')
  const byRole = ORG_ROLES
    .map(role => ({ role, members: visibleMembers.filter(m => m.role === role) }))
    .filter(g => g.members.length > 0)

  return (
    <div className="flex flex-col gap-4">
      {feedback && <FeedbackRow type={feedback.type} msg={feedback.msg} />}

      {visibleMembers.length === 0 ? (
        <SectionCard title="Users">
          <p className="text-sm text-text-secondary italic">No members yet. Add members in the Members tab.</p>
        </SectionCard>
      ) : (
        byRole.map(({ role, members: roleMembers }) => (
          <SectionCard key={role} title={`${ROLE_LABELS[role]}s (${roleMembers.length})`}>
            <div className="flex flex-col divide-y divide-border">
              {roleMembers.map(member => (
                <div key={member.membershipId} className="py-3 first:pt-1 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-primary">
                        {member.userEmail[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-primary truncate">{member.userEmail}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border
                          ${MEMBERSHIP_STYLES[member.membershipStatus]}`}>
                          {member.membershipStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {member.createdAt
                          ? `Joined ${new Date(member.createdAt.seconds * 1000).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`
                          : 'Joined —'}
                        {!member.userUid && ' · pending linkage'}
                      </p>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {roleEditing === member.membershipId ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={newRole}
                              onChange={e => setNewRole(e.target.value as OrganisationRole)}
                              className="text-xs border border-border rounded-lg px-2 py-1 bg-white"
                              autoFocus
                            >
                              {ORG_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                            <button
                              onClick={() => handleRoleChange(member)}
                              disabled={saving}
                              className="text-xs font-medium text-white bg-primary px-2 py-1
                                rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </button>
                            <button
                              onClick={() => setRoleEditing(null)}
                              className="text-xs text-text-secondary px-1 py-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setRoleEditing(member.membershipId); setNewRole(member.role) }}
                            className="text-xs text-text-secondary hover:text-primary border border-border
                              px-2 py-1 rounded-lg hover:border-primary/30 transition-colors
                              inline-flex items-center gap-1"
                          >
                            Role <ChevronDown className="w-3 h-3" />
                          </button>
                        )}

                        {(member.membershipStatus === 'active' || member.membershipStatus === 'pending') ? (
                          <button
                            onClick={() => handleDeactivate(member)}
                            className="text-xs text-amber-700 hover:bg-amber-50 px-2 py-1
                              rounded-lg border border-amber-200 transition-colors"
                          >
                            Pause
                          </button>
                        ) : member.membershipStatus === 'inactive' ? (
                          <button
                            onClick={() => handleReactivate(member)}
                            className="text-xs text-success hover:bg-success/10 px-2 py-1
                              rounded-lg border border-success/20 transition-colors"
                          >
                            Reactivate
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleRemove(member)}
                          className="text-xs text-error hover:bg-red-50 px-2 py-1
                            rounded-lg border border-error/20 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))
      )}

      {!canManage && visibleMembers.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-border text-xs text-text-secondary">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Read-only view. Contact the Organisation Owner or Partner Admin to manage members.
        </div>
      )}
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
      <InfoRow label="Plan"       value={<span className="capitalize">{org.subscriptionType}</span>} />
      <InfoRow label="Status"     value={
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      } />
      <InfoRow label="Start Date" value={start} />
      <InfoRow label="Expiry"     value={formatOrgExpiry(org)} />
      <InfoRow label="Currency"   value={org.currency} />
      <div className="mt-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">
          Subscription editing is available in Sprint 9.
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
                <p className="text-sm font-medium text-text-primary">{PRODUCT_NAMES[id] ?? id}</p>
                <p className="text-[10px] font-mono text-text-secondary">{id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">Product entitlement editing will be available in a future sprint.</p>
      </div>
    </SectionCard>
  )
}

// ─── Activity section ─────────────────────────────────────────────────────────

function ActivitySection({ organisationId }: { organisationId: string }) {
  const [logs,    setLogs]    = useState<OrgActivityLog[]>([])
  const [filter,  setFilter]  = useState<OrgActivityFilter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeOrganisationActivityLogs(organisationId, ls => {
      setLogs(ls)
      setLoading(false)
    })
    return unsub
  }, [organisationId])

  const FILTERS: OrgActivityFilter[] = ['all', 'membership', 'subscription', 'products']
  const FILTER_LABELS: Record<OrgActivityFilter, string> = {
    all: 'All', membership: 'Membership', subscription: 'Subscription', products: 'Products',
  }

  const filtered = filter === 'all'
    ? logs
    : logs.filter(l => {
        const allowed = ACTIVITY_FILTER_EVENTS[filter]
        return allowed ? allowed.includes(l.eventType) : true
      })

  function formatTs(ts: { seconds: number } | null): string {
    if (!ts) return '—'
    return new Date(ts.seconds * 1000).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors',
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-secondary border-border hover:border-primary/30 hover:text-primary',
            ].join(' ')}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <SectionCard title={`Activity Log (${filtered.length})`}>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-text-secondary italic py-2">No activity yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {filtered.map(log => (
              <div key={log.logId} className="py-3 first:pt-1 last:pb-0 flex items-start gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 shrink-0
                  ${EVENT_COLOURS[log.eventType]}`}>
                  {EVENT_LABELS[log.eventType]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{log.description}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {formatTs(log.createdAt)} · {log.actorEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
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

  const callerUid   = firebaseUser?.uid   ?? ''
  const callerEmail = firebaseUser?.email ?? ''

  const isDev      = isBootstrapDeveloper(callerEmail)
  const isOrgOwner = members.some(
    m => m.userUid === callerUid && m.role === 'owner' && m.membershipStatus !== 'removed',
  )
  const canManage  = isDev || isOrgOwner

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
                <span className={`hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-secondary shrink-0 hidden sm:block">{org.code}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

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

        {section === 'overview'     && <OverviewSection org={org} partner={partner} />}
        {section === 'members'      && (
          <MembersSection
            org={org} members={members}
            callerUid={callerUid} callerEmail={callerEmail}
            canManage={canManage}
          />
        )}
        {section === 'users'        && (
          <UsersSection
            org={org} members={members}
            callerUid={callerUid} callerEmail={callerEmail}
            canManage={canManage}
          />
        )}
        {section === 'subscription' && <SubscriptionSection org={org} />}
        {section === 'products'     && <ProductsSection org={org} />}
        {section === 'activity'     && <ActivitySection organisationId={org.organisationId} />}

      </main>
    </div>
  )
}
