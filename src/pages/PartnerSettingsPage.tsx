import { SlidersHorizontal } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const PARTNER_SUB_NAV = [
  { label: 'Overview',      to: '/partner' },
  { label: 'Organizations', to: '/partner/organizations' },
  { label: 'Requests',      to: '/partner/requests' },
  { label: 'Settings',      to: '/partner/settings' },
]

export function PartnerSettingsPage() {
  return (
    <PlaceholderPageShell
      title="Partner Settings"
      description="Configure partner profile, contact information, and branding link. Managed by the partner account holder."
      icon={<SlidersHorizontal className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Partner',   to: '/partner' },
        { label: 'Settings' },
      ]}
      subNav={PARTNER_SUB_NAV}
      backTo="/partner"
      backLabel="Back to Partner"
      archRef="partner_organization_menu_architecture.md § 2"
      phase="Phase 3"
    />
  )
}
