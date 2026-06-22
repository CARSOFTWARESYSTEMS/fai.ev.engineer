import { CreditCard } from 'lucide-react'
import { CollapsibleCard } from '../shared'

interface Props {
  partnerId: string
  partnerName: string
}

export function PartnerSubscriptionSection({ partnerName }: Props) {
  return (
    <CollapsibleCard
      title="Subscription Management"
      subtitle={`Billing and subscription plans for ${partnerName}`}
      icon={CreditCard} iconBg="bg-orange-50" iconColor="text-orange-600"
      defaultOpen={true}
    >
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-sm font-semibold text-text-primary">Coming Soon</p>
        <p className="text-xs text-text-secondary max-w-xs">
          Partner-level subscription management, billing cycles, and plan configuration will be available in a future sprint.
        </p>
      </div>
    </CollapsibleCard>
  )
}
