import { Link } from 'react-router-dom'
import { useBranding } from '../../hooks/useBranding'
import type { ProjectLifecycleStatus } from '../../projects/projectLifecycle'
import { useAuth } from '../../auth/hooks/useAuth'
import { useOrgContext } from '../../modules/organisation/OrgContextProvider'
import { buildMailtoLink, buildWhatsAppLink, type ContactMessageContext } from '../../lib/contactMessage'

export interface ProjectLifecycleRestrictedProps {
  status: Extract<ProjectLifecycleStatus, 'blocked' | 'deleted' | 'permanently_deleted'>
  projectName?: string
  projectId?: string
  partNumber?: string
  drawingNumber?: string
  projectStatus?: string
}

export function ProjectLifecycleRestricted({ status, projectName, projectId, partNumber, drawingNumber, projectStatus }: ProjectLifecycleRestrictedProps) {
  const { branding } = useBranding()
  const { user, firebaseUser } = useAuth()
  const { org } = useOrgContext()
  const label = status === 'permanently_deleted' ? 'permanently deleted' : status
  const resolvedProjectId = projectId || window.location.pathname.split('/projects/')[1]?.split('/')[0]
  const contactContext: ContactMessageContext = {
    userName: user?.displayName,
    userEmail: firebaseUser?.email ?? user?.email,
    userPhone: user?.mobileNumber,
    userRole: user?.role,
    userLifecycleStatus: user?.lifecycleStatus,
    domain: window.location.hostname,
    partnerName: branding.businessName,
    organizationName: org?.name,
    organizationCode: org?.code,
    projectName,
    projectId: resolvedProjectId,
    partNumber,
    drawingNumber,
    projectStatus,
    projectLifecycleStatus: status,
    issue: `Please review this ${label} project.`,
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card max-w-md w-full p-7 text-center">
        <span className="inline-flex text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-red-100 text-red-700 mb-4">
          {label}
        </span>
        <h1 className="text-xl font-bold text-text-primary">This project is {label}.</h1>
        {status !== 'permanently_deleted' && projectName && (
          <p className="mt-2 text-sm text-text-primary">Project: {projectName}</p>
        )}
        {status !== 'permanently_deleted' && (
          <p className="mt-2 text-sm text-text-secondary">Please contact Admin team.</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {status !== 'permanently_deleted' && branding.supportEmail && (
            <a className="btn-primary text-sm" href={buildMailtoLink(
              branding.supportEmail,
              `FAI Engineer Project Support — ${projectName || resolvedProjectId || 'Project'}`,
              contactContext,
            )}>Contact Admin</a>
          )}
          {status !== 'permanently_deleted' && branding.whatsappNumber && (
            <a className="btn-secondary text-sm" target="_blank" rel="noreferrer"
              href={buildWhatsAppLink(branding.whatsappNumber, contactContext)}>WhatsApp</a>
          )}
          <Link to="/projects" className="btn-secondary text-sm">Back to Projects</Link>
        </div>
      </div>
    </div>
  )
}
