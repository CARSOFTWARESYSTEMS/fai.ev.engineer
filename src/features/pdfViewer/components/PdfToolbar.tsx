import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, LayoutDashboard, ChevronLeft, ChevronRight, PanelLeft } from 'lucide-react'
import { WorkspaceModeSelector } from '../../workspace/components/WorkspaceModeSelector'
import type { WorkspaceMode } from '../../workspace/types/workspaceTypes'

interface PdfToolbarProps {
  projectId: string
  projectName: string
  drawingNumber: string
  drawingRevision: string
  productName: string
  currentPage: number
  numPages: number
  isMobileSidebarOpen: boolean
  workspaceMode: WorkspaceMode
  isBalloonMode: boolean
  onPrevPage: () => void
  onNextPage: () => void
  onGoToPage: (page: number) => void
  onToggleSidebar: () => void
  onWorkspaceModeChange: (mode: WorkspaceMode) => void
}

export function PdfToolbar({
  projectId,
  projectName,
  drawingNumber,
  drawingRevision,
  productName,
  currentPage,
  numPages,
  isMobileSidebarOpen,
  workspaceMode,
  isBalloonMode,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onToggleSidebar,
  onWorkspaceModeChange,
}: PdfToolbarProps) {
  const canPrev = currentPage > 1
  const canNext = numPages > 0 && currentPage < numPages

  const [pageInput, setPageInput] = useState(String(currentPage))
  useEffect(() => { setPageInput(String(currentPage)) }, [currentPage])

  const handlePageCommit = () => {
    const n = parseInt(pageInput, 10)
    if (!isNaN(n) && n >= 1 && n <= numPages) {
      onGoToPage(n)
    } else {
      setPageInput(String(currentPage))
    }
  }

  return (
    <header className="h-14 shrink-0 border-b border-white/[0.08] bg-[#0f172a] shadow-sm z-10">
      <div className="h-full flex items-center gap-2 px-2 sm:px-3">

        {/* Left: back, dashboard, project info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-200 bg-primary/15 border border-primary/50 rounded-lg hover:bg-primary/25 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-300 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Dashboard</span>
          </Link>
          <span className="text-white/15 hidden md:block select-none">|</span>
          <div className="hidden md:flex flex-col min-w-0 leading-tight">
            <p className="text-xs font-semibold text-white truncate max-w-[180px]">{projectName}</p>
            <p className="text-[10px] text-gray-500 font-mono truncate">{drawingNumber} · Rev {drawingRevision}</p>
          </div>
        </div>

        {/* Center: workflow */}
        <WorkspaceModeSelector
          mode={workspaceMode}
          isBalloonMode={isBalloonMode}
          onChange={onWorkspaceModeChange}
        />

        {/* Right: page navigation, sidebar toggle, brand */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={onPrevPage}
              disabled={!canPrev}
              title="Previous page"
              className="p-2 rounded-lg hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
            {numPages > 0 ? (
              <div className="flex items-center gap-0.5 text-xs text-gray-400">
                <input
                  type="number"
                  value={pageInput}
                  min={1}
                  max={numPages}
                  onChange={e => setPageInput(e.target.value)}
                  onBlur={handlePageCommit}
                  onKeyDown={e => e.key === 'Enter' && handlePageCommit()}
                  title="Go to page"
                  className="w-7 text-center text-gray-200 bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="whitespace-nowrap">/ {numPages}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 px-1">—</span>
            )}
            <button
              onClick={onNextPage}
              disabled={!canNext}
              title="Next page"
              className="p-2 rounded-lg hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
          <button
            onClick={onToggleSidebar}
            title={isMobileSidebarOpen ? 'Close tools sidebar' : 'Open tools sidebar'}
            className={[
              'lg:hidden p-2 rounded-lg transition-colors',
              isMobileSidebarOpen
                ? 'bg-primary/20 text-blue-200'
                : 'hover:bg-white/[0.08] text-gray-300',
            ].join(' ')}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="hidden 2xl:block text-sm font-bold text-white">{productName}</span>
          </div>
        </div>

      </div>
    </header>
  )
}
