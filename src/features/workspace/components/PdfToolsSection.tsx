import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, ZoomOut, ZoomIn,
  AlignJustify, Maximize2, RotateCw, Download, Maximize, Minimize,
} from 'lucide-react'

interface PdfToolsSectionProps {
  isExpanded: boolean
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
}

function Btn({
  onClick, title, disabled, active, children,
}: {
  onClick: () => void
  title: string
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={[
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs w-full transition-colors',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        active
          ? 'bg-primary/20 text-primary-light'
          : 'text-gray-300 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function PdfToolsSection({
  isExpanded,
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
}: PdfToolsSectionProps) {
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

  if (!isExpanded) return null

  return (
    <div className="px-2 space-y-0.5">
      {/* Page navigation */}
      <div className="px-1 py-1">
        <div className="flex items-center gap-1 bg-white/[0.05] rounded-lg px-1 py-0.5 border border-white/[0.07]">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            title="Previous page"
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 flex-1 justify-center">
            <input
              type="number"
              value={pageInput}
              min={1}
              max={numPages}
              onChange={e => setPageInput(e.target.value)}
              onBlur={handlePageCommit}
              onKeyDown={e => e.key === 'Enter' && handlePageCommit()}
              title="Go to page"
              className="w-8 text-center bg-transparent text-white font-semibold text-sm rounded focus:bg-white/10 focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-500 text-xs">of</span>
            <span className="text-gray-300 font-medium text-sm tabular-nums">{numPages}</span>
          </div>
          <button
            onClick={onNextPage}
            disabled={numPages === 0 || currentPage >= numPages}
            title="Next page"
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1 px-1 py-1">
        <button onClick={onZoomOut} title="Zoom out" className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-300">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="flex-1 text-center text-xs text-gray-400 tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={onZoomIn} title="Zoom in" className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-300">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fit */}
      <div className="grid grid-cols-2 gap-0.5">
        <Btn onClick={onFitWidth} title="Fit width">
          <AlignJustify className="w-3.5 h-3.5 shrink-0" />
          <span>Fit Width</span>
        </Btn>
        <Btn onClick={onFitPage} title="Fit page">
          <Maximize2 className="w-3.5 h-3.5 shrink-0" />
          <span>Fit Page</span>
        </Btn>
      </div>

      {/* Other actions */}
      <Btn onClick={onRotate} title="Rotate clockwise">
        <RotateCw className="w-3.5 h-3.5 shrink-0" />
        <span>Rotate</span>
      </Btn>
      <Btn onClick={onDownload} title="Download PDF">
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Download</span>
      </Btn>
      <Btn onClick={onToggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} active={isFullscreen}>
        {isFullscreen
          ? <><Minimize className="w-3.5 h-3.5 shrink-0" /><span>Exit Fullscreen</span></>
          : <><Maximize className="w-3.5 h-3.5 shrink-0" /><span>Fullscreen</span></>
        }
      </Btn>
    </div>
  )
}
