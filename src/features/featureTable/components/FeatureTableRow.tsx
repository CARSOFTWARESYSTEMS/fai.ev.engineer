import { useEffect, useRef } from 'react'
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import type { Feature } from '../types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Form3Status } from '../../as9102/types/form3Types'

interface FeatureTableRowProps {
  feature: Feature
  isSelected: boolean
  linkedBalloon: Balloon | null
  status: Form3Status
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSelectBalloon: (balloonId: string) => void
}

export function FeatureTableRow({
  feature,
  isSelected,
  linkedBalloon,
  status,
  onEdit,
  onDelete,
  onSelectBalloon,
}: FeatureTableRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null)
  const hasValidLink = !!linkedBalloon &&
    linkedBalloon.balloonNumber === feature.balloonNumber &&
    (feature.pageNumber === undefined || feature.pageNumber === linkedBalloon.pageNumber)

  useEffect(() => {
    if (isSelected) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [isSelected])

  const statusClass = status === 'pass'
    ? 'bg-green-100 text-green-700'
    : status === 'fail'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'

  return (
    <tr
      ref={rowRef}
      onClick={() => hasValidLink && onSelectBalloon(feature.balloonId)}
      className={[
        'border-b border-border transition-colors group',
        hasValidLink ? 'cursor-pointer' : '',
        isSelected ? 'bg-blue-100 ring-1 ring-inset ring-primary/30' : 'hover:bg-gray-50',
      ].join(' ')}
    >
      <td className="px-2 py-1.5 text-xs tabular-nums text-center text-text-secondary">
        {feature.featureNumber}
      </td>
      <td className="px-2 py-1.5 text-center">
        {hasValidLink ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
            {feature.balloonNumber}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-semibold text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            Unlinked
          </span>
        )}
      </td>
      <td className="px-2 py-1.5">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize ${statusClass}`}>
          {status}
        </span>
      </td>
      <td className="px-2 py-1.5 text-xs text-text-primary">{feature.type}</td>
      <td className="px-2 py-1.5 text-xs font-mono text-text-primary">{feature.nominal || '—'}</td>
      <td className="px-2 py-1.5 text-xs font-mono text-text-secondary">{feature.tolerance || '—'}</td>
      <td className="px-2 py-1.5 text-xs font-mono text-text-secondary">{feature.min || '—'}</td>
      <td className="px-2 py-1.5 text-xs font-mono text-text-secondary">{feature.max || '—'}</td>
      <td className="px-2 py-1.5 text-xs text-text-secondary">{feature.units || '—'}</td>
      <td className="px-2 py-1.5 text-xs text-text-secondary max-w-[80px] truncate" title={feature.comments}>
        {feature.comments || '—'}
      </td>
      <td className="px-1 py-1.5 w-10">
        <div className={[
          'flex items-center gap-0.5 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}>
          <button
            onClick={(event) => {
              event.stopPropagation()
              onEdit(feature.id)
            }}
            title="Edit feature"
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <Pencil className="w-3 h-3 text-text-secondary" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation()
              onDelete(feature.id)
            }}
            title="Delete feature"
            className="p-1 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-error" />
          </button>
        </div>
      </td>
    </tr>
  )
}
