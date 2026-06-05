import { Pencil, Trash2 } from 'lucide-react'
import type { Feature } from '../types/featureTypes'

interface FeatureTableRowProps {
  feature: Feature
  isLinked: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSelectBalloon: (balloonId: string) => void
}

export function FeatureTableRow({
  feature,
  isLinked,
  onEdit,
  onDelete,
  onSelectBalloon,
}: FeatureTableRowProps) {
  return (
    <tr className={[
      'border-b border-border transition-colors',
      isLinked ? 'bg-primary-light' : 'hover:bg-gray-50',
    ].join(' ')}>
      <td className="px-2 py-1.5 text-xs tabular-nums text-center text-text-secondary">
        {feature.featureNumber}
      </td>
      <td className="px-2 py-1.5 text-center">
        <button
          onClick={() => onSelectBalloon(feature.balloonId)}
          title="Select balloon"
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
        >
          {feature.balloonNumber}
        </button>
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
      <td className="px-1 py-1.5">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onEdit(feature.id)}
            title="Edit feature"
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <Pencil className="w-3 h-3 text-text-secondary" />
          </button>
          <button
            onClick={() => onDelete(feature.id)}
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
