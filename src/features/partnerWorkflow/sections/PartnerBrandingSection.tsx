import { useEffect, useState } from 'react'
import { Globe, Palette, Loader2, Save, AlertTriangle, Plus, RefreshCw, Trash2 } from 'lucide-react'
import {
  subscribeToBrandingPresets,
  createBrandingPreset,
  updateBrandingPreset,
  deleteBrandingPreset,
  restoreDefaultBranding,
  type BrandingPreset,
} from '../../../services/brandingService'
import {
  updatePartner,
  getReadablePartnerError,
  isValidPartnerDomain,
  type Partner,
} from '../../../services/partnerService'
import { useAuth } from '../../../auth/hooks/useAuth'
import { FeedbackBanner, CollapsibleCard, DomainManager } from '../shared'

// ─── Branding form types ──────────────────────────────────────────────────────

interface BrandingFormState {
  businessName:           string
  businessCode:           string
  poweredByText:          string
  poweredByUrl:           string
  website:                string
  supportEmail:           string
  supportPhone:           string
  whatsappNumber:         string
  technicalSupportNumber: string
  domains:                string[]
  businessCodeCustomized: boolean
}

const EMPTY_BRANDING_FORM: BrandingFormState = {
  businessName: '', businessCode: '', poweredByText: 'EV.ENGINEER',
  poweredByUrl: 'https://ev.engineer', website: '', supportEmail: '',
  supportPhone: '', whatsappNumber: '', technicalSupportNumber: '',
  domains: [], businessCodeCustomized: false,
}

function suggestCode(name: string) {
  return name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9\-_]/g, '') ?? ''
}

// ─── Branding Presets Panel ───────────────────────────────────────────────────

function BrandingPresetsPanel() {
  const { firebaseUser } = useAuth()
  const [presets,         setPresets]         = useState<BrandingPreset[]>([])
  const [form,            setForm]            = useState<BrandingFormState>(EMPTY_BRANDING_FORM)
  const [editingPreset,   setEditingPreset]   = useState<BrandingPreset | null>(null)
  const [formOpen,        setFormOpen]        = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [saveStatus,      setSaveStatus]      = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [feedback,        setFeedback]        = useState('')

  useEffect(() => subscribeToBrandingPresets(setPresets), [])

  function openAdd() {
    setEditingPreset(null); setForm(EMPTY_BRANDING_FORM)
    setFormOpen(true); setFeedback(''); setSaveStatus('idle')
  }

  function openEdit(preset: BrandingPreset) {
    setEditingPreset(preset)
    setForm({
      businessName: preset.businessName, businessCode: preset.businessCode,
      poweredByText: preset.poweredByText, poweredByUrl: preset.poweredByUrl,
      website: preset.website ?? '', supportEmail: preset.supportEmail ?? '',
      supportPhone: preset.supportPhone ?? '', whatsappNumber: preset.whatsappNumber ?? '',
      technicalSupportNumber: preset.technicalSupportNumber ?? '',
      domains: preset.domains ?? [], businessCodeCustomized: true,
    })
    setFormOpen(true); setFeedback(''); setSaveStatus('idle')
  }

  function closeForm() {
    setFormOpen(false); setEditingPreset(null); setSaveStatus('idle'); setFeedback('')
  }

  async function handleSave() {
    if (!form.businessName.trim())  { setFeedback('Business name is required.');     setSaveStatus('error'); return }
    if (!form.businessCode.trim())  { setFeedback('Business code is required.');     setSaveStatus('error'); return }
    if (!form.poweredByText.trim()) { setFeedback('"Powered by" text is required.'); setSaveStatus('error'); return }
    if (!form.poweredByUrl.trim())  { setFeedback('"Powered by" URL is required.');  setSaveStatus('error'); return }
    setSaveStatus('saving'); setFeedback('')
    try {
      const email = firebaseUser?.email ?? 'developer'
      const data = {
        businessName: form.businessName.trim(), businessCode: form.businessCode.trim(),
        poweredByText: form.poweredByText.trim(), poweredByUrl: form.poweredByUrl.trim(),
        website: form.website.trim(), supportEmail: form.supportEmail.trim(),
        supportPhone: form.supportPhone.trim(), whatsappNumber: form.whatsappNumber.trim(),
        technicalSupportNumber: form.technicalSupportNumber.trim(),
        domains: form.domains, createdBy: email,
      }
      if (editingPreset) await updateBrandingPreset(editingPreset.brandingId, data)
      else               await createBrandingPreset(data)
      setSaveStatus('saved')
      setFeedback(editingPreset ? 'Preset updated.' : 'Preset created.')
      setTimeout(closeForm, 1500)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to save.')
    }
  }

  async function handleDelete(brandingId: string) {
    try {
      await deleteBrandingPreset(brandingId)
      setDeleteConfirmId(null)
    } catch (err) {
      setFeedback((err as Error).message || 'Failed to delete preset.')
      setSaveStatus('error')
    }
  }

  async function handleRestoreDefault() {
    setSaveStatus('saving'); setFeedback('')
    try {
      await restoreDefaultBranding(firebaseUser?.email ?? 'developer')
      setSaveStatus('saved'); setFeedback('Default branding restored.')
      setTimeout(() => { setSaveStatus('idle'); setFeedback('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setFeedback((err as Error).message || 'Failed to restore default branding.')
    }
  }

  const isBusy = saveStatus === 'saving'

  return (
    <div className="flex flex-col gap-4">
      {/* Preset list */}
      {presets.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-border flex items-center justify-between">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Branding Presets</p>
            <span className="text-[11px] text-text-secondary">{presets.length} preset{presets.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-border">
            {presets.map(preset => {
              const isDeleting = deleteConfirmId === preset.brandingId
              return (
                <div key={preset.brandingId} className="px-4 py-3">
                  {isDeleting ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
                      <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                      <p className="text-sm text-error flex-1">Delete <span className="font-semibold">{preset.businessName}</span>?</p>
                      <button onClick={() => setDeleteConfirmId(null)}
                        className="text-xs font-medium text-text-secondary hover:text-text-primary px-2 py-1 transition-colors">Cancel</button>
                      <button onClick={() => handleDelete(preset.brandingId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-error hover:bg-error/90 px-3 py-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-3 h-3" />Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-text-primary">{preset.businessName}</span>
                          <span className="font-mono text-[10px] bg-primary-light text-primary px-1.5 py-0.5 rounded-full">{preset.businessCode}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{preset.poweredByText}</p>
                        {preset.domains.length > 0 && (
                          <p className="text-[10px] text-text-secondary mt-0.5 font-mono">{preset.domains.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => openEdit(preset)}
                          className="text-xs font-medium text-text-secondary border border-border hover:text-primary hover:border-primary/30 px-2.5 py-1.5 rounded-lg transition-colors">
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirmId(preset.brandingId)}
                          className="p-1.5 text-text-secondary hover:text-error transition-colors rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {presets.length === 0 && !formOpen && (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Palette className="w-7 h-7 text-border mx-auto mb-2" />
          <p className="text-sm font-medium text-text-secondary">No branding presets yet.</p>
        </div>
      )}

      {/* Add / Edit form */}
      {formOpen && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary-light/30 flex flex-col gap-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">
            {editingPreset ? `Editing: ${editingPreset.businessName}` : 'New Branding Preset'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { label: 'Business Name *',    key: 'businessName',           type: 'text',  ph: 'iFab Tech',               onChange: (v: string) => setForm(f => ({ ...f, businessName: v, businessCode: f.businessCodeCustomized ? f.businessCode : suggestCode(v) })) },
              { label: 'Business Code *',    key: 'businessCode',           type: 'text',  ph: 'ifab',                    onChange: (v: string) => setForm(f => ({ ...f, businessCode: v.toLowerCase().replace(/[^a-z0-9\-_]/g, ''), businessCodeCustomized: true })), mono: true },
              { label: '"Powered By" Text *', key: 'poweredByText',          type: 'text',  ph: 'EV.ENGINEER' },
              { label: '"Powered By" URL *',  key: 'poweredByUrl',           type: 'url',   ph: 'https://ev.engineer', mono: true },
              { label: 'Website',            key: 'website',                type: 'url',   ph: 'https://ifab.tech/', mono: true },
              { label: 'Support Email',      key: 'supportEmail',           type: 'email', ph: 'connect@ifab.tech' },
              { label: 'Support Phone',      key: 'supportPhone',           type: 'tel',   ph: '+447714296479', mono: true },
              { label: 'WhatsApp Number',    key: 'whatsappNumber',         type: 'tel',   ph: '447714296479', mono: true, hint: 'Digits only, no + prefix' },
            ] as { label: string; key: keyof BrandingFormState; type: string; ph: string; mono?: boolean; hint?: string; onChange?: (v: string) => void }[]).map(({ label, key, type, ph, mono, hint, onChange: customChange }) => (
              <div key={key}>
                <label className="text-xs font-medium text-text-secondary mb-1 block">{label}</label>
                <input type={type} value={form[key] as string}
                  onChange={e => customChange ? customChange(e.target.value) : setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={ph}
                  className={`w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white ${mono ? 'font-mono' : ''}`} />
                {hint && <p className="text-[10px] text-text-secondary mt-0.5">{hint}</p>}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-text-secondary mb-1 block">Technical Support Number</label>
              <input type="tel" value={form.technicalSupportNumber}
                onChange={e => setForm(f => ({ ...f, technicalSupportNumber: e.target.value }))}
                placeholder="919108206147"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
              <p className="text-[10px] text-text-secondary mt-0.5">Global tech support number — shown alongside sales contact</p>
            </div>
          </div>
          <DomainManager domains={form.domains} onChange={domains => setForm(f => ({ ...f, domains }))} />
          {feedback && saveStatus === 'error' && <FeedbackBanner type="error" message={feedback} />}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <button onClick={closeForm} className="text-sm font-medium text-text-secondary hover:text-error transition-colors px-3 py-2">Cancel</button>
            <button onClick={handleSave} disabled={isBusy}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editingPreset ? 'Update' : 'Create'} Preset
            </button>
          </div>
        </div>
      )}

      {feedback && saveStatus !== 'error' && !formOpen && <FeedbackBanner type="success" message={feedback} />}

      <div className="flex items-center gap-3 pt-3 border-t border-border flex-wrap">
        <button onClick={handleRestoreDefault} disabled={isBusy}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-error border border-border rounded-lg px-4 py-2 transition-colors disabled:opacity-50">
          <RefreshCw className="w-3.5 h-3.5" />
          Restore Default Branding
        </button>
        {!formOpen && (
          <button onClick={openAdd}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Preset
          </button>
        )}
      </div>
    </div>
  )
}

interface Props {
  partner:          Partner
  isDeveloperAdmin: boolean
  callerEmail:      string
}

export function PartnerBrandingSection({ partner, isDeveloperAdmin, callerEmail }: Props) {
  const [brandingPresets, setBrandingPresets] = useState<BrandingPreset[]>([])
  const [feedback,        setFeedback]        = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [saving,          setSaving]          = useState(false)

  const [domainPrimary, setDomainPrimary] = useState(partner.primaryDomain)
  const [domainExtras,  setDomainExtras]  = useState<string[]>(partner.domains.filter(d => d !== partner.primaryDomain))
  const [domainDirty,   setDomainDirty]   = useState(false)

  const [brandingOpt,   setBrandingOpt]   = useState<'link' | 'create'>(partner.brandingId ? 'link' : 'create')
  const [brandingSelId, setBrandingSelId] = useState(partner.brandingId ?? '')
  const [brandingDirty, setBrandingDirty] = useState(false)

  useEffect(() => subscribeToBrandingPresets(setBrandingPresets), [])

  // Reset when partner changes
  useEffect(() => {
    setDomainPrimary(partner.primaryDomain)
    setDomainExtras(partner.domains.filter(d => d !== partner.primaryDomain))
    setDomainDirty(false)
    setBrandingSelId(partner.brandingId ?? '')
    setBrandingOpt(partner.brandingId ? 'link' : 'create')
    setBrandingDirty(false)
  }, [partner.partnerId]) // eslint-disable-line react-hooks/exhaustive-deps

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function handleSaveDomains() {
    if (!domainPrimary.trim()) { showFeedback('error', 'Primary domain is required'); return }
    if (!isValidPartnerDomain(domainPrimary.trim())) { showFeedback('error', 'Invalid primary domain format'); return }
    for (const d of domainExtras) {
      if (!isValidPartnerDomain(d)) { showFeedback('error', `Invalid domain format: ${d}`); return }
    }
    const allDomains = [...new Set([domainPrimary.trim(), ...domainExtras].filter(Boolean))]
    setSaving(true)
    try {
      await updatePartner(partner.partnerId, { primaryDomain: domainPrimary.trim(), domains: allDomains })
      showFeedback('success', 'Domains saved.')
      setDomainDirty(false)
    } catch (err) {
      showFeedback('error', `Failed to save domains: ${getReadablePartnerError(err)}`)
    } finally { setSaving(false) }
  }

  async function handleSaveBranding() {
    setSaving(true)
    try {
      let brandingId: string | undefined
      if (brandingOpt === 'link' && brandingSelId) {
        brandingId = brandingSelId
      } else if (brandingOpt === 'create') {
        const allDomains = [...new Set([domainPrimary || partner.primaryDomain, ...domainExtras].filter(Boolean))]
        brandingId = await createBrandingPreset({
          businessName: partner.name, businessCode: partner.code,
          poweredByText: 'EV.ENGINEER', poweredByUrl: 'https://ev.engineer',
          website: partner.website ?? '', supportEmail: partner.supportEmail ?? '',
          supportPhone: partner.supportPhone ?? '', whatsappNumber: partner.whatsappNumber ?? '',
          technicalSupportNumber: '', domains: allDomains, createdBy: callerEmail,
        })
      }
      await updatePartner(partner.partnerId, { brandingId })
      showFeedback('success', brandingOpt === 'create' ? 'Branding preset created and linked.' : 'Branding linked.')
      setBrandingDirty(false)
    } catch (err) {
      showFeedback('error', `Failed to save branding: ${getReadablePartnerError(err)}`)
    } finally { setSaving(false) }
  }

  const currentBranding = brandingPresets.find(b => b.brandingId === partner.brandingId)

  return (
    <div className="flex flex-col gap-4">
      {feedback && <FeedbackBanner type={feedback.type} message={feedback.msg} />}

      <CollapsibleCard title="Domain Configuration"
        subtitle={`Primary: ${partner.primaryDomain || '—'} · ${partner.domains.length} domain${partner.domains.length !== 1 ? 's' : ''} total`}
        icon={Globe} iconBg="bg-primary-light" iconColor="text-primary" defaultOpen={true}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Primary Domain <span className="text-error">*</span>
            </label>
            <input value={domainPrimary}
              onChange={e => { setDomainPrimary(e.target.value.toLowerCase().replace(/\s/g, '')); setDomainDirty(true) }}
              placeholder="fai.ifab.tech" disabled={!isDeveloperAdmin}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition
                disabled:bg-gray-50 disabled:text-text-secondary" />
            <p className="text-[10px] text-text-secondary mt-0.5">Hostname only — no https:// or trailing slash</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">Additional Domains</label>
            {isDeveloperAdmin
              ? <DomainManager domains={domainExtras} onChange={d => { setDomainExtras(d); setDomainDirty(true) }} />
              : domainExtras.length === 0
                ? <p className="text-xs text-text-secondary italic">No additional domains.</p>
                : <div className="flex flex-wrap gap-1.5">
                    {domainExtras.map(d => (
                      <span key={d} className="text-xs font-mono bg-primary-light text-primary px-2.5 py-1 rounded-full border border-primary/20">{d}</span>
                    ))}
                  </div>
            }
          </div>
          {isDeveloperAdmin && domainDirty && (
            <div className="flex justify-end">
              <button onClick={handleSaveDomains} disabled={saving}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2
                  bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Domains
              </button>
            </div>
          )}
          {!isDeveloperAdmin && <p className="text-xs text-text-secondary italic">View only — developer admin required to edit.</p>}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Branding Configuration"
        subtitle={currentBranding ? `Linked: ${currentBranding.businessName} (${currentBranding.businessCode})` : 'No branding linked'}
        icon={Palette} iconBg="bg-purple-50" iconColor="text-purple-600" defaultOpen={true}>
        <div className="flex flex-col gap-4">
          {currentBranding && (
            <div className="px-3 py-2.5 rounded-xl bg-primary-light/40 border border-primary/20 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text-primary">{currentBranding.businessName}</span>
                <span className="font-mono text-primary bg-primary-light px-1.5 py-0.5 rounded-full">{currentBranding.businessCode}</span>
              </div>
              {currentBranding.domains.length > 0 && (
                <p className="text-text-secondary mt-0.5 font-mono">{currentBranding.domains.join(', ')}</p>
              )}
            </div>
          )}
          {isDeveloperAdmin && (
            <>
              {(['link', 'create'] as const).map(opt => (
                <label key={opt} className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                  ${brandingOpt === opt ? 'border-primary bg-primary-light/40' : 'border-border hover:border-primary/30'}`}>
                  <input type="radio" name="bOpt" value={opt}
                    checked={brandingOpt === opt}
                    onChange={() => { setBrandingOpt(opt); setBrandingDirty(true) }}
                    className="mt-0.5 accent-primary" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {opt === 'link' ? 'Link existing branding template' : 'Create new branding from partner details'}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {opt === 'link' ? 'Choose a branding preset from the list' : "Auto-creates a preset from this partner's name, domain, and contacts"}
                    </p>
                  </div>
                </label>
              ))}
              {brandingOpt === 'link' && (
                <select value={brandingSelId}
                  onChange={e => { setBrandingSelId(e.target.value); setBrandingDirty(true) }}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition">
                  <option value="">— Select a branding template —</option>
                  {brandingPresets.map(b => (
                    <option key={b.brandingId} value={b.brandingId}>
                      {b.businessName} ({b.businessCode}){b.brandingId === partner.brandingId ? ' ✓ current' : ''}
                    </option>
                  ))}
                </select>
              )}
              {brandingDirty && (
                <div className="flex justify-end">
                  <button onClick={handleSaveBranding} disabled={saving}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2
                      bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Branding
                  </button>
                </div>
              )}
            </>
          )}
          {!isDeveloperAdmin && <p className="text-xs text-text-secondary italic">View only — developer admin required to edit.</p>}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Branding Templates"
        subtitle="Manage all branding presets — create, edit, or delete templates used across partners"
        icon={Palette} iconBg="bg-purple-50" iconColor="text-purple-600" defaultOpen={false}>
        <BrandingPresetsPanel />
      </CollapsibleCard>
    </div>
  )
}
