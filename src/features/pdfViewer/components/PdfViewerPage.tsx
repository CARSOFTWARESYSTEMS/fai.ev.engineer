import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useProductConfig } from '../../../config/hooks/useProductConfig'
import { getProjectById } from '../../../projects/project.service'
import { getPdfErrorMessage } from '../../../projects/projectFile.service'
import { requestDriveToken } from '../../../lib/googleDrive'
import type { FAIProject } from '../../../projects/project.types'
import type { PageNaturalSize } from '../types/pdfViewerTypes'
import { usePdfViewer } from '../hooks/usePdfViewer'
import { PdfToolbar } from './PdfToolbar'
import { PdfCanvas } from './PdfCanvas'
import { PdfLoadingState } from './PdfLoadingState'
import { PdfErrorState } from './PdfErrorState'

export function PdfViewerPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { productConfig } = useProductConfig()

  const [project, setProject] = useState<FAIProject | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const viewer = usePdfViewer()

  // Revoke blob URL on unmount to free memory
  useEffect(() => {
    return () => {
      setPdfBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  const loadPdf = useCallback(async () => {
    if (!projectId || !user) return
    setIsLoading(true)
    setError('')

    // Revoke any previous blob URL before fetching new one
    setPdfBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })

    try {
      const p = await getProjectById(projectId)
      if (!p) {
        setError('Project not found or you do not have access.')
        return
      }
      if (p.uid !== user.uid) {
        setError('You do not have access to this project.')
        return
      }
      if (p.pdfStatus !== 'uploaded' || !p.googleDriveFileId) {
        setError('No PDF has been uploaded for this project. Upload a PDF from the project page first.')
        return
      }
      setProject(p)

      // Fetch PDF binary from Google Drive using authenticated API
      const token = await requestDriveToken(user.email ?? '')
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${p.googleDriveFileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error(`Drive download failed (${res.status})`)

      const blob = await res.blob()
      setPdfBlobUrl(URL.createObjectURL(blob))
    } catch (err) {
      setError(getPdfErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [projectId, user?.uid, user?.email])

  useEffect(() => {
    loadPdf()
  }, [loadPdf])

  const handleDownload = useCallback(() => {
    if (!pdfBlobUrl || !project) return
    const a = document.createElement('a')
    a.href = pdfBlobUrl
    a.download = project.sourcePdfName || 'drawing.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [pdfBlobUrl, project])

  const { setNumPages, setCurrentPage, setPageNaturalSize } = viewer

  const handleDocumentLoad = useCallback((numPages: number) => {
    setNumPages(numPages)
    setCurrentPage(1)
  }, [setNumPages, setCurrentPage])

  const handlePageLoad = useCallback((size: PageNaturalSize) => {
    setPageNaturalSize(size)
  }, [setPageNaturalSize])

  const handleDocumentError = useCallback((_err: Error) => {
    setError('PDF could not be rendered. The file may be corrupted or an unsupported format.')
  }, [])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        <PdfLoadingState />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !project || !pdfBlobUrl) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="bg-white border-b border-border h-14 flex items-center px-4 gap-3 shrink-0">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Project
          </Link>
        </header>
        <div className="flex-1">
          <PdfErrorState
            projectId={projectId ?? ''}
            message={error || 'Unable to load PDF.'}
            onRetry={loadPdf}
          />
        </div>
      </div>
    )
  }

  // ── Viewer ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-900" ref={viewer.containerRef}>
      <PdfToolbar
        projectId={project.projectId}
        projectName={project.projectName}
        drawingNumber={project.drawingNumber}
        drawingRevision={project.drawingRevision}
        fileName={project.sourcePdfName ?? ''}
        productName={productConfig.productName}
        scale={viewer.scale}
        currentPage={viewer.currentPage}
        numPages={viewer.numPages}
        isFullscreen={viewer.isFullscreen}
        onZoomIn={viewer.zoomIn}
        onZoomOut={viewer.zoomOut}
        onFitWidth={viewer.fitWidth}
        onFitPage={viewer.fitPage}
        onPrevPage={viewer.prevPage}
        onNextPage={viewer.nextPage}
        onRotate={viewer.rotateClockwise}
        onDownload={handleDownload}
        onToggleFullscreen={viewer.toggleFullscreen}
      />
      <div className="flex-1 overflow-auto">
        <PdfCanvas
          pdfBlobUrl={pdfBlobUrl}
          currentPage={viewer.currentPage}
          scale={viewer.scale}
          rotation={viewer.rotation}
          onDocumentLoad={handleDocumentLoad}
          onPageLoad={handlePageLoad}
          onDocumentError={handleDocumentError}
        />
      </div>
    </div>
  )
}
