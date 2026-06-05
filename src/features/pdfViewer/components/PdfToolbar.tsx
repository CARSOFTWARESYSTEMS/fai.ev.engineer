import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ZoomOut,
  ZoomIn,
  AlignJustify,
  Maximize2,
  RotateCw,
  Download,
  Maximize,
  Minimize,
} from 'lucide-react'

interface PdfToolbarProps {
  projectId: string
  projectName: string
  drawingNumber: string
  drawingRevision: string
  fileName: string
  productName: string
  scale: number
  currentPage: number
  numPages: number
  isFullscreen: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFitWidth: () => void
  onFitPage: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onRotate: () => void
  onDownload: () => void
  onToggleFullscreen: () => void
}

export function PdfToolbar({
  projectId,
  projectName,
  drawingNumber,
  drawingRevision,
  fileName,
  productName,
  scale,
  currentPage,
  numPages,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onPrevPage,
  onNextPage,
  onRotate,
  onDownload,
  onToggleFullscreen,
}: PdfToolbarProps) {
  const canPrev = currentPage > 1
  const canNext = numPages > 0 && currentPage < numPages

  return (
    <header className="bg-white border-b border-border shrink-0 h-14 z-10">
      <div className="h-full flex items-center justify-between gap-2 px-3 sm:px-4">

        {/* Left: navigation + project info */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-white border border-primary rounded-lg hover:bg-primary-light transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Dashboard</span>
          </Link>
          <span className="text-border hidden md:block select-none">|</span>
          <div className="hidden md:flex flex-col min-w-0 leading-tight">
            <p className="text-xs font-semibold text-text-primary truncate max-w-[180px]">{projectName}</p>
            <p className="text-[10px] text-text-secondary font-mono truncate">{drawingNumber} · Rev {drawingRevision}</p>
          </div>
        </div>

        {/* Center: PDF controls — scrollable on small screens */}
        <div className="flex items-center gap-0.5 overflow-x-auto">

          {/* Page navigation */}
          <button
            onClick={onPrevPage}
            disabled={!canPrev}
            title="Previous page"
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-xs text-text-secondary whitespace-nowrap px-1 min-w-[52px] text-center tabular-nums">
            {numPages > 0 ? `${currentPage} / ${numPages}` : '—'}
          </span>
          <button
            onClick={onNextPage}
            disabled={!canNext}
            title="Next page"
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>

          <span className="text-border mx-1 select-none">|</span>

          {/* Zoom */}
          <button onClick={onZoomOut} title="Zoom out" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ZoomOut className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-xs text-text-secondary whitespace-nowrap w-12 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={onZoomIn} title="Zoom in" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ZoomIn className="w-4 h-4 text-text-secondary" />
          </button>

          <span className="text-border mx-1 select-none hidden sm:block">|</span>

          {/* Fit controls */}
          <button
            onClick={onFitWidth}
            title="Fit width"
            className="hidden sm:flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <AlignJustify className="w-4 h-4 text-text-secondary" />
            <span className="hidden xl:inline text-xs text-text-secondary">Width</span>
          </button>
          <button
            onClick={onFitPage}
            title="Fit page"
            className="hidden sm:flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-text-secondary" />
            <span className="hidden xl:inline text-xs text-text-secondary">Page</span>
          </button>

          <span className="text-border mx-1 select-none hidden sm:block">|</span>

          {/* Rotate */}
          <button onClick={onRotate} title="Rotate clockwise" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <RotateCw className="w-4 h-4 text-text-secondary" />
          </button>

          {/* Download */}
          <button onClick={onDownload} title="Download PDF" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Download className="w-4 h-4 text-text-secondary" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isFullscreen
              ? <Minimize className="w-4 h-4 text-text-secondary" />
              : <Maximize className="w-4 h-4 text-text-secondary" />
            }
          </button>
        </div>

        {/* Right: file name + product logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:block text-right">
            <p className="text-[11px] font-medium text-text-primary truncate max-w-[160px]">{fileName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="hidden sm:block text-sm font-bold text-text-primary">{productName}</span>
          </div>
        </div>

      </div>
    </header>
  )
}
