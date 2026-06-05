import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Feature, FeatureType, FeatureFormData } from '../types/featureTypes'
import { FEATURE_TYPES } from '../types/featureTypes'

interface FeatureEditorProps {
  // null = creating new; non-null = editing existing
  feature: Feature | null
  balloonNumber: number
  defaultFeatureNumber: number
  onSave: (data: FeatureFormData) => void
  onCancel: () => void
}

export function FeatureEditor({
  feature,
  balloonNumber,
  defaultFeatureNumber,
  onSave,
  onCancel,
}: FeatureEditorProps) {
  const [form, setForm] = useState<FeatureFormData>({
    featureNumber: feature?.featureNumber ?? defaultFeatureNumber,
    type: (feature?.type ?? 'Linear') as FeatureType,
    nominal: feature?.nominal ?? '',
    tolerance: feature?.tolerance ?? '',
    min: feature?.min ?? '',
    max: feature?.max ?? '',
    units: feature?.units ?? '',
    comments: feature?.comments ?? '',
  })

  const set = (field: keyof FeatureFormData, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const cell = 'px-1 py-1.5'
  const input = 'w-full text-xs border border-border rounded px-1.5 py-1 focus:outline-none focus:border-primary bg-white'

  return (
    <tr className="bg-blue-50 border-b border-blue-200">
      {/* Feature No */}
      <td className={cell}>
        <input
          type="number"
          value={form.featureNumber}
          onChange={e => set('featureNumber', Math.max(1, parseInt(e.target.value) || 1))}
          className={input + ' w-10 text-center'}
          min={1}
        />
      </td>
      {/* Balloon No — read-only badge */}
      <td className="px-2 py-1.5 text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
          {balloonNumber}
        </span>
      </td>
      {/* Type */}
      <td className={cell}>
        <select
          value={form.type}
          onChange={e => set('type', e.target.value)}
          className={input + ' min-w-[90px]'}
        >
          {FEATURE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </td>
      {/* Nominal */}
      <td className={cell}>
        <input
          value={form.nominal}
          onChange={e => set('nominal', e.target.value)}
          placeholder="0.00"
          className={input + ' w-14'}
        />
      </td>
      {/* Tolerance */}
      <td className={cell}>
        <input
          value={form.tolerance}
          onChange={e => set('tolerance', e.target.value)}
          placeholder="±0.05"
          className={input + ' w-16'}
        />
      </td>
      {/* Min */}
      <td className={cell}>
        <input
          value={form.min}
          onChange={e => set('min', e.target.value)}
          placeholder="—"
          className={input + ' w-14'}
        />
      </td>
      {/* Max */}
      <td className={cell}>
        <input
          value={form.max}
          onChange={e => set('max', e.target.value)}
          placeholder="—"
          className={input + ' w-14'}
        />
      </td>
      {/* Units */}
      <td className={cell}>
        <input
          value={form.units}
          onChange={e => set('units', e.target.value)}
          placeholder="mm"
          className={input + ' w-12'}
        />
      </td>
      {/* Comments */}
      <td className={cell}>
        <input
          value={form.comments}
          onChange={e => set('comments', e.target.value)}
          placeholder="Notes…"
          className={input}
        />
      </td>
      {/* Save / Cancel */}
      <td className={cell}>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onSave(form)}
            title="Save"
            className="p-1 rounded bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancel}
            title="Cancel"
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-text-secondary" />
          </button>
        </div>
      </td>
    </tr>
  )
}
