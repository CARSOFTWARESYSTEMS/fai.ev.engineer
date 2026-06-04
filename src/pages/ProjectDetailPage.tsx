import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Clock,
  Building2,
  Hash,
  Layers,
  User,
  Wrench,
  AlignLeft,
  UploadCloud,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { getProjectById } from '../projects/project.service'
import {
  type FAIProject,
  fmtTimestamp,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '../projects/project.types'

function DetailRow({ icon, label, value, mono }: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 sm:w-44 shrink-0">
        <span className="text-text-secondary">{icon}</span>
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-sm text-text-primary ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { productConfig } = useProductConfig()

  const [project, setProject] = useState<FAIProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!projectId) return
    getProjectById(projectId)
      .then((p) => {
        if (!p) {
          setErrorMsg('Project not found or you do not have access.')
          return
        }
        // Client-side ownership guard
        if (p.uid !== user?.uid) {
          setErrorMsg('You do not have access to this project.')
          return
        }
        setProject(p)
      })
      .catch((err: { code?: string }) => {
        const code = err?.code ?? ''
        if (code.includes('permission-denied')) {
          setErrorMsg('Permission denied — you do not have access to this project.')
        } else {
          setErrorMsg('Failed to load project. Please try again.')
        }
      })
      .finally(() => setIsLoading(false))
  }, [projectId, user?.uid])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorMsg || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl font-bold text-error">!</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {errorMsg || 'Project not found'}
        </h1>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          Check that you have the correct link, or return to your projects list.
        </p>
        <Link to="/projects" className="btn-primary">Back to Projects</Link>
      </div>
    )
  }

  const statusClass = PROJECT_STATUS_COLORS[project.status]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/projects" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors shrink-0">
                <ArrowLeft className="w-4 h-4" />
                Projects
              </Link>
              <span className="text-border">/</span>
              <span className="text-sm font-semibold text-text-primary truncate">{project.projectName}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="hidden sm:block text-sm font-bold text-text-primary">{productConfig.productName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Project header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-text-primary">{project.projectName}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
            </div>
            <p className="text-sm text-text-secondary font-mono">
              {project.drawingNumber} · Rev {project.drawingRevision}
            </p>
          </div>
          <Link
            to="/projects/new"
            className="btn-secondary text-sm shrink-0"
          >
            New Project
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main details */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Drawing &amp; Part Details
            </h2>
            <div>
              <DetailRow icon={<Hash className="w-4 h-4" />} label="Part Number" value={project.partNumber} mono />
              <DetailRow icon={<FileText className="w-4 h-4" />} label="Drawing Number" value={project.drawingNumber} mono />
              <DetailRow icon={<Layers className="w-4 h-4" />} label="Revision" value={project.drawingRevision} mono />
              <DetailRow icon={<Hash className="w-4 h-4" />} label="Part Name" value={project.partName} />
              <DetailRow icon={<User className="w-4 h-4" />} label="Customer" value={project.customerName} />
              <DetailRow icon={<Wrench className="w-4 h-4" />} label="Material" value={project.material} />
              {project.description && (
                <div className="flex flex-col gap-1 py-3">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-text-secondary" />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</span>
                  </div>
                  <p className="text-sm text-text-primary mt-1 leading-relaxed pl-6">{project.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* Meta */}
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Project Info
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Status', value: PROJECT_STATUS_LABELS[project.status] },
                  { label: 'Version', value: `v${project.version}` },
                  { label: 'Product Key', value: project.productKey },
                  { label: 'Org Code', value: project.organizationCode },
                  { label: 'Created', value: fmtTimestamp(project.createdAt) },
                  { label: 'Updated', value: fmtTimestamp(project.updatedAt) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="font-medium text-text-primary font-mono text-xs">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF placeholder */}
            <div className="card p-5 border-dashed">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">PDF Drawing</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    PDF viewer and balloon tool will be available in the next phase.
                  </p>
                  <span className="inline-block mt-2 text-xs bg-warning/10 text-warning font-semibold px-2 py-0.5 rounded-full">
                    Coming in Day 5
                  </span>
                </div>
              </div>
            </div>

            {/* Org */}
            {project.organizationName && (
              <div className="card p-5">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">{project.organizationName}</p>
                    <p className="text-xs text-text-secondary font-mono mt-0.5">{project.organizationCode}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline placeholder */}
        <div className="card p-5 mt-5">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              Project created {fmtTimestamp(project.createdAt)}.
              Balloon tool, feature table, and AS9102 Form 3 export will be linked to this project.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
