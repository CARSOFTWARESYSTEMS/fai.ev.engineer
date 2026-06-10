import { useState } from 'react'
import type { Form3Row as Form3RowData, Form3ResultFields, Form3Status } from '../types/form3Types'

interface Form3RowProps {
  row: Form3RowData
  onUpdate: (
    featureId: string,
    balloonId: string,
    charNo: number,
    fields: Form3ResultFields,
  ) => void
}

const STATUS_CONFIG: Record<Form3Status, { label: string; active: string; inactive: string }> = {
  pending: {
    label: 'Pending',
    active: 'bg-amber-100 text-amber-700 border-amber-300 font-semibold',
    inactive: 'bg-white text-gray-400 border-gray-200 hover:border-amber-200 hover:text-amber-500',
  },
  pass: {
    label: 'Pass',
    active: 'bg-green-100 text-green-700 border-green-300 font-semibold',
    inactive: 'bg-white text-gray-400 border-gray-200 hover:border-green-200 hover:text-green-600',
  },
  fail: {
    label: 'Fail',
    active: 'bg-red-100 text-red-700 border-red-300 font-semibold',
    inactive: 'bg-white text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-600',
  },
}

const ROW_BG: Record<Form3Status, string> = {
  pending: '',
  pass: 'bg-green-50/40',
  fail: 'bg-red-50/40',
}

export function Form3Row({ row, onUpdate }: Form3RowProps) {
  // Local state is initialized once (after isLoaded=true) and tracks user input between saves
  const [result, setResult] = useState(row.result)
  const [inspectorNotes, setInspectorNotes] = useState(row.inspectorNotes)

  const fire = (overrides: Partial<Form3ResultFields>) => {
    onUpdate(row.featureId, row.balloonId, row.characteristicNumber, {
      result: overrides.result ?? result,
      status: overrides.status ?? row.status,
      inspectorNotes: overrides.inspectorNotes ?? inspectorNotes,
    })
  }

  const cell = 'px-3 py-2 text-xs border-b border-gray-100 whitespace-nowrap align-middle'
  const roCell = `${cell} text-gray-700`

  return (
    <tr className={`group transition-colors hover:brightness-[0.97] ${ROW_BG[row.status]}`}>
      {/* Char No — sticky left */}
      <td className={`${cell} sticky left-0 bg-inherit text-center font-mono font-semibold text-primary z-10 min-w-[3rem]`}>
        {row.characteristicNumber}
      </td>

      {/* Balloon No */}
      <td className={`${roCell} text-center min-w-[4rem]`}>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-primary text-primary text-[10px] font-bold">
          {row.balloonNumber}
        </span>
      </td>

      {/* Page No */}
      <td className={`${roCell} text-center min-w-[3.5rem]`}>{row.pageNumber || '—'}</td>

      {/* Characteristic Type */}
      <td className={`${roCell} min-w-[7rem]`}>
        <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-600 uppercase tracking-wide">
          {row.characteristicType}
        </span>
      </td>

      {/* Drawing Requirement */}
      <td className={`${roCell} max-w-[200px] min-w-[120px]`}>
        <span className="truncate block font-mono">{row.drawingRequirement || '—'}</span>
      </td>

      {/* Nominal */}
      <td className={`${roCell} text-right min-w-[4rem] font-mono`}>{row.nominal || '—'}</td>

      {/* Tolerance */}
      <td className={`${roCell} text-right min-w-[5rem] font-mono`}>{row.tolerance || '—'}</td>

      {/* Min */}
      <td className={`${roCell} text-right min-w-[4rem] font-mono`}>{row.min || '—'}</td>

      {/* Max */}
      <td className={`${roCell} text-right min-w-[4rem] font-mono`}>{row.max || '—'}</td>

      {/* Units */}
      <td className={`${roCell} min-w-[3.5rem]`}>{row.units || '—'}</td>

      {/* Result — editable */}
      <td className={`${cell} min-w-[120px]`}>
        <input
          type="text"
          value={result}
          placeholder="Enter value…"
          onChange={e => {
            setResult(e.target.value)
            fire({ result: e.target.value })
          }}
          className="w-full bg-transparent border border-transparent rounded px-1.5 py-0.5 text-xs text-gray-800 font-mono placeholder-gray-300 focus:outline-none focus:border-primary focus:bg-white transition-colors"
        />
      </td>

      {/* Status — compact buttons */}
      <td className={`${cell} min-w-[130px]`}>
        <div className="flex gap-1">
          {(['pending', 'pass', 'fail'] as Form3Status[]).map(s => (
            <button
              key={s}
              onClick={() => fire({ status: s })}
              className={[
                'px-2 py-0.5 rounded border text-[10px] transition-all',
                row.status === s
                  ? STATUS_CONFIG[s].active
                  : STATUS_CONFIG[s].inactive,
              ].join(' ')}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </td>

      {/* Inspector Notes — editable */}
      <td className={`${cell} min-w-[180px]`}>
        <input
          type="text"
          value={inspectorNotes}
          placeholder={row.featureComments || 'Notes…'}
          onChange={e => {
            setInspectorNotes(e.target.value)
            fire({ inspectorNotes: e.target.value })
          }}
          className="w-full bg-transparent border border-transparent rounded px-1.5 py-0.5 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-primary focus:bg-white transition-colors"
        />
      </td>
    </tr>
  )
}
