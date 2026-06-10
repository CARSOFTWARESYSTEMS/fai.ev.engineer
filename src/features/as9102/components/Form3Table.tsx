import { useState, useCallback, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Form3Row as Form3RowData, Form3ResultFields } from '../types/form3Types'
import { Form3Row } from './Form3Row'

interface Form3TableProps {
  rows: Form3RowData[]
  selectedBalloonId: string | null
  pageFilter: number | null
  onSelectBalloon: (balloonId: string) => void
  onUpdate: (
    featureId: string,
    balloonId: string,
    charNo: number,
    fields: Form3ResultFields,
  ) => void
}

const HEADERS = [
  { label: 'Char No',              note: null,          align: 'center', sticky: true },
  { label: 'Reference Location',   note: 'balloon',     align: 'center', sticky: false },
  { label: 'Page No',              note: null,          align: 'center', sticky: false },
  { label: 'Characteristic Type',  note: null,          align: 'left',   sticky: false },
  { label: 'Characteristic Design Requirement', note: 'type+nom+tol+units', align: 'left', sticky: false },
  { label: 'Nominal',              note: null,          align: 'right',  sticky: false },
  { label: 'Tolerance',            note: null,          align: 'right',  sticky: false },
  { label: 'Min',                  note: null,          align: 'right',  sticky: false },
  { label: 'Max',                  note: null,          align: 'right',  sticky: false },
  { label: 'Units',                note: null,          align: 'left',   sticky: false },
  { label: 'Results',              note: 'editable',    align: 'left',   sticky: false },
  { label: 'Status',               note: 'editable',    align: 'left',   sticky: false },
  { label: 'Designed Tooling',     note: 'editable',    align: 'left',   sticky: false },
  { label: 'Measurement Equipment Used', note: 'AS9102D §5.1', align: 'left', sticky: false },
  { label: 'Non-Conformance Number', note: 'editable',  align: 'left',   sticky: false },
  { label: 'Inspector Notes',      note: 'editable',    align: 'left',   sticky: false },
]

const ROW_HEIGHT = 36

export function Form3Table({
  rows,
  selectedBalloonId,
  pageFilter,
  onSelectBalloon,
  onUpdate,
}: Form3TableProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const visibleRows = pageFilter !== null
    ? rows.filter(r => r.pageNumber === pageFilter)
    : rows

  // When selected balloon changes, sync keyboard focus to the matching row
  useEffect(() => {
    if (selectedBalloonId) {
      const idx = visibleRows.findIndex(r => r.balloonId === selectedBalloonId)
      if (idx >= 0) {
        setFocusedIndex(idx)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBalloonId])

  const virtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0

  // Scroll virtualizer to focused row (keyboard navigation)
  useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= 0 && focusedIndex < visibleRows.length) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (visibleRows.length === 0) return

    const target = e.target as HTMLElement
    const isEditing =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'

    if (e.key === 'ArrowDown' && !isEditing) {
      e.preventDefault()
      setFocusedIndex(prev => (prev === null ? 0 : Math.min(prev + 1, visibleRows.length - 1)))
      return
    }
    if (e.key === 'ArrowUp' && !isEditing) {
      e.preventDefault()
      setFocusedIndex(prev => (prev === null ? visibleRows.length - 1 : Math.max(prev - 1, 0)))
      return
    }

    if (isEditing || focusedIndex === null) return
    const row = visibleRows[focusedIndex]
    if (!row) return

    const fields: Form3ResultFields = {
      result: row.result,
      status: row.status,
      designedTooling: row.designedTooling,
      measurementEquipmentUsed: row.measurementEquipmentUsed,
      nonConformanceNumber: row.nonConformanceNumber,
      inspectorNotes: row.inspectorNotes,
    }

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault()
      if (!row.result?.trim()) return
      onUpdate(row.featureId, row.balloonId, row.characteristicNumber, { ...fields, status: 'pass' })
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault()
      onUpdate(row.featureId, row.balloonId, row.characteristicNumber, { ...fields, status: 'fail' })
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault()
      onUpdate(row.featureId, row.balloonId, row.characteristicNumber, { ...fields, status: 'pending' })
    }
  }, [visibleRows, focusedIndex, onUpdate])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto min-h-0 focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <table className="min-w-max w-full text-xs border-collapse">
        <thead className="sticky top-0 z-20">
          <tr className="bg-gray-800 text-white">
            {HEADERS.map((h, i) => (
              <th
                key={i}
                className={[
                  'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border-b border-gray-700',
                  h.align === 'center' ? 'text-center' : h.align === 'right' ? 'text-right' : 'text-left',
                  h.sticky ? 'sticky left-0 bg-gray-800 z-30' : '',
                  h.note ? 'text-blue-300' : '',
                ].join(' ')}
              >
                {h.label}
                {h.note && (
                  <span className="block text-[9px] font-normal text-blue-400/70 normal-case tracking-normal">
                    {h.note}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paddingTop > 0 && (
            <tr><td style={{ height: paddingTop }} colSpan={HEADERS.length} /></tr>
          )}
          {virtualItems.map(vRow => {
            const row = visibleRows[vRow.index]
            return (
              <Form3Row
                key={row.featureId}
                row={row}
                isSelected={row.balloonId === selectedBalloonId}
                isFocused={focusedIndex === vRow.index}
                onSelectBalloon={onSelectBalloon}
                onFocused={() => setFocusedIndex(vRow.index)}
                onUpdate={onUpdate}
              />
            )
          })}
          {paddingBottom > 0 && (
            <tr><td style={{ height: paddingBottom }} colSpan={HEADERS.length} /></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
