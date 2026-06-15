import { Layers } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const ORG_SUB_NAV = [
  { label: 'Overview',  to: '/organization' },
  { label: 'Team',      to: '/organization/team' },
  { label: 'Projects',  to: '/organization/projects' },
  { label: 'Settings',  to: '/organization/settings' },
]

export function OrganizationPage() {
  return (
    <PlaceholderPageShell
      title="Organization"
      description="Manage your organization's team members, project assignments, and settings. View plan status and team compliance."
      icon={<Layers className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Organization' },
      ]}
      subNav={ORG_SUB_NAV}
      archRef="generic_partner_organization_architecture.md § 2.2"
      phase="Phase 2"
    />
  )
}
