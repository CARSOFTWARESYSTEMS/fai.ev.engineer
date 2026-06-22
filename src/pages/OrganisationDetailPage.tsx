import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Building2, ArrowLeft, Users, Package, CreditCard, AlertTriangle,
  Loader2, Plus, UserPlus, CheckCircle2, Activity, ShieldCheck,
  ChevronDown, Save, XCircle, ShieldX,
} from 'lucide-react'
import {
  subscribeOrganisation,
  subscribeOrganisationMembers,
  updateOrganisation,
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
import {
  calculateExpiryDate,
  calculateBalanceAmount,
  formatDateInput,
  parseDateInput,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '../services/subscriptionService'
import { listUsers } from '../services/roleManagementService'
import { useAuth } from '../auth/hooks/useAuth'
import { usePartnerAccess } from '../services/partnerAccessService'
import { isBootstrapDeveloper } from '../config/developerBootstrap'
import type { OrganisationRole, ProductId } from '../auth/AuthTypes'
import { Timestamp } from 'firebase/firestore'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'overview' | 'members' | 'users' | 'subscription' | 'products' | 'activity'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TABS: { id: Section; label: string; icon: typeof Building2 }[] = [
  { id: 'overview',      label: 'Overview',     icon: Building2  },
  { id: 'members',       label: 'Members',       icon: UserPlus   },
  { id: 'users',         label: 'Users',         icon: Users      },
  { id: 'subscription',  label: 'Subscription',  icon: CreditCard },
  { id: 'products',      label: 'Products',      icon: Package    },
  { id: 'activity',      label: 'Activity',      icon: Activity   },
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

const ALL_PRODUCTS: { id: ProductId; label: string }[] = [
  { id: 'fai_reports', label: 'Balloon Drawings + AS9102 FAI Reports' },
  { id: 'battery_pm',  label: 'Battery Predictive Maintenance' },
  { id: 'motor_pm',    label: 'Motor Predictive Maintenance' },
  { id: 'energy_mgmt', label: 'Energy Management' },
  { id: 'clean_room',  label: 'Clean Room Solutions' },
]

const SUBSCRIPTION_TYPES = [
  { value: 'free',    label: 'Free' },
  { value: 'trial',   label: 'Trial' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual',  label: 'Annual' },
] as const

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-text-secondary w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-text-primary">{value ?? '—'}</span>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  iconBg    = 'bg-gray-100',
  iconColor = 'text-text-secondary',
  children,
  action,
}: {
  title:      string
  icon?:      React.ComponentType<{ className?: string }>
  iconBg?:    string
  iconColor?: string
  children:   React.ReactNode
  action?:    React.ReactNode
}) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gray-50 px-5 py-3.5 border-b border-border flex items-center gap-3">
        {Icon && (
          <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        )}
        <h2 className="flex-1 text-sm font-bold text-text-primary">{title}</h2>
        {action}
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

// ─── Suspended banner ─────────────────────────────────────────────────────────

function SuspendedBanner({ partnerName }: { partnerName?: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 rounded-xl
      bg-red-50 border border-red-200 text-sm text-error">
      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Subscription Expired</p>
        <p className="text-xs text-red-600 mt-0.5">
          This organisation is read-only. Contact{' '}
          {partnerName ? `${partnerName} Partner Admin` : 'Partner Admin'} to renew the subscription.
        </p>
      </div>
    </div>
  )
}

function BlockedBanner() {
  return (
    <div className="flex items-start gap-3 px-5 py-4 rounded-xl
      bg-amber-50 border border-amber-200 text-sm text-amber-800">
      <ShieldX className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
      <div>
        <p className="font-semibold">Organisation Blocked</p>
        <p className="text-xs text-amber-700 mt-0.5">
          This organisation is read-only and cannot be modified. Contact Platform Admin to unblock.
        </p>
      </div>
    </div>
  )
}

// ─── Overview section ─────────────────────────────────────────────────────────

function OverviewSection({ org, partner }: { org: Organisation; partner: Partner | null }) {
  const status = getOrganisationStatus(org)
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Overview" icon={Building2} iconBg="bg-primary-light" iconColor="text-primary">
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

      <SectionCard title="Seat Limits" icon={ShieldCheck} iconBg="bg-gray-100" iconColor="text-text-secondary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { role: 'owner',     limit: org.ownerLimit    },
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

      <SectionCard title={`Active Members (${activeMembers.length})`} icon={UserPlus} iconBg="bg-success/10" iconColor="text-success">
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
        <SectionCard title="Users" icon={Users} iconBg="bg-success/10" iconColor="text-success">
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

function SubscriptionSection({
  org, canEdit, callerUid, callerEmail,
}: {
  org: Organisation
  canEdit: boolean
  callerUid: string
  callerEmail: string
}) {
  const status = getOrganisationStatus(org)

  // Form state initialised from org
  const [plan,     setPlan]     = useState(org.subscriptionType)
  const [currency, setCurrency] = useState<SupportedCurrency>((org.currency as SupportedCurrency) ?? 'INR')
  const [startStr, setStartStr] = useState(
    org.subscriptionStartDate
      ? formatDateInput(new Date(org.subscriptionStartDate.seconds * 1000))
      : formatDateInput(new Date()),
  )
  const [expiryStr, setExpiryStr] = useState(
    org.subscriptionExpiryDate
      ? formatDateInput(new Date(org.subscriptionExpiryDate.seconds * 1000))
      : formatDateInput(new Date()),
  )
  const [totalAmt,    setTotalAmt]    = useState(String(org.totalAmount))
  const [discountAmt, setDiscountAmt] = useState(String(org.discountAmount))
  const [paidAmt,     setPaidAmt]     = useState(String(org.paidAmount))
  const [notes,       setNotes]       = useState(org.subscriptionNotes ?? '')

  // Seat limits
  const [ownerLim,    setOwnerLim]    = useState(String(org.ownerLimit))
  const [managerLim,  setManagerLim]  = useState(String(org.managerLimit))
  const [engineerLim, setEngineerLim] = useState(String(org.engineerLimit))
  const [inspectorLim,setInspectorLim]= useState(String(org.inspectorLimit))
  const [auditorLim,  setAuditorLim]  = useState(String(org.auditorLimit))
  const [approverLim, setApproverLim] = useState(String(org.approverLimit))
  const [viewerLim,   setViewerLim]   = useState(String(org.viewerLimit))

  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 5000)
  }

  // Auto-recalculate expiry when plan or start date changes
  useEffect(() => {
    if (!startStr) return
    const expiry = calculateExpiryDate(plan, parseDateInput(startStr))
    setExpiryStr(formatDateInput(expiry))
  }, [plan, startStr])

  const balance = calculateBalanceAmount(
    Number(totalAmt)    || 0,
    Number(discountAmt) || 0,
    Number(paidAmt)     || 0,
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const prevType  = org.subscriptionType
      const newType   = plan
      const startDate = parseDateInput(startStr)
      const expDate   = parseDateInput(expiryStr)

      const seatsChanged =
        Number(ownerLim)    !== org.ownerLimit    ||
        Number(managerLim)  !== org.managerLimit  ||
        Number(engineerLim) !== org.engineerLimit ||
        Number(inspectorLim)!== org.inspectorLimit||
        Number(auditorLim)  !== org.auditorLimit  ||
        Number(approverLim) !== org.approverLimit ||
        Number(viewerLim)   !== org.viewerLimit

      await updateOrganisation(org.organisationId, {
        subscriptionType:       newType,
        subscriptionStartDate:  Timestamp.fromDate(startDate),
        subscriptionExpiryDate: Timestamp.fromDate(expDate),
        currency,
        totalAmount:            Number(totalAmt)    || 0,
        discountAmount:         Number(discountAmt) || 0,
        paidAmount:             Number(paidAmt)     || 0,
        balanceAmount:          balance,
        subscriptionNotes:      notes.trim() || undefined,
        ownerLimit:             Number(ownerLim)    || 1,
        managerLimit:           Number(managerLim)  || 0,
        engineerLimit:          Number(engineerLim) || 0,
        inspectorLimit:         Number(inspectorLim)|| 0,
        auditorLimit:           Number(auditorLim)  || 0,
        approverLimit:          Number(approverLim) || 0,
        viewerLimit:            Number(viewerLim)   || 0,
      })

      await logOrgActivity({
        organisationId: org.organisationId,
        eventType:      'subscription.updated',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    prevType !== newType
          ? `Subscription changed: ${prevType} → ${newType}`
          : `Subscription updated (${newType})`,
        metadata: { from: prevType, to: newType, currency, totalAmount: Number(totalAmt) },
      })

      if (seatsChanged) {
        await logOrgActivity({
          organisationId: org.organisationId,
          eventType:      'seat.limit.changed',
          actorUid:       callerUid,
          actorEmail:     callerEmail,
          description:    'Seat limits updated',
          metadata: {
            owner: Number(ownerLim), manager: Number(managerLim), engineer: Number(engineerLim),
            inspector: Number(inspectorLim), auditor: Number(auditorLim),
            approver: Number(approverLim), viewer: Number(viewerLim),
          },
        })
      }

      showFeedback('success', 'Subscription saved.')
    } catch {
      showFeedback('error', 'Failed to save subscription.')
    } finally {
      setSaving(false)
    }
  }

  const fieldCls = `w-full px-3 py-2 rounded-xl border border-border text-sm
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition`

  const readCls  = `w-full px-3 py-2 rounded-xl border border-border text-sm bg-gray-50 text-text-primary`

  // Read-only view for devs
  if (!canEdit) {
    const startStr_ = org.subscriptionStartDate
      ? new Date(org.subscriptionStartDate.seconds * 1000).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
      : '—'
    return (
      <div className="flex flex-col gap-4">
        <SectionCard title="Subscription" icon={CreditCard} iconBg="bg-amber-50" iconColor="text-amber-700">
          <InfoRow label="Plan"       value={<span className="capitalize">{org.subscriptionType}</span>} />
          <InfoRow label="Status"     value={
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          } />
          <InfoRow label="Start Date" value={startStr_} />
          <InfoRow label="Expiry"     value={formatOrgExpiry(org)} />
          <InfoRow label="Currency"   value={org.currency} />
          <InfoRow label="Total"      value={`${org.currency} ${org.totalAmount.toLocaleString()}`} />
          <InfoRow label="Discount"   value={`${org.currency} ${org.discountAmount.toLocaleString()}`} />
          <InfoRow label="Paid"       value={`${org.currency} ${org.paidAmount.toLocaleString()}`} />
          <InfoRow label="Balance"    value={`${org.currency} ${org.balanceAmount.toLocaleString()}`} />
          {org.subscriptionNotes && <InfoRow label="Notes" value={org.subscriptionNotes} />}
          <div className="mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">Developer accounts are view-only for subscription data.</p>
          </div>
        </SectionCard>
        <SectionCard title="Seat Limits" icon={ShieldCheck} iconBg="bg-gray-100" iconColor="text-text-secondary">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { role: 'Owner',     limit: org.ownerLimit    },
              { role: 'Manager',   limit: org.managerLimit   },
              { role: 'Engineer',  limit: org.engineerLimit  },
              { role: 'Inspector', limit: org.inspectorLimit },
              { role: 'Auditor',   limit: org.auditorLimit   },
              { role: 'Approver',  limit: org.approverLimit  },
              { role: 'Viewer',    limit: org.viewerLimit    },
            ].map(({ role, limit }) => (
              <div key={role} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-border">
                <span className="text-xs font-medium text-text-secondary">{role}</span>
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

  // Editable form for partner admins
  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      {feedback && <FeedbackRow type={feedback.type} msg={feedback.msg} />}

      {/* Plan & Dates */}
      <SectionCard title="Plan" icon={CreditCard} iconBg="bg-amber-50" iconColor="text-amber-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value as typeof plan)} className={fieldCls}>
              {SUBSCRIPTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Status</label>
            <div className={readCls}>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Start Date</label>
            <input type="date" value={startStr} onChange={e => setStartStr(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Expiry Date
              <span className="text-[10px] font-normal ml-1 text-text-secondary">(auto from plan)</span>
            </label>
            <input type="date" value={expiryStr} onChange={e => setExpiryStr(e.target.value)} className={fieldCls} />
          </div>
        </div>
      </SectionCard>

      {/* Billing */}
      <SectionCard title="Billing" icon={CreditCard} iconBg="bg-amber-50" iconColor="text-amber-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value as SupportedCurrency)} className={fieldCls}>
              {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Total Amount</label>
            <input type="number" min="0" step="1" value={totalAmt} onChange={e => setTotalAmt(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Discount</label>
            <input type="number" min="0" step="1" value={discountAmt} onChange={e => setDiscountAmt(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Paid Amount</label>
            <input type="number" min="0" step="1" value={paidAmt} onChange={e => setPaidAmt(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Balance <span className="text-[10px] font-normal">(auto)</span>
            </label>
            <div className={`${readCls} font-semibold ${balance > 0 ? 'text-error' : 'text-success'}`}>
              {currency} {balance.toLocaleString()}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Internal billing notes…"
              className={`${fieldCls} resize-none`}
            />
          </div>
        </div>
      </SectionCard>

      {/* Seat Limits */}
      <SectionCard title="Seat Limits" icon={ShieldCheck} iconBg="bg-gray-100" iconColor="text-text-secondary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['Owner',     ownerLim,     setOwnerLim,    1],
            ['Manager',   managerLim,   setManagerLim,  0],
            ['Engineer',  engineerLim,  setEngineerLim, 0],
            ['Inspector', inspectorLim, setInspectorLim,0],
            ['Auditor',   auditorLim,   setAuditorLim,  0],
            ['Approver',  approverLim,  setApproverLim, 0],
            ['Viewer',    viewerLim,    setViewerLim,   0],
          ] as [string, string, React.Dispatch<React.SetStateAction<string>>, number][]).map(([label, val, setter, min]) => (
            <div key={label}>
              <label className="text-xs font-medium text-text-secondary block mb-1">{label}</label>
              <input
                type="number" min={min} step="1" value={val}
                onChange={e => setter(e.target.value)}
                className={fieldCls}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white
            text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Subscription
        </button>
      </div>
    </form>
  )
}

// ─── Products section ─────────────────────────────────────────────────────────

function ProductsSection({
  org, partner, canEdit, callerUid, callerEmail,
}: {
  org: Organisation
  partner: Partner | null
  canEdit: boolean
  callerUid: string
  callerEmail: string
}) {
  // Products the partner allows (default to all if partner not yet loaded)
  const partnerProducts: ProductId[] = partner?.enabledProducts ?? ALL_PRODUCTS.map(p => p.id)

  // Which products are enabled on this org
  const [enabled,  setEnabled]  = useState<ProductId[]>(org.enabledProducts)
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Sync if org updates externally
  useEffect(() => { setEnabled(org.enabledProducts) }, [org.enabledProducts])

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 5000)
  }

  async function toggle(productId: ProductId) {
    const wasEnabled = enabled.includes(productId)
    const next       = wasEnabled
      ? enabled.filter(p => p !== productId)
      : [...enabled, productId]
    setEnabled(next)
    setSaving(true)
    try {
      await updateOrganisation(org.organisationId, { enabledProducts: next })
      await logOrgActivity({
        organisationId: org.organisationId,
        eventType:      wasEnabled ? 'product.disabled' : 'product.enabled',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `${ALL_PRODUCTS.find(p => p.id === productId)?.label ?? productId} ${wasEnabled ? 'disabled' : 'enabled'}`,
        metadata:       { productId },
      })
    } catch {
      setEnabled(org.enabledProducts)
      showFeedback('error', 'Failed to update product entitlements.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {feedback && <FeedbackRow type={feedback.type} msg={feedback.msg} />}

      <SectionCard
        title="Product Entitlements"
        icon={Package} iconBg="bg-indigo-50" iconColor="text-indigo-600"
        action={saving ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : undefined}
      >
        {canEdit && (
          <p className="text-xs text-text-secondary mb-3">
            Showing products available to this partner. Toggle to enable or disable for this organisation.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {ALL_PRODUCTS.map(({ id, label }) => {
            const partnerAllows = partnerProducts.includes(id)
            const isEnabled     = enabled.includes(id)
            return (
              <div
                key={id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors
                  ${isEnabled && partnerAllows
                    ? 'bg-success/5 border-success/20'
                    : !partnerAllows
                    ? 'bg-gray-50 border-border opacity-50'
                    : 'bg-white border-border'}`}
              >
                {canEdit && partnerAllows ? (
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggle(id)}
                    disabled={saving}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                ) : (
                  isEnabled && partnerAllows
                    ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    : <div className="w-4 h-4 rounded border border-border bg-gray-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="text-[10px] font-mono text-text-secondary">{id}</p>
                </div>
                {!partnerAllows && (
                  <span className="text-[10px] text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded border border-border shrink-0">
                    Not in partner plan
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
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

      <SectionCard title={`Activity Log (${filtered.length})`} icon={Activity} iconBg="bg-gray-100" iconColor="text-text-secondary">
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
  const { isPartnerAdminUser, primaryPartnerId } = usePartnerAccess()

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

  // Partner admin can edit subscription if this org belongs to their partner
  const canEditSubscription = isPartnerAdminUser
    && !!org
    && primaryPartnerId === org.partnerId

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

  const status     = getOrganisationStatus(org)
  const suspended  = status === 'suspended'
  const blocked    = org.lifecycleStatus === 'blocked'
  const isReadOnly = suspended || blocked

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

        {(suspended || blocked) && (
          <div className="mb-5 flex flex-col gap-3">
            {suspended && <SuspendedBanner partnerName={partner?.name} />}
            {blocked   && <BlockedBanner />}
          </div>
        )}

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
            canManage={canManage && !isReadOnly}
          />
        )}
        {section === 'users'        && (
          <UsersSection
            org={org} members={members}
            callerUid={callerUid} callerEmail={callerEmail}
            canManage={canManage && !isReadOnly}
          />
        )}
        {section === 'subscription' && (
          <SubscriptionSection
            org={org}
            canEdit={canEditSubscription}
            callerUid={callerUid}
            callerEmail={callerEmail}
          />
        )}
        {section === 'products'     && (
          <ProductsSection
            org={org}
            partner={partner}
            canEdit={canEditSubscription}
            callerUid={callerUid}
            callerEmail={callerEmail}
          />
        )}
        {section === 'activity'     && <ActivitySection organisationId={org.organisationId} />}

      </main>
    </div>
  )
}
