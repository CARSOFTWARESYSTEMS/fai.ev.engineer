import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { getProjectById } from '../projects/project.service'
import { getProjectPdfUrl } from '../projects/projectFile.service'
import { type FAIProject, fmtTimestamp } from '../projects/project.types'

export function ProjectPdfViewerPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { productConfig } = useProductConfig()

  const [project, setProject]   = useState<FAIProject | null>(null)
  const [pdfUrl,  setPdfUrl]    = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error,   setError]     = useState('')

  useEffect(() => {
    if (!projectId) return

    const load = async () => {
      setIsLoading(true)
      try {
        const p = await getProjectById(projectId)

        if (!p) {
          setError('Project not found or you do not have access.')
          return
        }
        if (p.uid !== user?.uid) {
          setError('You do not have access to this project.')
          return
        }
        if (p.pdfStatus !== 'uploaded' || !p.googleDriveFileId) {
          setError('No PDF has been uploaded for this project.')
          return
        }

        setProject(p)
        setPdfUrl(getProjectPdfUrl(p.googleDriveFileId))
      } catch {
        setError('Unable to load PDF. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [projectId, user?.uid])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-text-secondary">Loading PDF…</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !project || !pdfUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-error" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {error || 'Unable to load PDF'}
        </h1>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          Return to the project to upload or replace the drawing PDF.
        </p>
        <Link to={`/projects/${projectId}`} className="btn-primary">
          Back to Project
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-border shrink-0 h-14">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Left — nav + project info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/projects/${projectId}`}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Project
            </Link>
            <span className="text-border hidden sm:block">/</span>
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate leading-none">
                  {project.projectName}
                </p>
                <p className="text-[10px] text-text-secondary font-mono mt-0.5 truncate">
                  {project.drawingNumber} · Rev {project.drawingRevision}
                </p>
              </div>
            </div>
          </div>

          {/* Right — file name + product */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block text-right">
              <p className="text-xs font-medium text-text-primary truncate max-w-[200px]">
                {project.sourcePdfName}
              </p>
              <p className="text-[10px] text-text-secondary">
                Uploaded {fmtTimestamp(project.sourcePdfUploadedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="hidden sm:block text-sm font-bold text-text-primary">
                {productConfig.productName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* PDF iframe — fills remaining height */}
      <iframe
        src={pdfUrl}
        title={project.sourcePdfName ?? 'Drawing PDF'}
        className="flex-1 w-full border-0"
        style={{ height: 'calc(100vh - 56px)' }}
      />
    </div>
  )
}
