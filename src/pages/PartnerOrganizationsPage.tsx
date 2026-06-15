import { Building2 } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const PARTNER_SUB_NAV = [
  { label: 'Overview',      to: '/partner' },
  { label: 'Organizations', to: '/partner/organizations' },
  { label: 'Requests',      to: '/partner/requests' },
  { label: 'Settings',      to: '/partner/settings' },
]

export function PartnerOrganizationsPage() {
  return (
    <PlaceholderPageShell
      title="Customer Organizations"
      description="Create and manage customer organizations under your partner account. Assign Organization Admins and monitor trial/subscription status."
      icon={<Building2 className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Partner',   to: '/partner' },
        { label: 'Organizations' },
      ]}
      subNav={PARTNER_SUB_NAV}
      backTo="/partner"
      backLabel="Back to Partner"
      archRef="generic_partner_organization_architecture.md § 2.2"
      phase="Phase 3"
    />
  )
}
