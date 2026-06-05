import { useRef } from 'react'
import type { Balloon } from '../types/balloonTypes'
import { BalloonMarker } from './BalloonMarker'

interface BalloonLayerProps {
  balloons: Balloon[]
  currentPage: number
  isBalloonMode: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onAddBalloon: (xPercent: number, yPercent: number) => void
  onMoveBalloon: (id: string, xPercent: number, yPercent: number) => void
}

export function BalloonLayer({
  balloons,
  currentPage,
  isBalloonMode,
  selectedId,
  onSelect,
  onAddBalloon,
  onMoveBalloon,
}: BalloonLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)

  const visibleBalloons = balloons.filter(b => b.pageNumber === currentPage)

  // DEBUG: log render state
  console.log('[BalloonLayer] render — isBalloonMode:', isBalloonMode, '| page:', currentPage, '| total balloons:', balloons.length, '| visible:', visibleBalloons.length)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    console.log('[BalloonLayer] pointerdown — isBalloonMode:', isBalloonMode, '| button:', e.button, '| type:', e.pointerType, '| hasRef:', !!layerRef.current)

    if (!isBalloonMode || !layerRef.current) {
      console.log('[BalloonLayer] SKIPPED — mode off or no layer ref')
      return
    }
    // Primary button only (left click / touch / pen)
    if (e.button !== 0) return

    e.preventDefault()

    const rect = layerRef.current.getBoundingClientRect()
    console.log('[BalloonLayer] layer rect — w:', rect.width, 'h:', rect.height, 'left:', rect.left, 'top:', rect.top)

    const xPercent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const yPercent = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))

    console.log('[BalloonLayer] placing balloon — xPercent:', xPercent.toFixed(4), 'yPercent:', yPercent.toFixed(4))
    onAddBalloon(xPercent, yPercent)
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
          isSelected={selectedId === balloon.id}
          layerRef={layerRef}
          onSelect={onSelect}
          onDragEnd={onMoveBalloon}
        />
      ))}
    </div>
  )
}
