import { useState, useCallback, useEffect } from 'react'
import type { Form3Row as Form3RowData, Form3ResultFields } from '../types/form3Types'
import { Form3Row } from './Form3Row'

interface Form3TableProps {
  rows: Form3RowData[]
  selectedBalloonId: string | null
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
  { label: 'Non-Conformance Number', note: 'editable',  align: 'left',   sticky: false },
  { label: 'Inspector Notes',      note: 'editable',    align: 'left',   sticky: false },
]

export function Form3Table({
  rows,
  selectedBalloonId,
  onSelectBalloon,
  onUpdate,
}: Form3TableProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // When selected balloon changes, sync keyboard focus to the matching row
  useEffect(() => {
    if (selectedBalloonId) {
      const idx = rows.findIndex(r => r.balloonId === selectedBalloonId)
      if (idx >= 0) setFocusedIndex(idx)
    }
  }, [selectedBalloonId, rows])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (rows.length === 0) return

    const target = e.target as HTMLElement
    const isEditing =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'

    // ↑/↓ navigation — only when not in an input
    if (e.key === 'ArrowDown' && !isEditing) {
      e.preventDefault()
      setFocusedIndex(prev => (prev === null ? 0 : Math.min(prev + 1, rows.length - 1)))
      return
    }
    if (e.key === 'ArrowUp' && !isEditing) {
      e.preventDefault()
      setFocusedIndex(prev => (prev === null ? rows.length - 1 : Math.max(prev - 1, 0)))
      return
    }

    // P/F/N shortcuts — only when not in an input and a row is focused
    if (isEditing || focusedIndex === null) return
    const row = rows[focusedIndex]
    if (!row) return

    const fields: Form3ResultFields = {
      result: row.result,
      status: row.status,
      designedTooling: row.designedTooling,
      nonConformanceNumber: row.nonConformanceNumber,
      inspectorNotes: row.inspectorNotes,
    }

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault()
      if (!row.result?.trim()) return  // Pass requires a result value
      onUpdate(row.featureId, row.balloonId, row.characteristicNumber, { ...fields, status: 'pass' })
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault()
      onUpdate(row.featureId, row.balloonId, row.characteristicNumber, { ...fields, status: 'fail' })
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault()
      onUpdate(row.featureId, row.balloonId, row.characteristicNumber, { ...fields, status: 'pending' })
    }
  }, [rows, focusedIndex, onUpdate])

  return (
    <div
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
          {rows.map((row, i) => (
            <Form3Row
              key={row.featureId}
              row={row}
              isSelected={row.balloonId === selectedBalloonId}
              isFocused={focusedIndex === i}
              onSelectBalloon={onSelectBalloon}
              onFocused={() => setFocusedIndex(i)}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
