import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
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
import { Form1Panel } from '../../as9102/components/Form1Panel'
import { Form2Panel } from '../../as9102/components/Form2Panel'
import { Form3Panel } from '../../as9102/components/Form3Panel'
import { useForm1 } from '../../as9102/hooks/useForm1'
import { useForm2 } from '../../as9102/hooks/useForm2'
import { useForm3Results } from '../../as9102/hooks/useForm3Results'
import { UndoToast } from '../../../components/ui/UndoToast'
import { BetaTestingBanner } from '../../../components/ui/BetaTestingBanner'
import { BetaWatermark } from '../../../components/ui/BetaWatermark'
import { WorkspaceSidebar } from '../../workspace/components/WorkspaceSidebar'
import { useWorkspaceSidebarPreferences } from '../../workspace/hooks/useWorkspaceSidebarPreferences'
import type { WorkspaceMode } from '../../workspace/types/workspaceTypes'
import { PdfToolbar } from './PdfToolbar'
import { PdfCanvas } from './PdfCanvas'
import { PdfLoadingState } from './PdfLoadingState'
import { PdfErrorState } from './PdfErrorState'
import { exportBalloonedPdf } from '../../export/services/balloonedPdfExportService'
import { FairPackageModal } from '../../export/components/FairPackageModal'

type PdfLoadPhase = 'project' | 'drive' | 'download'
type PdfLoadErrorAction = 'retry' | 'reconnect-drive'

const PROJECT_LOAD_TIMEOUT_MS = 15_000
const DRIVE_TOKEN_TIMEOUT_MS = 12_000
const PDF_DOWNLOAD_TIMEOUT_MS = 30_000
const BALLOON_MODE_KEY = 'fai-balloon-placement-enabled'

function devLog(message: string, details?: unknown) {
  if (!import.meta.env.DEV) return
  if (details === undefined) {
    console.info(`[PDF Viewer] ${message}`)
  } else {
    console.info(`[PDF Viewer] ${message}`, details)
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    promise.then(
      value => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      error => {
        window.clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

export function PdfViewerPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { productConfig } = useProductConfig()

  const [project, setProject] = useState<FAIProject | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadPhase, setLoadPhase] = useState<PdfLoadPhase>('project')
  const [error, setError] = useState('')
  const [errorAction, setErrorAction] = useState<PdfLoadErrorAction>('retry')
  const [pdfCanvas, setPdfCanvas] = useState<HTMLCanvasElement | null>(null)
  const [balloonFocusRequest, setBalloonFocusRequest] = useState(0)
  const loadRequestRef = useRef(0)
  const downloadAbortRef = useRef<AbortController | null>(null)

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
  const [isForm1Open, setIsForm1Open] = useState(false)
  const [isForm2Open, setIsForm2Open] = useState(false)
  const [isForm3Open, setIsForm3Open] = useState(false)
  const [isFairPackageOpen, setIsFairPackageOpen] = useState(false)
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
  const form1 = useForm1({ projectId: projectId ?? '' })
  const form2 = useForm2({ projectId: projectId ?? '' })
  const workspace = useWorkspaceSidebarPreferences()
  const didRestoreBalloonMode = useRef(false)
  const form3 = useForm3Results({
    projectId: projectId ?? '',
    userId: user?.uid ?? '',
    features: features.features,
    balloons: balloons.items,
  })
  const statusByFeatureId = useMemo(
    () => new Map(form3.rows.map(row => [row.featureId, row.status])),
    [form3.rows],
  )
  const statusByBalloonId = useMemo(
    () => new Map(form3.rows.filter(row => row.isLinked).map(row => [row.balloonId, row.status])),
    [form3.rows],
  )

  useEffect(() => {
    if (didRestoreBalloonMode.current) return
    didRestoreBalloonMode.current = true
    const shouldRestore =
      workspace.workspaceMode === 'ballooning' &&
      localStorage.getItem(BALLOON_MODE_KEY) === 'true'
    balloons.setBalloonMode(shouldRestore)
  }, [balloons.setBalloonMode, workspace.workspaceMode])

  useEffect(() => {
    if (workspace.workspaceMode !== 'ballooning' && balloons.isBalloonMode) {
      balloons.setBalloonMode(false)
    }
  }, [balloons.isBalloonMode, balloons.setBalloonMode, workspace.workspaceMode])

  const handleWorkspaceModeChange = useCallback((mode: WorkspaceMode) => {
    workspace.setWorkspaceMode(mode)
    balloons.setBalloonMode(mode === 'ballooning')
  }, [balloons.setBalloonMode, workspace.setWorkspaceMode])

  useEffect(() => {
    return () => {
      downloadAbortRef.current?.abort()
      setPdfBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  const loadPdf = useCallback(async (reconnectDrive = false) => {
    const requestId = loadRequestRef.current + 1
    let currentPhase: PdfLoadPhase = 'project'
    let downloadTimeoutId: number | null = null
    loadRequestRef.current = requestId
    downloadAbortRef.current?.abort()

    setIsLoading(true)
    setLoadPhase('project')
    setError('')
    setErrorAction('retry')
    setProject(null)
    setPdfBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })

    if (!projectId) {
      setError('The project URL is invalid.')
      setIsLoading(false)
      return
    }
    if (!user) {
      setError('Your account session is not ready. Please sign in again and retry.')
      setIsLoading(false)
      return
    }

    try {
      devLog('Loading project', projectId)
      const p = await withTimeout(
        getProjectById(projectId),
        PROJECT_LOAD_TIMEOUT_MS,
        'Project loading timed out.',
      )
      if (loadRequestRef.current !== requestId) return
      if (!p) { setError('Project not found or you do not have access.'); return }
      if (p.uid !== user.uid) { setError('You do not have access to this project.'); return }
      if (p.pdfStatus !== 'uploaded' || !p.googleDriveFileId) {
        setError('No PDF has been uploaded for this project. Upload a PDF from the project page first.')
        return
      }
      setProject(p)
      currentPhase = 'drive'
      setLoadPhase('drive')
      devLog('Requesting Google Drive access', { reconnectDrive })
      const token = await requestDriveToken(user.email ?? '', {
        prompt: reconnectDrive ? 'consent' : '',
        timeoutMs: DRIVE_TOKEN_TIMEOUT_MS,
      })
      if (loadRequestRef.current !== requestId) return

      currentPhase = 'download'
      setLoadPhase('download')
      const abortController = new AbortController()
      downloadAbortRef.current = abortController
      downloadTimeoutId = window.setTimeout(
        () => abortController.abort(),
        PDF_DOWNLOAD_TIMEOUT_MS,
      )
      devLog('Downloading PDF from Google Drive', p.googleDriveFileId)
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${p.googleDriveFileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal,
        },
      )
      window.clearTimeout(downloadTimeoutId)
      downloadTimeoutId = null
      if (loadRequestRef.current !== requestId) return
      if (!res.ok) throw new Error(`Drive download failed (${res.status})`)
      const blob = await res.blob()
      if (loadRequestRef.current !== requestId) return
      setPdfBlobUrl(URL.createObjectURL(blob))
      devLog('PDF ready', { bytes: blob.size })
    } catch (err) {
      if (loadRequestRef.current !== requestId) return
      const message = ((err as { message?: string })?.message ?? '').toLowerCase()
      const requiresDriveReconnect =
        currentPhase === 'drive' ||
        message.includes('authorization') ||
        message.includes('popup') ||
        message.includes('access_denied') ||
        message.includes('interaction') ||
        message.includes('drive download failed (401)') ||
        message.includes('drive download failed (403)')

      setErrorAction(requiresDriveReconnect ? 'reconnect-drive' : 'retry')
      setError(
        requiresDriveReconnect
          ? 'Google Drive access is required to open this PDF. Reconnect Google Drive and try again.'
          : message.includes('aborted')
            ? 'PDF download timed out. Check your connection and retry loading the PDF.'
            : message.includes('project loading timed out')
              ? 'Project loading timed out. Check your connection and retry loading the PDF.'
              : message.includes('drive download failed (404)')
                ? 'The PDF file is no longer available in Google Drive. Return to the project and upload it again.'
                : message.includes('drive download failed')
                  ? 'Google Drive could not download the PDF. Retry loading the PDF.'
                  : getPdfErrorMessage(err),
      )
      devLog('PDF load failed', err)
    } finally {
      if (loadRequestRef.current === requestId) {
        if (downloadTimeoutId !== null) window.clearTimeout(downloadTimeoutId)
        downloadAbortRef.current = null
        setIsLoading(false)
      }
    }
  }, [projectId, user])

  useEffect(() => {
    void loadPdf()
  // loadPdf intentionally owns the complete route-load transaction.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user?.uid, user?.email])

  const handleDownload = useCallback(async () => {
    if (!pdfBlobUrl || !project) return
    try {
      await exportBalloonedPdf(
        pdfBlobUrl,
        project.sourcePdfName || 'drawing.pdf',
        balloons.items,
        statusByBalloonId,
      )
    } catch (err) {
      window.alert(`Unable to export ballooned PDF. ${getPdfErrorMessage(err)}`)
    }
  }, [pdfBlobUrl, project, balloons.items, statusByBalloonId])

  const { setNumPages, setCurrentPage, setPageNaturalSize } = viewer

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(viewer.numPages, page)))
  }, [setCurrentPage, viewer.numPages])

  const handleSelectLinkedBalloon = useCallback((balloonId: string) => {
    const balloon = balloons.items.find(item => item.id === balloonId)
    if (!balloon) return
    setCurrentPage(balloon.pageNumber)
    balloons.setSelectedId(balloon.id)
    setBalloonFocusRequest(request => request + 1)
  }, [balloons.items, balloons.setSelectedId, setCurrentPage])

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

  // P8: Clear balloon selection when navigating to a page where the selected balloon does not live
  useEffect(() => {
    if (!balloons.selectedId) return
    const selected = balloons.items.find(b => b.id === balloons.selectedId)
    if (selected && selected.pageNumber !== viewer.currentPage) {
      balloons.setSelectedId(null)
    }
  // We only want to run this when the page changes, not on every balloon list update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer.currentPage])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    const loadingMessage = loadPhase === 'project'
      ? 'Loading project…'
      : loadPhase === 'drive'
        ? 'Connecting to Google Drive…'
        : 'Downloading PDF…'
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        <PdfLoadingState message={loadingMessage} />
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
            actionLabel={errorAction === 'reconnect-drive'
              ? 'Reconnect Google Drive'
              : 'Retry loading PDF'}
            onAction={() => void loadPdf(errorAction === 'reconnect-drive')}
          />
        </div>
      </div>
    )
  }

  // ── Viewer ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-900" ref={viewer.containerRef}>
      <BetaWatermark pageVariant="dark" />
      <PdfToolbar
        projectId={project.projectId}
        projectName={project.projectName}
        drawingNumber={project.drawingNumber}
        drawingRevision={project.drawingRevision}
        productName={productConfig.productName}
        currentPage={viewer.currentPage}
        numPages={viewer.numPages}
        isMobileSidebarOpen={isMobileSidebarOpen}
        workspaceMode={workspace.workspaceMode}
        isBalloonMode={balloons.isBalloonMode}
        onPrevPage={viewer.prevPage}
        onNextPage={viewer.nextPage}
        onGoToPage={goToPage}
        onToggleSidebar={() => setIsMobileSidebarOpen(o => !o)}
        onWorkspaceModeChange={handleWorkspaceModeChange}
      />
      <BetaTestingBanner variant="dark" />

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
          balloonCount={balloons.items.length}
          onToggleBalloonMode={balloons.toggleBalloonMode}
          onDeleteSelectedBalloon={balloons.deleteSelected}
          deleteError={balloons.deleteError}
          onClearDeleteError={balloons.clearDeleteError}
          statusByBalloonId={statusByBalloonId}
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
          isForm1Open={isForm1Open}
          isForm2Open={isForm2Open}
          isForm3Open={isForm3Open}
          onToggleForm1={() => setIsForm1Open(o => !o)}
          onToggleForm2={() => setIsForm2Open(o => !o)}
          onToggleForm3={() => setIsForm3Open(o => !o)}
          balloons={balloons.items}
          features={features.features}
          selectedBalloonId={balloons.selectedId}
          onSelectBalloon={handleSelectLinkedBalloon}
          projectName={project.projectName}
          form1Data={form1.data}
          form2Rows={form2.rows}
          form3Rows={form3.rows}
          onOpenFairPackage={() => setIsFairPackageOpen(true)}
          isExpanded={workspace.isExpanded}
          onToggleExpanded={workspace.toggleExpanded}
          isSectionOpen={workspace.isSectionOpen}
          onToggleSection={workspace.toggleSection}
          workspaceMode={workspace.workspaceMode}
        />

        {/* PDF + feature table */}
        <div className={`flex-1 overflow-hidden flex flex-col${tableLayout === 'right' ? ' lg:flex-row' : ''}`}>

          {/* PDF area */}
          <div className="flex-1 overflow-auto min-h-0" ref={viewer.scrollAreaRef}>
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
                  balloons={balloons.items}
                  currentPage={viewer.currentPage}
                  rotation={viewer.rotation}
                  pdfCanvas={pdfCanvas}
                  statusByBalloonId={statusByBalloonId}
                  focusRequest={balloonFocusRequest}
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
                  balloons={balloons.items}
                  selectedBalloonId={balloons.selectedId}
                  projectId={project.projectId}
                  userId={user?.uid ?? ''}
                  onAddFeature={features.addFeature}
                  onUpdateFeature={features.updateFeature}
                  onDeleteFeature={features.deleteFeature}
                  onSelectBalloon={handleSelectLinkedBalloon}
                  statusByFeatureId={statusByFeatureId}
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

      {/* AS9102 Form 1 — full-screen overlay */}
      {isForm1Open && (
        <Form1Panel
          data={form1.data}
          isLoaded={form1.isLoaded}
          saveStatus={form1.saveStatus}
          onUpdate={form1.updateField}
          onClose={() => setIsForm1Open(false)}
        />
      )}

      {/* AS9102 Form 2 — full-screen overlay */}
      {isForm2Open && (
        <Form2Panel
          rows={form2.rows}
          isLoaded={form2.isLoaded}
          saveStatus={form2.saveStatus}
          pendingDeleteLabel={form2.pendingDeleteLabel}
          onAddRow={form2.addRow}
          onUpdateRow={form2.updateRow}
          onDeleteRow={form2.deleteRow}
          onUndoDelete={form2.undoRowDelete}
          onDismissDeleteToast={form2.dismissRowDeleteToast}
          onClose={() => setIsForm2Open(false)}
        />
      )}

      {/* AS9102 Form 3 — full-screen overlay */}
      {isForm3Open && (
        <Form3Panel
          projectName={project.projectName}
          drawingNumber={project.drawingNumber}
          drawingRevision={project.drawingRevision}
          rows={form3.rows}
          isLoaded={form3.isLoaded}
          saveStatus={form3.saveStatus}
          selectedBalloonId={balloons.selectedId}
          onSelectBalloon={handleSelectLinkedBalloon}
          onUpdate={form3.updateRow}
          onClose={() => setIsForm3Open(false)}
        />
      )}

      {/* FAIR Package export modal */}
      {isFairPackageOpen && pdfBlobUrl && (
        <FairPackageModal
          input={{
            form1: form1.data,
            form2Rows: form2.rows,
            form3Rows: form3.rows,
            features: features.features,
            balloons: balloons.items,
            statusByBalloonId,
            pdfBlobUrl,
            sourcePdfName: project.sourcePdfName || 'drawing.pdf',
          }}
          onClose={() => setIsFairPackageOpen(false)}
        />
      )}

      {/* Undo toasts — bottom-center, stacked */}
      {(balloons.pendingDeleteLabel || features.pendingDeleteLabel) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
          {balloons.pendingDeleteLabel && (
            <div className="pointer-events-auto">
              <UndoToast
                message={`${balloons.pendingDeleteLabel} deleted`}
                onUndo={balloons.undoBalloonDelete}
                onDismiss={balloons.dismissBalloonDeleteToast}
              />
            </div>
          )}
          {features.pendingDeleteLabel && (
            <div className="pointer-events-auto">
              <UndoToast
                message={`${features.pendingDeleteLabel} deleted`}
                onUndo={features.undoFeatureDelete}
                onDismiss={features.dismissFeatureDeleteToast}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
