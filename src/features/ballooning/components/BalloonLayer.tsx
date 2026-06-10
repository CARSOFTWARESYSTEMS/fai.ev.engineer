import { useRef, useState } from 'react'
import type { Balloon } from '../types/balloonTypes'
import type { PdfRotation } from '../../pdfViewer/types/pdfViewerTypes'
import type { Form3Status } from '../../as9102/types/form3Types'
import { BalloonMarker } from './BalloonMarker'
import { BlankPlacementWarningDialog } from './BlankPlacementWarningDialog'
import { unrotateBalloonPoint, type NormalizedPoint } from '../utils/balloonCoordinates'
import { isPointNearPdfContent } from '../utils/pdfContentDetection'

interface BalloonLayerProps {
  balloons: Balloon[]
  currentPage: number
  rotation: PdfRotation
  pdfCanvas: HTMLCanvasElement | null
  statusByBalloonId: Map<string, Form3Status>
  focusRequest: number
  isBalloonMode: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onAddBalloon: (xPercent: number, yPercent: number) => void
  onMoveBalloon: (id: string, xPercent: number, yPercent: number) => void
}

export function BalloonLayer({
  balloons,
  currentPage,
  rotation,
  pdfCanvas,
  statusByBalloonId,
  focusRequest,
  isBalloonMode,
  selectedId,
  onSelect,
  onAddBalloon,
  onMoveBalloon,
}: BalloonLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const [pendingPlacement, setPendingPlacement] = useState<NormalizedPoint | null>(null)

  const visibleBalloons = balloons.filter(b => b.pageNumber === currentPage)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isBalloonMode || !layerRef.current) return
    // Primary button only (left click / touch / pen)
    if (e.button !== 0) return

    e.preventDefault()

    const rect = layerRef.current.getBoundingClientRect()
    const displayPosition = {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
    const storedPosition = unrotateBalloonPoint(displayPosition, rotation)

    if (!isPointNearPdfContent(pdfCanvas, displayPosition.x, displayPosition.y)) {
      setPendingPlacement(storedPosition)
      return
    }

    onAddBalloon(storedPosition.x, storedPosition.y)
  }

  return (
    <div
      ref={layerRef}
      className="absolute inset-0"
      style={{
        // zIndex 10 > annotationLayer(3) > textLayer(2): ensures this overlay
        // is the pointer-event target in balloon mode.
        // pointer-events:'auto' (not 'all') — 'all' is SVG-only and unreliable on HTML.
        zIndex: 10,
        pointerEvents: isBalloonMode ? 'auto' : 'none',
        cursor: isBalloonMode ? 'crosshair' : 'default',
      }}
      onPointerDown={handlePointerDown}
    >
      {visibleBalloons.map(balloon => (
        <BalloonMarker
          key={balloon.id}
          balloon={balloon}
          rotation={rotation}
          status={statusByBalloonId.get(balloon.id) ?? 'pending'}
          focusRequest={focusRequest}
          isSelected={selectedId === balloon.id}
          layerRef={layerRef}
          onSelect={onSelect}
          onDragEnd={onMoveBalloon}
        />
      ))}
      {pendingPlacement && (
        <BlankPlacementWarningDialog
          onCancel={() => setPendingPlacement(null)}
          onConfirm={() => {
            onAddBalloon(pendingPlacement.x, pendingPlacement.y)
            setPendingPlacement(null)
          }}
        />
      )}
    </div>
  )
}
