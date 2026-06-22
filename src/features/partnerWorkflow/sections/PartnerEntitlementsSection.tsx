import { useEffect, useState } from 'react'
import { Package, Loader2, Save } from 'lucide-react'
import { updatePartnerEntitlements } from '../../../services/partnerService'
import type { Partner } from '../../../services/partnerService'
import { FeedbackBanner, CollapsibleCard, PLATFORM_PRODUCTS } from '../shared'
import type { ProductId } from '../../../auth/AuthTypes'

interface Props {
  partner:          Partner
  isDeveloperAdmin: boolean
}

export function PartnerEntitlementsSection({ partner, isDeveloperAdmin }: Props) {
  const [selected,  setSelected]  = useState<ProductId[]>(partner.enabledProducts)
  const [saving,    setSaving]    = useState(false)
  const [dirty,     setDirty]     = useState(false)
  const [feedback,  setFeedback]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const partnerId = partner.partnerId

  useEffect(() => {
    setSelected(partner.enabledProducts)
    setDirty(false)
  }, [partnerId]) // eslint-disable-line react-hooks/exhaustive-deps

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  function toggle(id: ProductId) {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      setDirty(true)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updatePartnerEntitlements(partnerId, selected)
      showFeedback('success', 'Product entitlements saved.')
      setDirty(false)
    } catch {
      showFeedback('error', 'Failed to save entitlements.')
    } finally { setSaving(false) }
  }

  const activeCount = selected.length

  return (
    <div className="flex flex-col gap-4">
      {feedback && <FeedbackBanner type={feedback.type} message={feedback.msg} />}

      <CollapsibleCard
        title="Product Entitlements"
        subtitle={`${activeCount} of ${PLATFORM_PRODUCTS.length} products enabled for ${partner.name}`}
        icon={Package} iconBg="bg-indigo-50" iconColor="text-indigo-600" defaultOpen={true}
        badge={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
            {activeCount}/{PLATFORM_PRODUCTS.length}
          </span>
        }
      >
        <div className="flex flex-col gap-3">
          {PLATFORM_PRODUCTS.map(({ id, label, description }) => {
            const enabled = selected.includes(id)
            return (
              <label key={id}
                className={[
                  'flex items-start gap-3 p-4 rounded-xl border transition-all',
                  isDeveloperAdmin ? 'cursor-pointer' : 'cursor-default',
                  enabled
                    ? 'border-indigo-300 bg-indigo-50/60'
                    : 'border-border bg-gray-50/60',
                ].join(' ')}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => isDeveloperAdmin && toggle(id)}
                  disabled={!isDeveloperAdmin}
                  className="mt-0.5 accent-indigo-600 w-4 h-4 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">{description}</p>
                </div>
                {enabled && (
                  <span className="ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Enabled
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {isDeveloperAdmin && dirty && (
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2
                bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Entitlements
            </button>
          </div>
        )}

        {!isDeveloperAdmin && (
          <p className="text-xs text-text-secondary italic mt-4">
            View only — developer admin access required to change product entitlements.
          </p>
        )}
      </CollapsibleCard>
    </div>
  )
}
