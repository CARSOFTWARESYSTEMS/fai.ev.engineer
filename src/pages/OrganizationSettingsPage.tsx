import { Settings2 } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const ORG_SUB_NAV = [
  { label: 'Overview',  to: '/organization' },
  { label: 'Team',      to: '/organization/team' },
  { label: 'Projects',  to: '/organization/projects' },
  { label: 'Settings',  to: '/organization/settings' },
]

export function OrganizationSettingsPage() {
  return (
    <PlaceholderPageShell
      title="Organization Settings"
      description="View organization name, join code, contact details, and plan information. Edit access restricted to Organization Admin."
      icon={<Settings2 className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard',    to: '/dashboard' },
        { label: 'Organization', to: '/organization' },
        { label: 'Settings' },
      ]}
      subNav={ORG_SUB_NAV}
      backTo="/organization"
      backLabel="Back to Organization"
      archRef="partner_organization_menu_architecture.md § 3"
      phase="Phase 3"
    />
  )
}
