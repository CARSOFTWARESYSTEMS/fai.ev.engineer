import { FolderKanban } from 'lucide-react'
import { PlaceholderPageShell } from '../components/ui/PlaceholderPageShell'

const ORG_SUB_NAV = [
  { label: 'Overview',  to: '/organization' },
  { label: 'Team',      to: '/organization/team' },
  { label: 'Projects',  to: '/organization/projects' },
  { label: 'Settings',  to: '/organization/settings' },
]

export function OrganizationProjectsPage() {
  return (
    <PlaceholderPageShell
      title="Organization Projects"
      description="View all projects across your organization. Assign engineers, reviewers, and approvers. Monitor two-engineer compliance and workflow status."
      icon={<FolderKanban className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Dashboard',    to: '/dashboard' },
        { label: 'Organization', to: '/organization' },
        { label: 'Projects' },
      ]}
      subNav={ORG_SUB_NAV}
      backTo="/organization"
      backLabel="Back to Organization"
      archRef="project_collaboration_architecture.md"
      phase="Phase 4"
    />
  )
}
