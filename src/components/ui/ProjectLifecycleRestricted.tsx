import { Link } from 'react-router-dom'
import { useBranding } from '../../hooks/useBranding'
import type { ProjectLifecycleStatus } from '../../projects/projectLifecycle'

export function ProjectLifecycleRestricted({ status, projectName }: {
  status: Extract<ProjectLifecycleStatus, 'blocked' | 'deleted' | 'permanently_deleted'>
  projectName?: string
}) {
  const { branding } = useBranding()
  const label = status === 'permanently_deleted' ? 'permanently deleted' : status
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
            <a className="btn-primary text-sm" href={`mailto:${branding.supportEmail}`}>Contact Admin</a>
          )}
          <Link to="/projects" className="btn-secondary text-sm">Back to Projects</Link>
        </div>
      </div>
    </div>
  )
}
