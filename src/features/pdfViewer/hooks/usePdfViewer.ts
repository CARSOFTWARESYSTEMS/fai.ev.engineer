import { useState, useRef, useCallback, useEffect } from 'react'
import type { PageNaturalSize, PdfRotation } from '../types/pdfViewerTypes'

const ZOOM_STEP = 0.25
const MIN_SCALE = 0.25
const MAX_SCALE = 4.0

// Padding values matching PdfCanvas inner wrapper (px-4 py-6)
const CANVAS_PADDING_X = 32  // px-4 on each side = 16*2
const CANVAS_PADDING_Y = 48  // py-6 on each side = 24*2

function clampScale(s: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, parseFloat(s.toFixed(2))))
}

export function usePdfViewer() {
  // containerRef: used only for fullscreen API (needs the root element)
  const containerRef = useRef<HTMLDivElement>(null)
  // scrollAreaRef: the actual PDF scroll container, used for fit-width/fit-page measurements
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState<PdfRotation>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageNaturalSize, setPageNaturalSize] = useState<PageNaturalSize | null>(null)
  const didAutoFit = useRef(false)

  const zoomIn = useCallback(() => setScale(s => clampScale(s + ZOOM_STEP)), [])
  const zoomOut = useCallback(() => setScale(s => clampScale(s - ZOOM_STEP)), [])

  const fitWidth = useCallback(() => {
    if (!pageNaturalSize) return
    const area = scrollAreaRef.current ?? containerRef.current
    if (!area) return
    const cw = area.clientWidth - CANVAS_PADDING_X
    const isRotated = rotation === 90 || rotation === 270
    const pw = isRotated ? pageNaturalSize.height : pageNaturalSize.width
    setScale(clampScale(cw / pw))
  }, [pageNaturalSize, rotation])

  const fitPage = useCallback(() => {
    if (!pageNaturalSize) return
    const area = scrollAreaRef.current ?? containerRef.current
    if (!area) return
    const cw = area.clientWidth - CANVAS_PADDING_X
    const ch = area.clientHeight - CANVAS_PADDING_Y
    const isRotated = rotation === 90 || rotation === 270
    const pw = isRotated ? pageNaturalSize.height : pageNaturalSize.width
    const ph = isRotated ? pageNaturalSize.width : pageNaturalSize.height
    setScale(clampScale(Math.min(cw / pw, ch / ph)))
  }, [pageNaturalSize, rotation])

  const prevPage = useCallback(() => setCurrentPage(p => Math.max(1, p - 1)), [])
  const nextPage = useCallback(() => setCurrentPage(p => Math.min(numPages, p + 1)), [numPages])

  const rotateClockwise = useCallback(() => {
    setRotation(r => ((r + 90) % 360) as PdfRotation)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // fullscreen not available on some browsers (e.g. iOS Safari)
    }
  }, [])

  // Auto fit-to-width on first page load
  useEffect(() => {
    if (pageNaturalSize && !didAutoFit.current) {
      didAutoFit.current = true
      requestAnimationFrame(() => fitWidth())
    }
  }, [pageNaturalSize, fitWidth])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return {
    containerRef,
    scrollAreaRef,
    scale,
    rotation,
    currentPage,
    numPages,
    isFullscreen,
    setNumPages,
    setCurrentPage,
    setPageNaturalSize,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
    prevPage,
    nextPage,
    rotateClockwise,
    toggleFullscreen,
  }
}
