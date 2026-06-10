import { useEffect, useRef, useState } from 'react'
import type { Balloon } from '../types/balloonTypes'
import type { PdfRotation } from '../../pdfViewer/types/pdfViewerTypes'
import type { Form3Status } from '../../as9102/types/form3Types'
import { rotateBalloonPoint, unrotateBalloonPoint } from '../utils/balloonCoordinates'
import { BALLOON_VISUALS, getBalloonStatusColor } from '../utils/balloonVisuals'

interface DragState {
  startClientX: number
  startClientY: number
  startXPercent: number
  startYPercent: number
}

interface BalloonMarkerProps {
  balloon: Balloon
  rotation: PdfRotation
  status: Form3Status
  focusRequest: number
  isSelected: boolean
  layerRef: React.RefObject<HTMLDivElement>
  onSelect: (id: string) => void
  onDragEnd: (id: string, xPercent: number, yPercent: number) => void
}

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v))
}

const DRAG_THRESHOLD_PX = 4

export function BalloonMarker({
  balloon,
  rotation,
  status,
  focusRequest,
  isSelected,
  layerRef,
  onSelect,
  onDragEnd,
}: BalloonMarkerProps) {
  const dragRef = useRef<DragState | null>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null)
  const hasDragged = useRef(false)

  const storedPosition = rotateBalloonPoint(
    { x: balloon.xPercent, y: balloon.yPercent },
    rotation,
  )
  const xPercent = livePos?.x ?? storedPosition.x
  const yPercent = livePos?.y ?? storedPosition.y

  useEffect(() => {
    if (isSelected && focusRequest > 0) {
      markerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }, [focusRequest, isSelected])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect(balloon.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    hasDragged.current = false
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPercent: storedPosition.x,
      startYPercent: storedPosition.y,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !layerRef.current) return
    const dx = e.clientX - dragRef.current.startClientX
    const dy = e.clientY - dragRef.current.startClientY
    if (!hasDragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
    hasDragged.current = true
    const rect = layerRef.current.getBoundingClientRect()
    setLivePos({
      x: clamp(dragRef.current.startXPercent + dx / rect.width),
      y: clamp(dragRef.current.startYPercent + dy / rect.height),
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !layerRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (hasDragged.current) {
      const rect = layerRef.current.getBoundingClientRect()
      const dx = e.clientX - dragRef.current.startClientX
      const dy = e.clientY - dragRef.current.startClientY
      const displayPosition = {
        x: clamp(dragRef.current.startXPercent + dx / rect.width),
        y: clamp(dragRef.current.startYPercent + dy / rect.height),
      }
      const storedPosition = unrotateBalloonPoint(displayPosition, rotation)
      onDragEnd(balloon.id, storedPosition.x, storedPosition.y)
    }
    dragRef.current = null
    setLivePos(null)
    hasDragged.current = false
  }

  return (
    <div
      ref={markerRef}
      style={{
        position: 'absolute',
        left: `${xPercent * 100}%`,
        top: `${yPercent * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 20 : 10,
        touchAction: 'none',
        pointerEvents: 'all',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: BALLOON_VISUALS.viewer.diameterPx,
          height: BALLOON_VISUALS.viewer.diameterPx,
          backgroundColor: BALLOON_VISUALS.fill,
          color: BALLOON_VISUALS.text,
          boxShadow: [
            `0 0 0 ${BALLOON_VISUALS.viewer.gapPx}px ${BALLOON_VISUALS.gap}`,
            `0 0 0 ${BALLOON_VISUALS.viewer.gapPx + BALLOON_VISUALS.viewer.ringPx}px ${getBalloonStatusColor(status)}`,
          ].join(', '),
        }}
        className={[
          'rounded-full flex items-center justify-center',
          'text-xs font-bold select-none',
          'transition-transform duration-100',
          livePos ? 'cursor-grabbing' : 'cursor-grab',
          isSelected ? 'scale-125' : 'hover:scale-105',
        ].join(' ')}
      >
        {balloon.balloonNumber}
      </div>
    </div>
  )
}
