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
import { useBalloons } from '../../ballooning/hooks/useBalloons'
import { BalloonLayer } from '../../ballooning/components/BalloonLayer'
import { useFeatures } from '../../featureTable/hooks/useFeatures'
import { FeatureTablePanel } from '../../featureTable/components/FeatureTablePanel'
import { Form3Panel } from '../../as9102/components/Form3Panel'
import { WorkspaceSidebar } from '../../workspace/components/WorkspaceSidebar'
import { PdfToolbar } from './PdfToolbar'
import { PdfCanvas } from './PdfCanvas'
import { PdfLoadingState } from './PdfLoadingState'
import { PdfErrorState } from './PdfErrorState'
import { exportBalloonedPdf } from '../../export/services/balloonedPdfExportService'

export function PdfViewerPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { productConfig } = useProductConfig()

  const [project, setProject] = useState<FAIProject | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfCanvas, setPdfCanvas] = useState<HTMLCanvasElement | null>(null)

  const [isTableOpen, setIsTableOpen] = useState<boolean>(() =>
    localStorage.getItem('fai-feature-table-open') === 'true'
  )
  const [tableLayout, setTableLayout] = useState<'right' | 'bottom'>(() => {
    const saved = localStorage.getItem('fai-feature-table-layout')
    return saved === 'bottom' ? 'bottom' : 'right'
  })
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() =>
    localStorage.getItem('fai-feature-table-collapsed') === 'true'
  )
  const [isForm3Open, setIsForm3Open] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const [bottomHeight, setBottomHeight] = useState<number>(() => {
    const saved = localStorage.getItem('fai-panel-bottom-height')
    return saved ? parseInt(saved) : Math.round(window.innerHeight / 3)
  })
  const [rightWidth, setRightWidth] = useState<number>(() => {
    const saved = localStorage.getItem('fai-panel-right-width')
    return saved ? parseInt(saved) : 600
  })

  const toggleTableLayout = useCallback(() => {
    setTableLayout(prev => {
      const next = prev === 'right' ? 'bottom' : 'right'
      localStorage.setItem('fai-feature-table-layout', next)
      return next
    })
  }, [])

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('fai-feature-table-collapsed', String(next))
      return next
    })
  }, [])

  const handleResizeBottom = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = bottomHeight
    let h = startH
    const onMove = (ev: PointerEvent) => {
      h = Math.max(150, Math.min(Math.round(window.innerHeight * 0.75), startH + startY - ev.clientY))
      setBottomHeight(h)
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      localStorage.setItem('fai-panel-bottom-height', String(h))
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [bottomHeight])

  const handleResizeRight = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = rightWidth
    let w = startW
    const onMove = (ev: PointerEvent) => {
      w = Math.max(320, Math.min(Math.round(window.innerWidth * 0.65), startW + startX - ev.clientX))
      setRightWidth(w)
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      localStorage.setItem('fai-panel-right-width', String(w))
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [rightWidth])

  const viewer = usePdfViewer()
  const balloons = useBalloons({ projectId: projectId ?? '', userId: user?.uid ?? '' })
  const features = useFeatures({ projectId: projectId ?? '', userId: user?.uid ?? '' })

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
    setPdfBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    try {
      const p = await getProjectById(projectId)
      if (!p) { setError('Project not found or you do not have access.'); return }
      if (p.uid !== user.uid) { setError('You do not have access to this project.'); return }
      if (p.pdfStatus !== 'uploaded' || !p.googleDriveFileId) {
        setError('No PDF has been uploaded for this project. Upload a PDF from the project page first.')
        return
      }
      setProject(p)
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

  useEffect(() => { loadPdf() }, [loadPdf])

  const handleDownload = useCallback(async () => {
    if (!pdfBlobUrl || !project) return
    try {
      await exportBalloonedPdf(
        pdfBlobUrl,
        project.sourcePdfName || 'drawing.pdf',
        balloons.balloons,
      )
    } catch (err) {
      window.alert(`Unable to export ballooned PDF. ${getPdfErrorMessage(err)}`)
    }
  }, [pdfBlobUrl, project, balloons.balloons])

  const { setNumPages, setCurrentPage, setPageNaturalSize } = viewer

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(viewer.numPages, page)))
  }, [setCurrentPage, viewer.numPages])

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

  const handleEnsureTableOpenForAdd = useCallback(() => {
    setIsTableOpen(prev => {
      if (!prev) localStorage.setItem('fai-feature-table-open', 'true')
      return true
    })
  }, [])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        <PdfLoadingState />
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
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

  // ── Viewer ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-900" ref={viewer.containerRef}>
      <PdfToolbar
        projectId={project.projectId}
        projectName={project.projectName}
        drawingNumber={project.drawingNumber}
        drawingRevision={project.drawingRevision}
        productName={productConfig.productName}
        currentPage={viewer.currentPage}
        numPages={viewer.numPages}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onPrevPage={viewer.prevPage}
        onNextPage={viewer.nextPage}
        onGoToPage={goToPage}
        onToggleSidebar={() => setIsMobileSidebarOpen(o => !o)}
      />

      {/* Main area: sidebar + content */}
      <div className="flex-1 overflow-hidden flex flex-row">

        {/* Left sidebar */}
        <WorkspaceSidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          scale={viewer.scale}
          currentPage={viewer.currentPage}
          numPages={viewer.numPages}
          isFullscreen={viewer.isFullscreen}
          onPrevPage={viewer.prevPage}
          onNextPage={viewer.nextPage}
          onGoToPage={goToPage}
          onZoomIn={viewer.zoomIn}
          onZoomOut={viewer.zoomOut}
          onFitWidth={viewer.fitWidth}
          onFitPage={viewer.fitPage}
          onRotate={viewer.rotateClockwise}
          onDownload={handleDownload}
          onToggleFullscreen={viewer.toggleFullscreen}
          isBalloonMode={balloons.isBalloonMode}
          hasSelectedBalloon={!!balloons.selectedId}
          balloonCount={balloons.balloons.length}
          onToggleBalloonMode={balloons.toggleBalloonMode}
          onDeleteSelectedBalloon={balloons.deleteSelected}
          isTableOpen={isTableOpen}
          tableLayout={tableLayout}
          isTableCollapsed={isCollapsed}
          featureCount={features.features.length}
          onToggleTable={() => {
            setIsTableOpen(o => {
              const next = !o
              localStorage.setItem('fai-feature-table-open', String(next))
              return next
            })
          }}
          onToggleTableLayout={toggleTableLayout}
          onToggleTableCollapse={toggleCollapsed}
          onEnsureTableOpenForAdd={handleEnsureTableOpenForAdd}
          isForm3Open={isForm3Open}
          onToggleForm3={() => setIsForm3Open(o => !o)}
          balloons={balloons.balloons}
          features={features.features}
          selectedBalloonId={balloons.selectedId}
          onSelectBalloon={balloons.setSelectedId}
          projectName={project.projectName}
        />

        {/* PDF + feature table */}
        <div className={`flex-1 overflow-hidden flex flex-col${tableLayout === 'right' ? ' lg:flex-row' : ''}`}>

          {/* PDF area */}
          <div className="flex-1 overflow-auto min-h-0">
            <PdfCanvas
              pdfBlobUrl={pdfBlobUrl}
              currentPage={viewer.currentPage}
              scale={viewer.scale}
              rotation={viewer.rotation}
              onDocumentLoad={handleDocumentLoad}
              onPageLoad={handlePageLoad}
              onDocumentError={handleDocumentError}
              canvasRef={setPdfCanvas}
              overlay={
                <BalloonLayer
                  balloons={balloons.balloons}
                  currentPage={viewer.currentPage}
                  rotation={viewer.rotation}
                  pdfCanvas={pdfCanvas}
                  isBalloonMode={balloons.isBalloonMode}
                  selectedId={balloons.selectedId}
                  onSelect={balloons.setSelectedId}
                  onAddBalloon={(xPercent, yPercent) =>
                    balloons.addBalloon(viewer.currentPage, xPercent, yPercent)
                  }
                  onMoveBalloon={balloons.moveBalloon}
                />
              }
            />
          </div>

          {/* Feature Table panel */}
          {isTableOpen && (
            <div
              style={{
                ...(tableLayout === 'right' && { width: isCollapsed ? 220 : rightWidth }),
                ...(tableLayout === 'bottom' && !isCollapsed && { height: bottomHeight }),
              }}
              className={[
                'bg-white flex-shrink-0 max-w-full border-border',
                tableLayout === 'right'
                  ? `flex flex-row ${isCollapsed ? '' : 'h-[33vh]'} lg:h-auto border-t lg:border-t-0 lg:border-l`
                  : 'flex flex-col border-t',
              ].join(' ')}
            >
              {!isCollapsed && (
                tableLayout === 'right' ? (
                  <div
                    onPointerDown={handleResizeRight}
                    title="Drag to resize panel"
                    className="hidden lg:flex w-1.5 cursor-ew-resize shrink-0 items-center justify-center hover:bg-primary/10 active:bg-primary/20 transition-colors group touch-none"
                  >
                    <div className="h-8 w-0.5 rounded-full bg-gray-300 group-hover:bg-primary/60" />
                  </div>
                ) : (
                  <div
                    onPointerDown={handleResizeBottom}
                    title="Drag to resize panel"
                    className="h-3 cursor-ns-resize shrink-0 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors group border-b border-border touch-none"
                  >
                    <div className="w-8 h-1 rounded-full bg-gray-300 group-hover:bg-gray-500" />
                  </div>
                )
              )}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 min-w-0">
                <FeatureTablePanel
                  features={features.features}
                  balloons={balloons.balloons}
                  selectedBalloonId={balloons.selectedId}
                  projectId={project.projectId}
                  userId={user?.uid ?? ''}
                  onAddFeature={features.addFeature}
                  onUpdateFeature={features.updateFeature}
                  onDeleteFeature={features.deleteFeature}
                  onSelectBalloon={balloons.setSelectedId}
                  tableLayout={tableLayout}
                  onToggleLayout={toggleTableLayout}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={toggleCollapsed}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AS9102 Form 3 — full-screen overlay */}
      {isForm3Open && (
        <Form3Panel
          projectId={project.projectId}
          projectName={project.projectName}
          drawingNumber={project.drawingNumber}
          drawingRevision={project.drawingRevision}
          userId={user?.uid ?? ''}
          features={features.features}
          balloons={balloons.balloons}
          onClose={() => setIsForm3Open(false)}
        />
      )}
    </div>
  )
}
