import { Handshake } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const PARTNER_SUB_NAV = [
  { label: 'Overview',      to: '/partner' },
  { label: 'Organizations', to: '/partner/organizations' },
  { label: 'Requests',      to: '/partner/requests' },
  { label: 'Settings',      to: '/partner/settings' },
]

export function PartnerPage() {
  return (
    <PlaceholderPageShell
      title="Partner Management"
      description="Manage your partner account, create and approve customer organizations, and monitor subscription status."
      icon={<Handshake className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Partner' },
      ]}
      subNav={PARTNER_SUB_NAV}
      archRef="generic_partner_organization_architecture.md"
      phase="Phase 2"
    />
  )
}
