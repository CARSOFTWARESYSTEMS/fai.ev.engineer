import { useEffect, useState } from 'react'
import { Building2, Plus, Loader2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  subscribePartnerOrganisations,
  createOrganisation,
  softDeleteOrganisation,
  getOrganisationStatus,
  formatOrgExpiry,
  type Organisation,
} from '../../../services/organisationService'
import { logOrgActivity } from '../../../services/organisationActivityLogService'
import { FeedbackBanner, CollapsibleCard, ConfirmModal, ORG_STATUS_STYLES, ORG_STATUS_LABELS, ORG_PRODUCT_OPTIONS } from '../shared'
import type { ProductId } from '../../../auth/AuthTypes'

interface Props {
  partnerId:   string
  partnerName: string
  callerUid:   string
  callerEmail: string
}

export function PartnerOrganisationsSection({ partnerId, partnerName, callerUid, callerEmail }: Props) {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [feedback,      setFeedback]      = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [deletingOrg,   setDeletingOrg]   = useState<Organisation | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating,   setCreating]   = useState(false)
  const [oName,      setOName]      = useState('')
  const [oCode,      setOCode]      = useState('')
  const [oOwner,     setOOwner]     = useState('')
  const [oCurrency,  setOCurrency]  = useState('INR')
  const [oProducts,  setOProducts]  = useState<ProductId[]>(['fai_reports'])

  useEffect(() => subscribePartnerOrganisations(partnerId, setOrganisations), [partnerId])

  useEffect(() => {
    if (!oName) return
    const derived = oName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
    setOCode(derived)
  }, [oName])

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  function toggleProduct(id: ProductId) {
    setOProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!oName.trim() || !oCode.trim()) return
    setCreating(true)
    try {
      const orgId = await createOrganisation({
        partnerId,
        name:            oName.trim(),
        code:            oCode.trim().toLowerCase(),
        ownerEmail:      oOwner.trim() || undefined,
        currency:        oCurrency,
        enabledProducts: oProducts,
        createdBy:       callerUid,
      })
      logOrgActivity({
        organisationId: orgId,
        eventType:      'subscription.created',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `Trial subscription created (7 days, ${oCurrency})`,
        metadata:       { type: 'trial', currency: oCurrency },
      }).catch(() => {})
      showFeedback('success', `Organisation "${oName.trim()}" created with 7-day trial.`)
      setOName(''); setOCode(''); setOOwner(''); setOProducts(['fai_reports']); setCreateOpen(false)
    } catch {
      showFeedback('error', 'Failed to create organisation.')
    } finally { setCreating(false) }
  }

  async function handleDeleteOrg(reason: string) {
    if (!deletingOrg) return
    try {
      await softDeleteOrganisation(deletingOrg.organisationId, {
        reason, deletedBy: callerEmail, deletedByUid: callerUid,
      })
      logOrgActivity({
        organisationId: deletingOrg.organisationId,
        eventType:      'organisation.deleted',
        actorUid:       callerUid,
        actorEmail:     callerEmail,
        description:    `Organisation soft-deleted${reason ? `: ${reason}` : ''}`,
        metadata:       { reason },
      }).catch(() => {})
      showFeedback('success', `Organisation "${deletingOrg.name}" deleted.`)
    } catch {
      showFeedback('error', 'Failed to delete organisation.')
    } finally { setDeletingOrg(null) }
  }

  const total     = organisations.length
  const trials    = organisations.filter(o => getOrganisationStatus(o) === 'trial').length
  const actives   = organisations.filter(o => getOrganisationStatus(o) === 'active').length
  const suspended = organisations.filter(o => getOrganisationStatus(o) === 'suspended').length

  return (
    <div className="flex flex-col gap-4">
      {deletingOrg && (
        <ConfirmModal
          title={`Delete organisation "${deletingOrg.name}"?`}
          warning="This will mark the organisation as deleted. Members, projects, billing, and audit history will be preserved."
          confirmLabel="Delete Organisation"
          onConfirm={handleDeleteOrg}
          onCancel={() => setDeletingOrg(null)}
        />
      )}

      {feedback && <FeedbackBanner type={feedback.type} message={feedback.msg} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: total,     cls: 'text-text-primary' },
          { label: 'Trial',     value: trials,    cls: 'text-blue-700'    },
          { label: 'Active',    value: actives,   cls: 'text-success'     },
          { label: 'Suspended', value: suspended, cls: 'text-error'       },
        ].map(({ label, value, cls }) => (
          <div key={label} className="card p-4">
            <p className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</p>
            <p className="text-[11px] font-medium text-text-secondary mt-0.5 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      <CollapsibleCard
        title="Organisations"
        subtitle={`${total} organisation${total !== 1 ? 's' : ''} under ${partnerName}`}
        icon={Building2} iconBg="bg-primary-light" iconColor="text-primary" defaultOpen={true}
        badge={<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">{total}</span>}
        headerRight={
          <button onClick={() => setCreateOpen(o => !o)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary
              hover:bg-primary-light px-2.5 py-1 rounded-lg border border-primary/20 transition-colors">
            <Plus className="w-3 h-3" /> Create
          </button>
        }
      >
        {createOpen && (
          <form onSubmit={handleCreate} className="mb-5 p-4 rounded-xl bg-gray-50 border border-border flex flex-col gap-3">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">New Organisation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Name <span className="text-error">*</span></label>
                <input required value={oName} onChange={e => setOName(e.target.value)}
                  placeholder="Acme Aerospace" className="w-full px-3 py-2 rounded-xl border border-border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Code <span className="text-error">*</span></label>
                <input required value={oCode} onChange={e => setOCode(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ''))}
                  placeholder="acme-aerospace" className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Owner Email</label>
                <input type="email" value={oOwner} onChange={e => setOOwner(e.target.value)}
                  placeholder="owner@acme.com" className="w-full px-3 py-2 rounded-xl border border-border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Currency</label>
                <select value={oCurrency} onChange={e => setOCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition">
                  {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Enabled Products</label>
              <div className="flex flex-col gap-1.5">
                {ORG_PRODUCT_OPTIONS.map(({ id, label }) => (
                  <label key={id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={oProducts.includes(id)} onChange={() => toggleProduct(id)} className="accent-primary" />
                    <span className="text-sm text-text-primary">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)}
                className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 transition-colors">Cancel</button>
              <button type="submit" disabled={creating || !oName.trim() || !oCode.trim()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2
                  bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Organisation
              </button>
            </div>
          </form>
        )}

        {organisations.length === 0
          ? <p className="text-sm text-text-secondary italic py-2">No organisations yet. Create one above.</p>
          : (
            <div className="flex flex-col divide-y divide-border">
              {organisations.map(org => {
                const status = getOrganisationStatus(org)
                return (
                  <div key={org.organisationId} className="py-3 first:pt-1 last:pb-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-text-primary">{org.name}</span>
                        <span className="text-[10px] font-mono text-text-secondary">{org.code}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${ORG_STATUS_STYLES[status]}`}>
                          {ORG_STATUS_LABELS[status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-text-secondary">
                        {org.ownerEmail && <span>Owner: {org.ownerEmail}</span>}
                        <span>Expires: {formatOrgExpiry(org)}</span>
                        {org.enabledProducts.length > 0 && (
                          <span>{org.enabledProducts.length} product{org.enabledProducts.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/partner/organisations/${org.organisationId}`}
                        className="text-xs font-medium text-primary hover:bg-primary-light px-2.5 py-1
                          rounded-lg border border-primary/20 transition-colors">
                        View →
                      </Link>
                      <button onClick={() => setDeletingOrg(org)} title="Delete organisation"
                        className="text-text-secondary hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </CollapsibleCard>
    </div>
  )
}
