import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Palette, ChevronRight, Loader2, AlertTriangle, CheckCircle2,
  Save, Globe, Mail, Phone, MessageCircle, Wrench, Plus, Trash2,
  Handshake, Eye, Hash, Link2,
} from 'lucide-react'
import { useBranding } from '../hooks/useBranding'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { usePartnerAccess, useCurrentPartner } from '../services/partnerAccessService'
import { updatePartner } from '../services/partnerService'
import {
  subscribeToBrandingById,
  subscribeToBrandingPresets,
  createBrandingPreset,
  updateBrandingPreset,
  type BrandingPreset,
} from '../services/brandingService'
import { UserAvatarMenu } from '../components/ui/UserAvatarMenu'

// ─── Sub-navigation ────────────────────────────────────────────────────────────

const PARTNER_SUB_NAV = [
  { label: 'Overview',      to: '/partner' },
  { label: 'Organizations', to: '/partner/organizations' },
  { label: 'Requests',      to: '/partner/requests' },
  { label: 'Settings',      to: '/partner/settings' },
  { label: 'Branding',      to: '/partner/branding' },
]

// ─── Domain validator ─────────────────────────────────────────────────────────

function isValidDomain(d: string): boolean {
  // No protocol, no path, lowercase, valid hostname
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(d.trim())
}

// ─── Branding form state ──────────────────────────────────────────────────────

interface BrandingForm {
  businessName:            string
  businessCode:            string
  logoUrl:                 string
  website:                 string
  poweredByText:           string
  poweredByUrl:            string
  supportEmail:            string
  supportPhone:            string
  whatsappNumber:          string
  technicalSupportNumber:  string
}

function presetToForm(p: BrandingPreset): BrandingForm {
  return {
    businessName:           p.businessName           ?? '',
    businessCode:           p.businessCode           ?? '',
    logoUrl:                p.logoUrl                ?? '',
    website:                p.website                ?? '',
    poweredByText:          p.poweredByText          ?? '',
    poweredByUrl:           p.poweredByUrl           ?? '',
    supportEmail:           p.supportEmail           ?? '',
    supportPhone:           p.supportPhone           ?? '',
    whatsappNumber:         p.whatsappNumber         ?? '',
    technicalSupportNumber: p.technicalSupportNumber ?? '',
  }
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

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string
  value?: string
  icon?: typeof Globe
  mono?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-gray-50/60">
        {Icon && <Icon className="w-4 h-4 text-text-secondary shrink-0" />}
        <span className={`text-sm text-text-primary ${mono ? 'font-mono' : ''}`}>
          {value || <span className="text-text-secondary italic">Not set</span>}
        </span>
      </div>
    </div>
  )
}

// ─── Live preview ─────────────────────────────────────────────────────────────

function BrandingPreview({ form }: { form: BrandingForm }) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="px-3 py-1.5 bg-gray-100 border-b border-border flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="text-[10px] text-text-secondary ml-2">Header preview</span>
      </div>
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="" className="w-7 h-7 rounded-md object-cover" />
            ) : (
              <span className="text-white font-bold text-xs">
                {form.businessName.charAt(0).toUpperCase() || 'F'}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary leading-tight">
              {form.businessName || 'Business Name'}
            </p>
            <p className="text-[9px] text-text-secondary">
              powered by{' '}
              <span className="text-primary">
                {form.poweredByText.replace(/^powered by\s+/i, '') || 'EV.ENGINEER'}
              </span>
            </p>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center">
          <span className="text-primary font-bold text-[9px]">U</span>
        </div>
      </div>
      <div className="bg-background px-4 py-3">
        <p className="text-[10px] text-text-secondary text-center">Dashboard preview</p>
      </div>
      {(form.supportEmail || form.supportPhone || form.whatsappNumber) && (
        <div className="bg-gray-50 border-t border-border px-4 py-2.5 flex flex-wrap gap-3">
          {form.supportEmail && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-text-secondary" />
              <span className="text-[10px] text-text-secondary">{form.supportEmail}</span>
            </div>
          )}
          {form.supportPhone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-text-secondary" />
              <span className="text-[10px] text-text-secondary">{form.supportPhone}</span>
            </div>
          )}
          {form.whatsappNumber && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-[#25D366]" />
              <span className="text-[10px] text-text-secondary">{form.whatsappNumber}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Domain manager ───────────────────────────────────────────────────────────

function DomainManager({
  brandingId,
  domains,
  canEdit,
  onUpdate,
}: {
  brandingId: string
  domains: string[]
  canEdit: boolean
  onUpdate: (msg: string) => void
}) {
  const [newDomain, setNewDomain] = useState('')
  const [adding,    setAdding]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleAdd() {
    const d = newDomain.trim().toLowerCase()
    if (!d) return
    if (!isValidDomain(d)) {
      setError('Invalid format. Use hostname only (e.g. fai.ifab.tech). No https://')
      return
    }
    if (domains.includes(d)) {
      setError('Domain already exists.')
      return
    }
    setError(null)
    setAdding(true)
    try {
      await updateBrandingPreset(brandingId, { domains: [...domains, d] })
      setNewDomain('')
      onUpdate(`Domain "${d}" added.`)
    } catch {
      setError('Failed to add domain.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(d: string) {
    if (!window.confirm(`Remove domain "${d}" from this branding? Domain routing for this hostname will fall back to platform default.`)) return
    try {
      await updateBrandingPreset(brandingId, { domains: domains.filter(x => x !== d) })
      onUpdate(`Domain "${d}" removed.`)
    } catch {
      setError('Failed to remove domain.')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Domains</h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Hostnames that load this branding. Domain routing uses the{' '}
            <span className="font-mono bg-gray-100 px-1 rounded text-[10px]">brandings.domains</span>{' '}
            array-contains query.
          </p>
        </div>
      </div>

      {/* Domain list */}
      {domains.length === 0 ? (
        <p className="text-sm text-text-secondary italic py-1">
          No domains configured. Add at least one hostname to enable domain-based routing.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {domains.map(d => (
            <div
              key={d}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-border group"
            >
              <div className="w-2 h-2 rounded-full bg-success shrink-0" />
              <span className="text-sm font-mono text-text-primary flex-1">{d}</span>
              <Link2 className="w-3.5 h-3.5 text-text-secondary/40 shrink-0" />
              {canEdit && (
                <button
                  onClick={() => handleRemove(d)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg
                    text-text-secondary opacity-0 group-hover:opacity-100
                    hover:text-error hover:bg-red-50 transition-all shrink-0"
                  title={`Remove ${d}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add domain */}
      {canEdit && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              value={newDomain}
              onChange={e => { setNewDomain(e.target.value.toLowerCase()); setError(null) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              placeholder="fai.ifab.tech"
              className="flex-1 px-3 py-2 rounded-xl border border-border text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newDomain.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white
                text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>
          {error && (
            <p className="text-xs text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {error}
            </p>
          )}
          <p className="text-[10px] text-text-secondary">
            ✓ fai.ifab.tech &nbsp;&nbsp; ✓ fai.ev.engineer &nbsp;&nbsp;
            ✗ https://fai.ifab.tech &nbsp;&nbsp; ✗ fai.ifab.tech/path
          </p>
        </div>
      )}
    </div>
  )
}

// ─── "No branding" panel for developers ───────────────────────────────────────

function NoBrandingPanel({
  partnerId,
  partnerName,
  allPresets,
  onLinked,
}: {
  partnerId: string
  partnerName: string
  allPresets: BrandingPreset[]
  onLinked: (msg: string) => void
}) {
  const [mode, setMode]           = useState<'idle' | 'create' | 'assign'>('idle')
  const [creating, setCreating]   = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [newName,  setNewName]    = useState(partnerName)
  const [newCode,  setNewCode]    = useState('')
  const [selectedId, setSelectedId] = useState('')

  async function handleCreate() {
    if (!newName.trim() || !newCode.trim()) return
    setCreating(true)
    try {
      const brandingId = await createBrandingPreset({
        businessName:  newName.trim(),
        businessCode:  newCode.trim().toLowerCase(),
        poweredByText: 'powered by EV.ENGINEER',
        poweredByUrl:  'https://ev.engineer',
        domains:       [],
        ownedByPartnerId: partnerId,
        createdBy:     'partner-branding',
      })
      await updatePartner(partnerId, { brandingId })
      onLinked(`Branding "${newName.trim()}" created and linked to partner.`)
    } catch {
      onLinked('error:Failed to create branding.')
    } finally {
      setCreating(false)
    }
  }

  async function handleAssign() {
    if (!selectedId) return
    setAssigning(true)
    try {
      // Mark the branding as owned by this partner
      await updateBrandingPreset(selectedId, { ownedByPartnerId: partnerId })
      // Link partner → branding
      await updatePartner(partnerId, { brandingId: selectedId })
      onLinked('Branding preset linked to partner.')
    } catch {
      onLinked('error:Failed to link branding.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <Palette className="w-7 h-7 text-amber-500" />
      </div>
      <div>
        <p className="font-semibold text-text-primary">No branding linked to this partner</p>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Create a new branding preset for this partner, or link an existing one.
        </p>
      </div>

      {mode === 'idle' && (
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => setMode('create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white
              text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Branding
          </button>
          {allPresets.length > 0 && (
            <button
              onClick={() => setMode('assign')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border
                bg-white text-sm font-semibold text-text-primary hover:border-primary/40 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Link Existing Preset
            </button>
          )}
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-sm flex flex-col gap-3 text-left">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Business Name
            </label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="iFab Tech"
              className="w-full px-3 py-2 rounded-xl border border-border text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Business Code
            </label>
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="ifab"
              className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim() || !newCode.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create & Link
            </button>
            <button
              onClick={() => setMode('idle')}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium
                text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'assign' && (
        <div className="w-full max-w-sm flex flex-col gap-3 text-left">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Select Existing Preset
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              <option value="">— Select a branding preset —</option>
              {allPresets.map(p => (
                <option key={p.brandingId} value={p.brandingId}>
                  {p.businessName} ({p.businessCode})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAssign}
              disabled={assigning || !selectedId}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Link to Partner
            </button>
            <button
              onClick={() => setMode('idle')}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium
                text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PartnerBrandingPage() {
  const { branding: appBranding }                           = useBranding()
  const { isDeveloper }                                     = useDeveloperAccess()
  const { isPartnerAdminUser }                              = usePartnerAccess()
  const { partner, isLoading: partnerLoading }              = useCurrentPartner()

  const canEdit = isDeveloper

  // Branding preset linked to this partner
  const [preset,    setPreset]    = useState<BrandingPreset | null>(null)
  const [brandingLoading, setBrandingLoading] = useState(true)
  // All presets (for the "assign" flow)
  const [allPresets, setAllPresets] = useState<BrandingPreset[]>([])
  // Editable form
  const [form,    setForm]    = useState<BrandingForm | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Subscribe to the branding preset when partner.brandingId changes
  useEffect(() => {
    if (partnerLoading) return
    if (!partner?.brandingId) {
      setPreset(null)
      setBrandingLoading(false)
      return
    }
    setBrandingLoading(true)
    return subscribeToBrandingById(partner.brandingId, p => {
      setPreset(p)
      setForm(p ? presetToForm(p) : null)
      setBrandingLoading(false)
    })
  }, [partner?.brandingId, partnerLoading])

  // Load all presets for "assign" flow (developer only)
  useEffect(() => {
    if (!isDeveloper) return
    return subscribeToBrandingPresets(setAllPresets)
  }, [isDeveloper])

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  function handleNoBrandingResult(msg: string) {
    if (msg.startsWith('error:')) {
      showFeedback('error', msg.replace('error:', ''))
    } else {
      showFeedback('success', msg)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !preset) return
    setSaving(true)
    try {
      await updateBrandingPreset(preset.brandingId, {
        businessName:           form.businessName.trim(),
        businessCode:           form.businessCode.trim(),
        logoUrl:                form.logoUrl.trim()                || undefined,
        website:                form.website.trim()                || undefined,
        poweredByText:          form.poweredByText.trim()          || 'powered by EV.ENGINEER',
        poweredByUrl:           form.poweredByUrl.trim()           || 'https://ev.engineer',
        supportEmail:           form.supportEmail.trim()           || undefined,
        supportPhone:           form.supportPhone.trim()           || undefined,
        whatsappNumber:         form.whatsappNumber.trim()         || undefined,
        technicalSupportNumber: form.technicalSupportNumber.trim() || undefined,
      })
      showFeedback('success', 'Branding saved.')
    } catch {
      showFeedback('error', 'Failed to save branding.')
    } finally {
      setSaving(false)
    }
  }

  const isLoading = partnerLoading || brandingLoading

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
                  {appBranding.businessName}
                </span>
              </Link>
              <ChevronRight className="w-4 h-4 text-border shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <Handshake className="w-4 h-4 text-primary shrink-0" />
                <Link to="/partner" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Partner
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />
                <Palette className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary truncate">Branding</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {form && (
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
                    transition-colors ${showPreview
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border bg-white text-text-secondary hover:text-text-primary'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              )}
              <UserAvatarMenu />
            </div>
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
          </div>
        )}

        {!isLoading && partner && (
          <div className={`flex gap-6 ${showPreview ? 'flex-col lg:flex-row' : 'flex-col'}`}>

            {/* ── Left: main content ───────────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Page title */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-text-primary">Partner Branding</h1>
                  {preset && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full
                      bg-primary-light text-primary border border-primary/20">
                      {preset.businessCode}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  {canEdit
                    ? 'Edit brand identity, contact info, and domain routing for this partner.'
                    : 'View your partner\'s brand identity and domain configuration.'}
                </p>
                {isPartnerAdminUser && !isDeveloper && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50
                    border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Partner Admins can view but not edit branding. Contact the platform team to make changes.
                  </div>
                )}
              </div>

              {feedback && <div className="mb-4"><FeedbackBanner type={feedback.type} message={feedback.message} /></div>}

              {/* No branding linked */}
              {!preset && (
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  {canEdit ? (
                    <NoBrandingPanel
                      partnerId={partner.partnerId}
                      partnerName={partner.name}
                      allPresets={allPresets.filter(p => !p.ownedByPartnerId || p.ownedByPartnerId === partner.partnerId)}
                      onLinked={handleNoBrandingResult}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <Palette className="w-8 h-8 text-text-secondary/40" />
                      <p className="text-sm text-text-secondary">No branding configured for this partner yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Branding form / read-only */}
              {preset && form && (
                <div className="flex flex-col gap-5">

                  {/* Branding ID info */}
                  <div className="flex items-center gap-2 text-[11px] text-text-secondary bg-white
                    border border-border rounded-xl px-3 py-2">
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono">{preset.brandingId}</span>
                    <span className="text-border mx-1">·</span>
                    <span>brandings/{preset.brandingId}</span>
                  </div>

                  {canEdit ? (
                    <form onSubmit={handleSave} className="flex flex-col gap-5">

                      {/* Brand Identity */}
                      <div className="bg-white rounded-2xl border border-border p-5">
                        <h2 className="text-sm font-bold text-text-primary mb-4">Brand Identity</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                              Business Name <span className="text-error">*</span>
                            </label>
                            <input
                              required
                              value={form.businessName}
                              onChange={e => setForm(f => f && { ...f, businessName: e.target.value })}
                              placeholder="iFab Tech"
                              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm
                                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                              Business Code <span className="text-[10px] font-normal text-text-secondary">(identifier)</span>
                            </label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                              <input
                                value={form.businessCode}
                                onChange={e => setForm(f => f && { ...f, businessCode: e.target.value.toLowerCase() })}
                                placeholder="ifab"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-sm font-mono
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                              Logo URL <span className="text-[10px] font-normal text-text-secondary">(optional)</span>
                            </label>
                            <input
                              type="url"
                              value={form.logoUrl}
                              onChange={e => setForm(f => f && { ...f, logoUrl: e.target.value })}
                              placeholder="https://cdn.ifabtech.com/logo.png"
                              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm
                                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Powered By */}
                      <div className="bg-white rounded-2xl border border-border p-5">
                        <h2 className="text-sm font-bold text-text-primary mb-4">Powered By Attribution</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                              Powered By Text
                            </label>
                            <input
                              value={form.poweredByText}
                              onChange={e => setForm(f => f && { ...f, poweredByText: e.target.value })}
                              placeholder="powered by EV.ENGINEER"
                              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm
                                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                              Powered By URL
                            </label>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                              <input
                                type="url"
                                value={form.poweredByUrl}
                                onChange={e => setForm(f => f && { ...f, poweredByUrl: e.target.value })}
                                placeholder="https://ev.engineer"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-white rounded-2xl border border-border p-5">
                        <h2 className="text-sm font-bold text-text-primary mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                              />
                            </div>
                          </div>
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
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                              />
                            </div>
                          </div>
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
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                              WhatsApp Number
                            </label>
                            <div className="relative">
                              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#25D366] pointer-events-none" />
                              <input
                                type="tel"
                                value={form.whatsappNumber}
                                onChange={e => setForm(f => f && { ...f, whatsappNumber: e.target.value })}
                                placeholder="447714296479"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                              />
                            </div>
                            <p className="text-[10px] text-text-secondary mt-1">Country code + number, no + or spaces</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                              Technical Support Number
                            </label>
                            <div className="relative">
                              <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                              <input
                                type="tel"
                                value={form.technicalSupportNumber}
                                onChange={e => setForm(f => f && { ...f, technicalSupportNumber: e.target.value })}
                                placeholder="919108206147"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save button */}
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white
                            text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Branding
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── Read-only view (Partner Admin) ── */
                    <div className="flex flex-col gap-5">
                      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
                        <h2 className="text-sm font-bold text-text-primary">Brand Identity</h2>
                        <ReadField label="Business Name" value={form.businessName} />
                        <ReadField label="Business Code" value={form.businessCode} mono />
                        <ReadField label="Logo URL"      value={form.logoUrl}       icon={Globe} />
                      </div>
                      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
                        <h2 className="text-sm font-bold text-text-primary">Powered By</h2>
                        <ReadField label="Powered By Text" value={form.poweredByText} />
                        <ReadField label="Powered By URL"  value={form.poweredByUrl} icon={Globe} />
                      </div>
                      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
                        <h2 className="text-sm font-bold text-text-primary">Contact</h2>
                        <ReadField label="Website"                value={form.website}                icon={Globe}          />
                        <ReadField label="Support Email"          value={form.supportEmail}           icon={Mail}           />
                        <ReadField label="Support Phone"          value={form.supportPhone}           icon={Phone}          />
                        <ReadField label="WhatsApp Number"        value={form.whatsappNumber}         icon={MessageCircle}  />
                        <ReadField label="Technical Support"      value={form.technicalSupportNumber} icon={Wrench}         />
                      </div>
                    </div>
                  )}

                  {/* Domain management */}
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <DomainManager
                      brandingId={preset.brandingId}
                      domains={preset.domains}
                      canEdit={canEdit}
                      onUpdate={msg => showFeedback('success', msg)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: live preview (when toggled) ──────────────────────── */}
            {showPreview && form && (
              <div className="w-full lg:w-80 shrink-0">
                <div className="sticky top-24">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                    Live Preview
                  </h3>
                  <BrandingPreview form={form} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
