import { FileText, Target, TableProperties, ClipboardList, Map, ChevronLeft, ChevronRight, X, Download } from 'lucide-react'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Feature } from '../../featureTable/types/featureTypes'
import { useWorkspaceSidebarPreferences } from '../hooks/useWorkspaceSidebarPreferences'
import { SidebarSection } from './SidebarSection'
import { ProjectSummaryCard } from './ProjectSummaryCard'
import { WorkspaceModeSelector } from './WorkspaceModeSelector'
import { PdfToolsSection } from './PdfToolsSection'
import { BalloonToolsSection } from './BalloonToolsSection'
import { FeatureToolsSection } from './FeatureToolsSection'
import { As9102Section } from './As9102Section'
import { NavigationSection } from './NavigationSection'
import { ExportSection } from './ExportSection'

interface WorkspaceSidebarProps {
  // Mobile
  isMobileOpen: boolean
  onMobileClose: () => void

  // PDF Tools
  scale: number
  currentPage: number
  numPages: number
  isFullscreen: boolean
  onPrevPage: () => void
  onNextPage: () => void
  onGoToPage: (page: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitWidth: () => void
  onFitPage: () => void
  onRotate: () => void
  onDownload: () => void
  onToggleFullscreen: () => void

  // Balloon Tools
  isBalloonMode: boolean
  hasSelectedBalloon: boolean
  balloonCount: number
  onToggleBalloonMode: () => void
  onDeleteSelectedBalloon: () => void

  // Feature Tools
  isTableOpen: boolean
  tableLayout: 'right' | 'bottom'
  isTableCollapsed: boolean
  featureCount: number
  onToggleTable: () => void
  onToggleTableLayout: () => void
  onToggleTableCollapse: () => void
  onEnsureTableOpenForAdd: () => void

  // Form 3
  isForm3Open: boolean
  onToggleForm3: () => void

  // Navigator
  balloons: Balloon[]
  features: Feature[]
  selectedBalloonId: string | null
  onSelectBalloon: (id: string) => void
  projectName: string
}

export function WorkspaceSidebar({
  isMobileOpen,
  onMobileClose,
  scale,
  currentPage,
  numPages,
  isFullscreen,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onRotate,
  onDownload,
  onToggleFullscreen,
  isBalloonMode,
  hasSelectedBalloon,
  balloonCount,
  onToggleBalloonMode,
  onDeleteSelectedBalloon,
  isTableOpen,
  tableLayout,
  isTableCollapsed,
  featureCount,
  onToggleTable,
  onToggleTableLayout,
  onToggleTableCollapse,
  onEnsureTableOpenForAdd,
  isForm3Open,
  onToggleForm3,
  balloons,
  features,
  selectedBalloonId,
  onSelectBalloon,
  projectName,
}: WorkspaceSidebarProps) {
  const {
    isExpanded,
    toggleExpanded,
    isSectionOpen,
    toggleSection,
    workspaceMode,
    setWorkspaceMode,
  } = useWorkspaceSidebarPreferences()

  const sidebarContent = (
    <div className={[
      'h-full flex flex-col bg-[#111827] border-r border-white/[0.08]',
      'transition-all duration-200 overflow-hidden',
      isExpanded ? 'w-72' : 'w-12',
    ].join(' ')}>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {/* Project Summary + Mode Selector — only when expanded */}
        {isExpanded && (
          <>
            <ProjectSummaryCard
              numPages={numPages}
              balloonCount={balloonCount}
              featureCount={featureCount}
            />
            <div className="mx-3 border-t border-white/[0.06] my-1" />
            <WorkspaceModeSelector mode={workspaceMode} onChange={setWorkspaceMode} />
            <div className="mx-3 border-t border-white/[0.06] mb-1" />
          </>
        )}

        {/* ── PDF VIEWER ──────────────────────────────────────────────────── */}
        <SidebarSection
          title="PDF Viewer"
          icon={FileText}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('pdf')}
          onToggle={() => toggleSection('pdf')}
        >
          <PdfToolsSection
            isExpanded={isExpanded}
            scale={scale}
            currentPage={currentPage}
            numPages={numPages}
            isFullscreen={isFullscreen}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
            onGoToPage={onGoToPage}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFitWidth={onFitWidth}
            onFitPage={onFitPage}
            onRotate={onRotate}
            onDownload={onDownload}
            onToggleFullscreen={onToggleFullscreen}
          />
        </SidebarSection>

        {/* ── BALLOONING ─────────────────────────────────────────────────── */}
        <SidebarSection
          title="Ballooning"
          icon={Target}
          count={balloonCount > 0 ? balloonCount : undefined}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('balloons')}
          onToggle={() => toggleSection('balloons')}
        >
          <BalloonToolsSection
            isExpanded={isExpanded}
            isBalloonMode={isBalloonMode}
            hasSelectedBalloon={hasSelectedBalloon}
            balloonCount={balloonCount}
            onToggleBalloonMode={onToggleBalloonMode}
            onDeleteSelectedBalloon={onDeleteSelectedBalloon}
          />
        </SidebarSection>

        {/* ── FEATURE TABLE ──────────────────────────────────────────────── */}
        <SidebarSection
          title="Feature Table"
          icon={TableProperties}
          count={featureCount > 0 ? featureCount : undefined}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('features')}
          onToggle={() => toggleSection('features')}
        >
          <FeatureToolsSection
            isExpanded={isExpanded}
            isTableOpen={isTableOpen}
            tableLayout={tableLayout}
            isTableCollapsed={isTableCollapsed}
            hasSelectedBalloon={hasSelectedBalloon}
            onToggleTable={onToggleTable}
            onToggleTableLayout={onToggleTableLayout}
            onToggleTableCollapse={onToggleTableCollapse}
            onEnsureTableOpenForAdd={onEnsureTableOpenForAdd}
          />
        </SidebarSection>

        {/* ── AS9102 ─────────────────────────────────────────────────────── */}
        <SidebarSection
          title="AS9102"
          icon={ClipboardList}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('form3')}
          onToggle={() => toggleSection('form3')}
        >
          <As9102Section
            isExpanded={isExpanded}
            isForm3Open={isForm3Open}
            onToggleForm3={onToggleForm3}
          />
        </SidebarSection>

        {/* ── NAVIGATOR ──────────────────────────────────────────────────── */}
        <SidebarSection
          title="Navigator"
          icon={Map}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('navigator')}
          onToggle={() => toggleSection('navigator')}
        >
          <NavigationSection
            isExpanded={isExpanded}
            numPages={numPages}
            currentPage={currentPage}
            onGoToPage={onGoToPage}
            balloons={balloons}
            selectedBalloonId={selectedBalloonId}
            onSelectBalloon={onSelectBalloon}
            features={features}
            projectName={projectName}
          />
        </SidebarSection>

        {/* ── EXPORT ─────────────────────────────────────────────────────── */}
        <SidebarSection
          title="Export"
          icon={Download}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('export')}
          onToggle={() => toggleSection('export')}
        >
          <ExportSection
            isExpanded={isExpanded}
            features={features}
            balloons={balloons}
            projectName={projectName}
            onExportBalloonedPdf={onDownload}
          />
        </SidebarSection>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>

      {/* ── Collapse/expand toggle ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.08] py-1">
        <button
          onClick={toggleExpanded}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={[
            'flex items-center justify-center p-2 rounded-lg hover:bg-white/[0.08] transition-colors',
            'text-gray-600 hover:text-gray-300 mx-1.5',
            isExpanded ? 'w-[calc(100%-12px)]' : 'w-[calc(100%-12px)]',
          ].join(' ')}
        >
          {isExpanded
            ? <ChevronLeft className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: always in-flow */}
      <div className="hidden lg:block h-full shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: fixed overlay drawer + backdrop */}
      <>
        <div
          className={[
            'fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-200',
            isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          ].join(' ')}
          onClick={onMobileClose}
        />
        <div
          className={[
            'fixed top-14 bottom-0 left-0 z-40 lg:hidden',
            'transition-transform duration-200 ease-in-out',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="relative h-full">
            {sidebarContent}
            {isMobileOpen && (
              <button
                onClick={onMobileClose}
                title="Close sidebar"
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] transition-colors text-gray-400 hover:text-white z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </>
    </>
  )
}
