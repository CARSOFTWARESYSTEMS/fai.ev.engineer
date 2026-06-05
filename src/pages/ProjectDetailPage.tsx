import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  Pencil,
  Trash2,
  LayoutDashboard,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { getProjectById, deleteProject } from '../projects/project.service'
import {
  uploadProjectPdf,
  deleteProjectPdf,
  validatePdfFile,
  getPdfErrorMessage,
} from '../projects/projectFile.service'
import { loadGisScript, requestDriveToken } from '../lib/googleDrive'
import {
  type FAIProject,
  fmtTimestamp,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '../projects/project.types'
import { DeleteProjectModal } from '../components/ui/DeleteProjectModal'

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
  const navigate = useNavigate()
  const { user } = useAuth()
  const { productConfig } = useProductConfig()

  const [project, setProject] = useState<FAIProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [showDelete,      setShowDelete]      = useState(false)
  const [isDeleting,      setIsDeleting]      = useState(false)
  const [deleteError,     setDeleteError]     = useState('')
  const [isUploading,     setIsUploading]     = useState(false)
  const [uploadError,     setUploadError]     = useState('')
  const [confirmDeletePdf, setConfirmDeletePdf] = useState(false)
  const [isDeletingPdf,   setIsDeletingPdf]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-load GIS script on mount so it's ready when user clicks Upload
  // This ensures requestAccessToken() fires synchronously within the user gesture
  useEffect(() => { loadGisScript().catch(() => {}) }, [])

  // Request Drive token BEFORE opening the file picker.
  // The OAuth popup MUST be triggered from a direct button click (user gesture).
  // File input onChange fires after the OS picker closes — Chrome no longer
  // considers that a user gesture, so window.open() is blocked there.
  const handleUploadClick = async () => {
    setUploadError('')
    try {
      await requestDriveToken(user?.email ?? '')
    } catch (err) {
      setUploadError(getPdfErrorMessage(err))
      return
    }
    fileInputRef.current?.click()
  }

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const validationError = validatePdfFile(file)
    if (validationError) { setUploadError(validationError); return }

    setUploadError('')
    setIsUploading(true)
    try {
      await uploadProjectPdf(
        project!.projectId,
        user!.uid,
        user!.email ?? '',
        file,
        project!.googleDriveFileId || undefined
      )
      const updated = await getProjectById(project!.projectId)
      if (updated) setProject(updated)
    } catch (err) {
      setUploadError(getPdfErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePdf = async () => {
    if (!project || !user) return
    setIsDeletingPdf(true)
    setUploadError('')
    try {
      await deleteProjectPdf(project.projectId, user.uid, project.googleDriveFileId, user.email ?? '')
      const updated = await getProjectById(project.projectId)
      if (updated) setProject(updated)
      setConfirmDeletePdf(false)
    } catch {
      setUploadError('Unable to delete PDF. Please try again.')
      setConfirmDeletePdf(false)
    } finally {
      setIsDeletingPdf(false)
    }
  }

  useEffect(() => {
    if (!projectId) return
    getProjectById(projectId)
      .then((p) => {
        if (!p) {
          setErrorMsg('Project not found or you do not have access.')
          return
        }
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

  const handleDeleteConfirm = async () => {
    if (!projectId || !user) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteProject(projectId, user.uid, user.email ?? '')
      setShowDelete(false)
      navigate('/projects', { replace: true })
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? ''
      setDeleteError(msg || 'Unable to delete project. Please try again.')
      setShowDelete(false)
      setIsDeleting(false)
    }
  }

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
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/dashboard"
              className="btn-ghost text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              to={`/projects/${project.projectId}/edit`}
              className="btn-secondary text-sm"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 font-semibold text-sm rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="mb-5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {deleteError}
          </div>
        )}

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

            {/* Drawing PDF */}
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Drawing PDF
              </h2>

              {uploadError && (
                <div className="mb-3 px-3 py-2 bg-error/10 border border-error/20 text-error text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {uploadError}
                </div>
              )}

              {project.pdfStatus === 'uploaded' && project.googleDriveFileId ? (
                /* ── PDF uploaded ── */
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {project.sourcePdfName}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {project.sourcePdfSize
                          ? `${(project.sourcePdfSize / (1024 * 1024)).toFixed(1)} MB · `
                          : ''}
                        {fmtTimestamp(project.sourcePdfUploadedAt)}
                      </p>
                      {project.sourcePdfUploadedBy && (
                        <p className="text-xs text-text-secondary">
                          by {project.sourcePdfUploadedBy}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/projects/${project.projectId}/pdf`}
                      className="btn-primary text-sm w-full justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      View PDF
                    </Link>

                    {confirmDeletePdf ? (
                      <div className="flex flex-col items-center gap-2 py-2.5 px-3 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs text-text-secondary">Remove this PDF permanently?</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleDeletePdf}
                            disabled={isDeletingPdf}
                            className="text-xs font-semibold text-white bg-error hover:bg-red-700 disabled:opacity-60 px-3 py-1.5 rounded-md transition-colors"
                          >
                            {isDeletingPdf ? 'Deleting…' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setConfirmDeletePdf(false)}
                            disabled={isDeletingPdf}
                            className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleUploadClick}
                          disabled={isUploading || isDeletingPdf}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white text-primary font-semibold text-sm rounded-lg border border-primary hover:bg-primary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 shrink-0" />
                          )}
                          <span className="lg:hidden">{isUploading ? 'Uploading…' : 'Replace PDF'}</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeletePdf(true)}
                          disabled={isUploading || isDeletingPdf}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-error font-semibold text-sm rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span className="lg:hidden">Delete PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── No PDF ── */
                <div className="flex flex-col items-center text-center py-3 gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-text-secondary" />
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    No drawing PDF uploaded yet.
                  </p>
                  <button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="btn-primary text-sm w-full justify-center disabled:opacity-60"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        Upload PDF
                      </>
                    )}
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfSelect}
              />
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

      {showDelete && (
        <DeleteProjectModal
          projectName={project.projectName}
          isDeleting={isDeleting}
          onCancel={() => setShowDelete(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
