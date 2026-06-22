import { useEffect, useState } from 'react'
import { Globe, Palette, Loader2, Save } from 'lucide-react'
import {
  subscribeToBrandingPresets,
  createBrandingPreset,
  type BrandingPreset,
} from '../../../services/brandingService'
import {
  updatePartner,
  getReadablePartnerError,
  isValidPartnerDomain,
  type Partner,
} from '../../../services/partnerService'
import { FeedbackBanner, CollapsibleCard, DomainManager } from '../shared'

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
    </div>
  )
}
