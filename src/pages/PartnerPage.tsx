import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Handshake, Globe, Mail, Phone, Building2, LayoutDashboard,
  Settings2, Users, ClipboardList, ChevronRight, Loader2,
  AlertTriangle, CheckCircle2, XCircle, Hash,
} from 'lucide-react'
import { useBranding } from '../hooks/useBranding'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { useCurrentPartner } from '../services/partnerAccessService'
import { type Partner } from '../services/partnerService'
import { UserAvatarMenu } from '../components/ui/UserAvatarMenu'

// ─── Sub-navigation ────────────────────────────────────────────────────────────

const PARTNER_SUB_NAV = [
  { label: 'Overview',      to: '/partner',               icon: LayoutDashboard },
  { label: 'Organizations', to: '/partner/organizations', icon: Building2 },
  { label: 'Requests',      to: '/partner/requests',      icon: ClipboardList },
  { label: 'Settings',      to: '/partner/settings',      icon: Settings2 },
]

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      {sub && <span className="text-[11px] text-text-secondary">{sub}</span>}
    </div>
  )
}

// ─── Partner detail card ───────────────────────────────────────────────────────

function PartnerDetailCard({ partner }: { partner: Partner }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
          <Handshake className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-text-primary">{partner.name}</h2>
            {partner.enabled ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary border border-border">
                <XCircle className="w-3 h-3" />
                Disabled
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Hash className="w-3 h-3 text-text-secondary" />
            <span className="text-xs text-text-secondary font-mono">{partner.code}</span>
          </div>
        </div>
        <Link
          to="/partner/settings"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold
            text-primary hover:bg-primary-light px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Settings
        </Link>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">

        {/* Left column */}
        <div className="px-6 py-4 flex flex-col gap-3">
          {partner.website && (
            <div className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-0.5">Website</p>
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {partner.website}
                </a>
              </div>
            </div>
          )}
          {partner.supportEmail && (
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-0.5">Support Email</p>
                <a href={`mailto:${partner.supportEmail}`} className="text-sm text-text-primary hover:text-primary transition-colors">
                  {partner.supportEmail}
                </a>
              </div>
            </div>
          )}
          {partner.supportPhone && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-0.5">Support Phone</p>
                <a href={`tel:${partner.supportPhone}`} className="text-sm text-text-primary hover:text-primary transition-colors">
                  {partner.supportPhone}
                </a>
              </div>
            </div>
          )}
          {!partner.website && !partner.supportEmail && !partner.supportPhone && (
            <p className="text-sm text-text-secondary italic">No contact details configured.</p>
          )}
        </div>

        {/* Right column — domains */}
        <div className="px-6 py-4">
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-2">Domains</p>
          {partner.domains.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {partner.domains.map(d => (
                <div key={d} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                  <span className="text-sm font-mono text-text-primary">{d}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary italic">No domains configured.</p>
          )}
        </div>
      </div>

      {/* Branding reference */}
      {partner.brandingId && (
        <div className="px-6 py-3 border-t border-border bg-gray-50/60 flex items-center gap-2">
          <span className="text-[11px] text-text-secondary">Branding preset:</span>
          <span className="text-[11px] font-mono text-text-primary">{partner.brandingId}</span>
        </div>
      )}
    </div>
  )
}

// ─── Partner selector (developer only) ────────────────────────────────────────

function PartnerSelector({
  partners,
  selected,
  onSelect,
}: {
  partners: Partner[]
  selected: Partner | null
  onSelect: (p: Partner) => void
}) {
  if (partners.length <= 1) return null
  return (
    <div className="mb-4">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide block mb-1.5">
        Select Partner
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        {partners.map(p => (
          <button
            key={p.partnerId}
            onClick={() => onSelect(p)}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
              selected?.partnerId === p.partnerId
                ? 'border-primary bg-primary-light text-primary'
                : 'border-border bg-white text-text-secondary hover:text-text-primary hover:border-primary/40',
            ].join(' ')}
          >
            {p.name}
            {!p.enabled && (
              <span className="text-[9px] bg-gray-200 text-text-secondary px-1 rounded">disabled</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PartnerPage() {
  const { branding }                            = useBranding()
  const { isDeveloper }                         = useDeveloperAccess()
  const { partner: defaultPartner, partners, isLoading } = useCurrentPartner()
  const [selectedPartner, setSelectedPartner]   = useState<Partner | null>(null)

  const partner = selectedPartner ?? defaultPartner

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Left: logo + breadcrumb */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="hidden sm:block text-sm text-text-secondary group-hover:text-primary transition-colors">
                  {branding.businessName}
                </span>
              </Link>
              <ChevronRight className="w-4 h-4 text-border shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <Handshake className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary truncate">Partner</span>
                {isDeveloper && (
                  <span className="hidden sm:block text-[10px] font-semibold px-2 py-0.5
                    rounded-full bg-primary-light text-primary border border-primary/20 shrink-0">
                    DEV
                  </span>
                )}
              </div>
            </div>

            <UserAvatarMenu />
          </div>

          {/* Sub-navigation */}
          <div className="flex items-center gap-1 -mb-px overflow-x-auto">
            {PARTNER_SUB_NAV.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/partner'}
                className={({ isActive }) => [
                  'inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold whitespace-nowrap',
                  'border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && partners.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">No partner found</p>
              <p className="text-sm text-text-secondary mt-1 max-w-sm">
                {isDeveloper
                  ? 'Create a partner in Developer Settings to get started.'
                  : 'Your account is not associated with any partner.'}
              </p>
            </div>
            {isDeveloper && (
              <Link
                to="/developer-settings"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary
                  hover:bg-primary-light px-4 py-2 rounded-lg transition-colors border border-primary/20"
              >
                Open Developer Settings
              </Link>
            )}
          </div>
        )}

        {!isLoading && partners.length > 0 && (
          <>
            {/* Partner selector — only shown for developers with multiple partners */}
            <PartnerSelector
              partners={partners}
              selected={partner}
              onSelect={setSelectedPartner}
            />

            {partner && (
              <>
                {/* Partner info card */}
                <PartnerDetailCard partner={partner} />

                {/* KPI grid */}
                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard
                    label="Organizations"
                    value="0"
                    sub="Phase 3 — org collection"
                  />
                  <KpiCard
                    label="Active Trials"
                    value="0"
                    sub="Phase 3 — org collection"
                  />
                  <KpiCard
                    label="Paid Organizations"
                    value="0"
                    sub="Phase 3 — org collection"
                  />
                  <KpiCard
                    label="Engineers"
                    value="0"
                    sub="Phase 4 — member collection"
                  />
                </div>

                {/* Quick actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/partner/organizations"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border
                      bg-white text-sm font-semibold text-text-primary hover:border-primary/40
                      hover:text-primary transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    Manage Organizations
                  </Link>
                  <Link
                    to="/partner/requests"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border
                      bg-white text-sm font-semibold text-text-primary hover:border-primary/40
                      hover:text-primary transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Review Requests
                  </Link>
                  <Link
                    to="/partner/settings"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border
                      bg-white text-sm font-semibold text-text-primary hover:border-primary/40
                      hover:text-primary transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Partner Settings
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
