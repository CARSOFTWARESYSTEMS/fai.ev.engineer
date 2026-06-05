import { useRef, useState } from 'react'
import type { Balloon } from '../types/balloonTypes'

interface DragState {
  startClientX: number
  startClientY: number
  startXPercent: number
  startYPercent: number
}

interface BalloonMarkerProps {
  balloon: Balloon
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
  isSelected,
  layerRef,
  onSelect,
  onDragEnd,
}: BalloonMarkerProps) {
  const dragRef = useRef<DragState | null>(null)
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null)
  const hasDragged = useRef(false)

  const xPercent = livePos?.x ?? balloon.xPercent
  const yPercent = livePos?.y ?? balloon.yPercent

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect(balloon.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    hasDragged.current = false
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPercent: balloon.xPercent,
      startYPercent: balloon.yPercent,
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
      onDragEnd(
        balloon.id,
        clamp(dragRef.current.startXPercent + dx / rect.width),
        clamp(dragRef.current.startYPercent + dy / rect.height),
      )
    }
    dragRef.current = null
    setLivePos(null)
    hasDragged.current = false
  }

  return (
    <div
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
        className={[
          'w-7 h-7 rounded-full flex items-center justify-center',
          'text-xs font-bold select-none',
          'shadow-md transition-transform duration-100',
          livePos ? 'cursor-grabbing' : 'cursor-grab',
          isSelected
            ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-500 ring-offset-1 scale-110'
            : 'bg-primary text-white hover:scale-105',
        ].join(' ')}
      >
        {balloon.balloonNumber}
      </div>
    </div>
  )
}
