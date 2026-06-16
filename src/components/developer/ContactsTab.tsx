import { useEffect, useState, useMemo } from 'react'
import {
  Phone, Mail, MessageCircle, ChevronDown, ChevronRight,
  Search, Users, AlertCircle, Loader2, UserX,
  Building2, Clock, Globe,
} from 'lucide-react'
import {
  subscribeAllUsers,
  groupUsersBySignupDomain,
  buildContactLinks,
  domainDisplayLabel,
  LEGACY_DOMAIN,
  type DirectoryUser,
} from '../../services/userDirectoryService'
import type { UserRole } from '../../auth/AuthTypes'

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

function Avatar({ user }: { user: DirectoryUser }) {
  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-primary">{initials || '?'}</span>
    </div>
  )
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ users }: { users: DirectoryUser[] }) {
  const grouped    = groupUsersBySignupDomain(users)
  const domains    = [...grouped.keys()].filter(k => k !== LEGACY_DOMAIN)
  const legacy     = grouped.get(LEGACY_DOMAIN)?.length ?? 0
  const missingPh  = users.filter(u => !u.mobileNumber?.trim()).length

  const cards = [
    { label: 'Total Users',      value: users.length,         color: 'text-primary'  },
    { label: 'Known Domains',    value: domains.length,       color: 'text-emerald-600' },
    { label: 'Legacy / Unknown', value: legacy,               color: 'text-amber-600' },
    { label: 'Missing Phone',    value: missingPh,            color: 'text-red-600'  },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs text-text-secondary mt-0.5">{c.label}</p>
        </div>
      ))}
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

// ─── User Row (desktop table) ─────────────────────────────────────────────────

function UserRow({ user }: { user: DirectoryUser }) {
  return (
    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user.displayName || '(No name)'}
            </p>
            {!user.profileCompleted && (
              <span className="text-[10px] text-amber-600 font-medium">Profile incomplete</span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-text-secondary truncate max-w-[160px]">
        {user.email}
      </td>
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
      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
        {fmtDate(user.lastLoginAt)}
      </td>
      <td className="py-3 px-4">
        <ContactActions user={user} />
      </td>
    </tr>
  )
}

// ─── User Card (mobile) ───────────────────────────────────────────────────────

function UserCard({ user }: { user: DirectoryUser }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{user.displayName || '(No name)'}</p>
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
            <Phone className="w-3 h-3 shrink-0" />
            <span className="font-mono truncate">{user.mobileNumber}</span>
          </div>
        )}
        {user.organizationName && (
          <div className="flex items-center gap-1 text-text-secondary">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{user.organizationName}</span>
          </div>
        )}
        {user.lastLoginAt && (
          <div className="flex items-center gap-1 text-text-secondary">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{fmtDate(user.lastLoginAt)}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-xs text-text-secondary">Quick contact</span>
        <ContactActions user={user} />
      </div>
    </div>
  )
}

// ─── Domain Group ─────────────────────────────────────────────────────────────

function DomainGroup({
  domain,
  users,
  defaultOpen,
}: {
  domain:      string
  users:       DirectoryUser[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const label = domainDisplayLabel(domain)
  const isLegacy = domain === LEGACY_DOMAIN

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-background/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Globe className={`w-4 h-4 ${isLegacy ? 'text-text-secondary/50' : 'text-primary'}`} />
          <span className={`text-sm font-semibold ${isLegacy ? 'text-text-secondary' : 'text-text-primary'}`}>
            {label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-text-secondary" />
          : <ChevronRight className="w-4 h-4 text-text-secondary" />}
      </button>

      {open && (
        <div className="border-t border-border">
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
                {users.map(u => <UserRow key={u.uid} user={u} />)}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden p-3 space-y-2">
            {users.map(u => <UserCard key={u.uid} user={u} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ContactsTab ─────────────────────────────────────────────────────────

const ROLE_OPTIONS: Array<UserRole | 'all'> = ['all', 'engineer', 'manager', 'admin', 'super_admin', 'user']

export function ContactsTab() {
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [search,   setSearch]   = useState('')
  const [roleFilter,   setRoleFilter]   = useState<UserRole | 'all'>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeAllUsers(users => {
      setAllUsers(users)
      setLoading(false)
      setError(false)
    })
    return unsub
  }, [])

  // Available domains for filter dropdown
  const availableDomains = useMemo(() => {
    const set = new Set<string>()
    for (const u of allUsers) set.add(u.signupDomain || LEGACY_DOMAIN)
    return [...set].sort((a, b) => {
      if (a === LEGACY_DOMAIN) return 1
      if (b === LEGACY_DOMAIN) return -1
      return a.localeCompare(b)
    })
  }, [allUsers])

  // Filter users
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allUsers.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
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
    <div className="space-y-6">

      {/* Summary cards */}
      <SummaryCards users={allUsers} />

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or org…"
            className="input-field pl-9 text-sm w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
          className="input-field text-sm w-full sm:w-44"
        >
          {ROLE_OPTIONS.map(r => (
            <option key={r} value={r}>{r === 'all' ? 'All Roles' : r}</option>
          ))}
        </select>
        <select
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value)}
          className="input-field text-sm w-full sm:w-56"
        >
          <option value="all">All Domains</option>
          {availableDomains.map(d => (
            <option key={d} value={d}>{domainDisplayLabel(d)}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Users className="w-4 h-4" />
        <span>
          {filtered.length === allUsers.length
            ? `${allUsers.length} users across ${grouped.size} ${grouped.size === 1 ? 'domain' : 'domains'}`
            : `${filtered.length} of ${allUsers.length} users`}
        </span>
      </div>

      {/* Grouped user list */}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
