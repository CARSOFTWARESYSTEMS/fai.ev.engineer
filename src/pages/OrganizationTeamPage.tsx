import { Users } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const ORG_SUB_NAV = [
  { label: 'Overview',  to: '/organization' },
  { label: 'Team',      to: '/organization/team' },
  { label: 'Projects',  to: '/organization/projects' },
  { label: 'Settings',  to: '/organization/settings' },
]

export function OrganizationTeamPage() {
  return (
    <PlaceholderPageShell
      title="Team Management"
      description="Invite and manage team members. Assign roles: Organization Admin, Manager, Engineer, Reviewer, Approver, Inspector. Minimum 2 engineers required per project."
      icon={<Users className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard',    to: '/dashboard' },
        { label: 'Organization', to: '/organization' },
        { label: 'Team' },
      ]}
      subNav={ORG_SUB_NAV}
      backTo="/organization"
      backLabel="Back to Organization"
      archRef="role_permission_matrix_v2.md § 4"
      phase="Phase 3"
    />
  )
}
