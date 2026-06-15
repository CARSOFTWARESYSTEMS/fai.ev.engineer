import { ClipboardList } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const PARTNER_SUB_NAV = [
  { label: 'Overview',      to: '/partner' },
  { label: 'Organizations', to: '/partner/organizations' },
  { label: 'Requests',      to: '/partner/requests' },
  { label: 'Settings',      to: '/partner/settings' },
]

export function PartnerRequestsPage() {
  return (
    <PlaceholderPageShell
      title="Organization Requests"
      description="Review and approve pending requests from customers who have entered an unknown organization code during signup."
      icon={<ClipboardList className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Partner',   to: '/partner' },
        { label: 'Requests' },
      ]}
      subNav={PARTNER_SUB_NAV}
      backTo="/partner"
      backLabel="Back to Partner"
      archRef="generic_partner_organization_architecture.md § 2.4"
      phase="Phase 3"
    />
  )
}
