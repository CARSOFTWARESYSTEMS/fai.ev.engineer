import { FileText, Target, TableProperties, ClipboardList, Map, ChevronLeft, ChevronRight, X, Download } from 'lucide-react'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Feature } from '../../featureTable/types/featureTypes'
import { SidebarSection } from './SidebarSection'
import { ProjectSummaryCard } from './ProjectSummaryCard'
import { PdfToolsSection } from './PdfToolsSection'
import { BalloonToolsSection } from './BalloonToolsSection'
import { FeatureToolsSection } from './FeatureToolsSection'
import { As9102Section } from './As9102Section'
import { NavigationSection } from './NavigationSection'
import { ExportSection } from './ExportSection'
import { MODE_VISIBLE_SECTIONS, type SidebarSectionId, type WorkspaceMode } from '../types/workspaceTypes'
import type { Form3Row } from '../../as9102/types/form3Types'

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
  form3Rows: Form3Row[]

  // Workspace navigation
  isExpanded: boolean
  onToggleExpanded: () => void
  isSectionOpen: (section: SidebarSectionId) => boolean
  onToggleSection: (section: SidebarSectionId) => void
  workspaceMode: WorkspaceMode
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
  form3Rows,
  isExpanded,
  onToggleExpanded,
  isSectionOpen,
  onToggleSection,
  workspaceMode,
}: WorkspaceSidebarProps) {
  const visibleSections = MODE_VISIBLE_SECTIONS[workspaceMode]
  const isSectionVisible = (section: SidebarSectionId) => visibleSections.includes(section)
  const activateCollapsedSection = (section: SidebarSectionId) => {
    if (!isSectionOpen(section)) onToggleSection(section)
    onToggleExpanded()
  }

  const sidebarContent = (
    <div className={[
      'h-full flex flex-col bg-[#111827] border-r border-white/[0.08]',
      'transition-all duration-200 overflow-hidden',
      isExpanded ? 'w-72' : 'w-12',
    ].join(' ')}>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {/* Project summary — workflow navigation lives in the top header */}
        {isExpanded && (
          <>
            <ProjectSummaryCard
              numPages={numPages}
              balloonCount={balloonCount}
              featureCount={featureCount}
            />
            <div className="mx-3 border-t border-white/[0.06] mb-1" />
          </>
        )}

        {/* ── PDF VIEWER ──────────────────────────────────────────────────── */}
        {isSectionVisible('pdf') && <SidebarSection
          title="PDF Viewer"
          icon={FileText}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('pdf')}
          onToggle={() => onToggleSection('pdf')}
          onCollapsedActivate={() => activateCollapsedSection('pdf')}
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
            onToggleFullscreen={onToggleFullscreen}
          />
        </SidebarSection>}

        {/* ── BALLOONING ─────────────────────────────────────────────────── */}
        {isSectionVisible('balloons') && <SidebarSection
          title="Ballooning"
          icon={Target}
          count={balloonCount > 0 ? balloonCount : undefined}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('balloons')}
          onToggle={() => onToggleSection('balloons')}
          onCollapsedActivate={() => activateCollapsedSection('balloons')}
        >
          <BalloonToolsSection
            isExpanded={isExpanded}
            isWorkflowBallooning={workspaceMode === 'ballooning'}
            isBalloonMode={isBalloonMode}
            hasSelectedBalloon={hasSelectedBalloon}
            balloonCount={balloonCount}
            onToggleBalloonMode={() => {
              if (workspaceMode === 'ballooning') onToggleBalloonMode()
            }}
            onDeleteSelectedBalloon={onDeleteSelectedBalloon}
          />
        </SidebarSection>}

        {/* ── FEATURE TABLE ──────────────────────────────────────────────── */}
        {isSectionVisible('features') && <SidebarSection
          title="Feature Table"
          icon={TableProperties}
          count={featureCount > 0 ? featureCount : undefined}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('features')}
          onToggle={() => onToggleSection('features')}
          onCollapsedActivate={() => activateCollapsedSection('features')}
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
        </SidebarSection>}

        {/* ── AS9102 ─────────────────────────────────────────────────────── */}
        {isSectionVisible('form3') && <SidebarSection
          title="AS9102"
          icon={ClipboardList}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('form3')}
          onToggle={() => onToggleSection('form3')}
          onCollapsedActivate={() => activateCollapsedSection('form3')}
        >
          <As9102Section
            isExpanded={isExpanded}
            isForm3Open={isForm3Open}
            onToggleForm3={onToggleForm3}
            features={features}
          />
        </SidebarSection>}

        {/* ── NAVIGATOR ──────────────────────────────────────────────────── */}
        {isSectionVisible('navigator') && <SidebarSection
          title="Navigator"
          icon={Map}
          isExpanded={isExpanded}
          isOpen={isSectionOpen('navigator')}
          onToggle={() => onToggleSection('navigator')}
          onCollapsedActivate={() => activateCollapsedSection('navigator')}
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
            workspaceMode={workspaceMode}
          />
        </SidebarSection>}

        {/* ── EXPORT ───────────────────────────────────────────────────────── */}
        {isSectionVisible('export') && (
          <SidebarSection
            title={workspaceMode === 'export' ? 'Export Deliverables' : 'Export'}
            icon={Download}
            isExpanded={isExpanded}
            isOpen={isSectionOpen('export')}
            onToggle={() => onToggleSection('export')}
            onCollapsedActivate={() => activateCollapsedSection('export')}
          >
            <ExportSection
              isExpanded={isExpanded}
              features={features}
              balloons={balloons}
              form3Rows={form3Rows}
              projectName={projectName}
              onExportBalloonedPdf={onDownload}
            />
          </SidebarSection>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>

      {/* ── Collapse/expand toggle ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.08] py-1">
        <button
          onClick={onToggleExpanded}
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
