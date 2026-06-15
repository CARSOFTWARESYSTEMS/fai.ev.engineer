import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  SlidersHorizontal, Building2,
  ChevronRight, Loader2, AlertTriangle, CheckCircle2, Save,
  Globe, Mail, Phone, Hash, ToggleLeft, ToggleRight, Handshake,
  Palette, ArrowRight,
} from 'lucide-react'
import { useBranding } from '../hooks/useBranding'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { usePartnerAccess, useCurrentPartner } from '../services/partnerAccessService'
import { updatePartner, disablePartner, type Partner } from '../services/partnerService'
import { UserAvatarMenu } from '../components/ui/UserAvatarMenu'

// ─── Sub-navigation ────────────────────────────────────────────────────────────

const PARTNER_SUB_NAV = [
  { label: 'Overview',      to: '/partner' },
  { label: 'Organizations', to: '/partner/organizations' },
  { label: 'Requests',      to: '/partner/requests' },
  { label: 'Settings',      to: '/partner/settings' },
  { label: 'Branding',      to: '/partner/branding' },
]

// ─── Form state ────────────────────────────────────────────────────────────────

interface PartnerForm {
  name:         string
  website:      string
  supportEmail: string
  supportPhone: string
  enabled:      boolean
}

function partnerToForm(p: Partner): PartnerForm {
  return {
    name:         p.name,
    website:      p.website      ?? '',
    supportEmail: p.supportEmail ?? '',
    supportPhone: p.supportPhone ?? '',
    enabled:      p.enabled,
  }
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Globe
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-gray-50/60">
        {Icon && <Icon className="w-4 h-4 text-text-secondary shrink-0" />}
        <span className="text-sm text-text-primary">{value || <span className="text-text-secondary italic">Not set</span>}</span>
      </div>
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

// ─── Branding CTA ─────────────────────────────────────────────────────────────

function BrandingCta({ brandingId }: { brandingId?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-primary/20
      bg-primary-light">
      <div className="flex items-center gap-3">
        <Palette className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary">
            {brandingId ? 'Manage partner branding' : 'No branding linked yet'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {brandingId
              ? 'Edit brand identity, domain routing and contact info in the Branding tab.'
              : 'Create or link a branding preset to this partner in the Branding tab.'}
          </p>
        </div>
      </div>
      <Link
        to="/partner/branding"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white
          text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
      >
        Branding
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PartnerSettingsPage() {
  const { branding }                                = useBranding()
  const { isDeveloper }                             = useDeveloperAccess()
  const { isPartnerAdminUser }                      = usePartnerAccess()
  const { partner, isLoading }                      = useCurrentPartner()

  const canEdit = isDeveloper   // Partner Admins get read-only

  const [form,    setForm]    = useState<PartnerForm | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [feedback, setFeedback]   = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Populate form when partner loads
  useEffect(() => {
    if (partner) setForm(partnerToForm(partner))
  }, [partner])

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !partner) return
    setSaving(true)
    try {
      await updatePartner(partner.partnerId, {
        name:         form.name.trim(),
        website:      form.website.trim()      || undefined,
        supportEmail: form.supportEmail.trim() || undefined,
        supportPhone: form.supportPhone.trim() || undefined,
        enabled:      form.enabled,
      })
      showFeedback('success', 'Partner settings saved.')
    } catch {
      showFeedback('error', 'Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisable() {
    if (!partner) return
    if (!window.confirm(`Disable partner "${partner.name}"? They will no longer appear in partner menus.`)) return
    setDisabling(true)
    try {
      await disablePartner(partner.partnerId)
      showFeedback('success', 'Partner disabled.')
    } catch {
      showFeedback('error', 'Failed to disable partner.')
    } finally {
      setDisabling(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
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
                <Link to="/partner" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Partner
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />
                <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary truncate">Settings</span>
              </div>
            </div>
            <UserAvatarMenu />
          </div>

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

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !partner && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="font-semibold text-text-primary">No partner found</p>
            <p className="text-sm text-text-secondary">
              {isDeveloper
                ? 'Create a partner in Developer Settings first.'
                : 'Your account is not associated with any partner.'}
            </p>
          </div>
        )}

        {!isLoading && partner && form && (
          <div className="max-w-2xl flex flex-col gap-5">

            {/* Page title */}
            <div>
              <h1 className="text-xl font-bold text-text-primary">Partner Settings</h1>
              <p className="text-sm text-text-secondary mt-1">
                {canEdit
                  ? 'Edit partner profile. Domain and branding config are in the Branding tab.'
                  : 'Your partner profile and configuration. Contact the platform team to make changes.'}
              </p>
              {isPartnerAdminUser && !isDeveloper && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Partner Admins can view but not edit these settings. Contact the platform team to make changes.
                </div>
              )}
            </div>

            {feedback && <FeedbackBanner type={feedback.type} message={feedback.message} />}

            {/* Branding CTA */}
            <BrandingCta brandingId={partner.brandingId} />

            {canEdit ? (
              /* ── Editable form ─────────────────────────────────────────── */
              <form onSubmit={handleSave} className="flex flex-col gap-5">

                {/* Partner Name */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                    Partner Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => f && { ...f, name: e.target.value })}
                    placeholder="e.g. iFab Tech"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>

                {/* Partner Code (immutable) */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                    Partner Code <span className="text-[10px] font-normal text-text-secondary">(immutable)</span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-gray-50/60">
                    <Hash className="w-4 h-4 text-text-secondary shrink-0" />
                    <span className="text-sm font-mono text-text-primary">{partner.code}</span>
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={e => setForm(f => f && { ...f, website: e.target.value })}
                      placeholder="https://ifabtech.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Support Email */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                    Support Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    <input
                      type="email"
                      value={form.supportEmail}
                      onChange={e => setForm(f => f && { ...f, supportEmail: e.target.value })}
                      placeholder="support@ifabtech.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Support Phone */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                    Support Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    <input
                      type="tel"
                      value={form.supportPhone}
                      onChange={e => setForm(f => f && { ...f, supportPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Enabled toggle */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm(f => f && { ...f, enabled: !f.enabled })}
                    className="flex items-center gap-2.5 group"
                  >
                    {form.enabled
                      ? <ToggleRight className="w-6 h-6 text-success" />
                      : <ToggleLeft  className="w-6 h-6 text-text-secondary" />}
                    <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                      {form.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white
                      text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>

                  {partner.enabled && (
                    <button
                      type="button"
                      onClick={handleDisable}
                      disabled={disabling}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border
                        text-sm font-medium text-error hover:bg-red-50 hover:border-error/30
                        transition-colors disabled:opacity-50"
                    >
                      {disabling
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ToggleLeft className="w-4 h-4" />}
                      Disable Partner
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* ── Read-only view (Partner Admin) ────────────────────────── */
              <div className="flex flex-col gap-4">
                <ReadField label="Partner Name"   value={partner.name}                  icon={Building2} />
                <ReadField label="Partner Code"   value={partner.code}                  icon={Hash}      />
                <ReadField label="Website"        value={partner.website      ?? ''}    icon={Globe}     />
                <ReadField label="Support Email"  value={partner.supportEmail ?? ''}    icon={Mail}      />
                <ReadField label="Support Phone"  value={partner.supportPhone ?? ''}    icon={Phone}     />
                <ReadField label="Status"         value={partner.enabled ? 'Active' : 'Disabled'} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
