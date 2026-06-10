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
  return (
    <div className="flex-1 overflow-auto min-h-0">
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
          {rows.map(row => (
            <Form3Row
              key={row.featureId}
              row={row}
              isSelected={row.balloonId === selectedBalloonId}
              onSelectBalloon={onSelectBalloon}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
