import { PlusCircle, Info } from 'lucide-react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  label: string
  description?: string
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, label, description, disabled }: ToggleSwitchProps) {
  return (
    <div
      className={[
        'flex items-center justify-between px-3 py-2 gap-3',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer group',
      ].join(' ')}
      onClick={disabled ? undefined : onChange}
    >
      <div className="min-w-0">
        <div className="text-xs text-gray-300 group-hover:text-white transition-colors leading-none">{label}</div>
        {description && <div className="text-[9px] text-gray-600 mt-0.5">{description}</div>}
      </div>
      <div
        className={[
          'relative w-8 h-4 rounded-full transition-colors shrink-0',
          checked ? 'bg-primary' : 'bg-white/20',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>
    </div>
  )
}

interface RadioGroupProps {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

function RadioGroup({ label, options, value, onChange, disabled }: RadioGroupProps) {
  return (
    <div className={['px-3 py-2', disabled ? 'opacity-40' : ''].join(' ')}>
      <div className="text-[9px] font-semibold tracking-[0.1em] text-gray-500 uppercase mb-2">{label}</div>
      <div className="flex gap-4">
        {options.map(opt => (
          <label
            key={opt.value}
            className={['flex items-center gap-1.5', disabled ? 'cursor-not-allowed' : 'cursor-pointer group'].join(' ')}
          >
            <div
              onClick={disabled ? undefined : () => onChange(opt.value)}
              className={[
                'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
                value === opt.value
                  ? 'border-primary'
                  : 'border-gray-600 group-hover:border-gray-400',
              ].join(' ')}
            >
              {value === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

interface FeatureToolsSectionProps {
  isExpanded: boolean
  isTableOpen: boolean
  tableLayout: 'right' | 'bottom'
  isTableCollapsed: boolean
  hasSelectedBalloon: boolean
  onToggleTable: () => void
  onToggleTableLayout: () => void
  onToggleTableCollapse: () => void
  onEnsureTableOpenForAdd: () => void
}

export function FeatureToolsSection({
  isExpanded,
  isTableOpen,
  tableLayout,
  isTableCollapsed,
  hasSelectedBalloon,
  onToggleTable,
  onToggleTableLayout,
  onToggleTableCollapse,
  onEnsureTableOpenForAdd,
}: FeatureToolsSectionProps) {
  if (!isExpanded) return null

  return (
    <div className="space-y-0">
      {/* Feature Table Settings heading */}
      <div className="px-3 pt-1 pb-1">
        <p className="text-[9px] font-semibold tracking-[0.1em] text-gray-500 uppercase">
          Table Settings
        </p>
      </div>

      {/* Show Table toggle */}
      <ToggleSwitch
        checked={isTableOpen}
        onChange={onToggleTable}
        label="Show Feature Table"
        description={isTableOpen ? 'Table is visible' : 'Table is hidden'}
      />

      {/* Layout radio */}
      <RadioGroup
        label="Panel Position"
        options={[
          { value: 'right',  label: 'Right' },
          { value: 'bottom', label: 'Bottom' },
        ]}
        value={tableLayout}
        onChange={v => { if (v !== tableLayout) onToggleTableLayout() }}
        disabled={!isTableOpen}
      />

      {/* Auto Expand (inverse of collapsed) */}
      <ToggleSwitch
        checked={!isTableCollapsed}
        onChange={onToggleTableCollapse}
        label="Auto Expand"
        description="Show full table content"
        disabled={!isTableOpen}
      />

      {/* Divider */}
      <div className="mx-3 border-t border-white/[0.06] my-1" />

      {/* Add Feature action */}
      <button
        onClick={onEnsureTableOpenForAdd}
        disabled={!hasSelectedBalloon}
        title={hasSelectedBalloon ? 'Open table to add feature for selected balloon' : 'Select a balloon on the drawing first'}
        className={[
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors mx-0',
          'disabled:opacity-35 disabled:cursor-not-allowed',
          hasSelectedBalloon
            ? 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
            : 'text-gray-500',
        ].join(' ')}
      >
        <PlusCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Add Feature</span>
        {!hasSelectedBalloon && (
          <span className="ml-auto text-[9px] text-gray-600">select balloon first</span>
        )}
      </button>

      {!hasSelectedBalloon && (
        <div className="flex items-start gap-1.5 px-3 pb-1">
          <Info className="w-3 h-3 text-gray-600 shrink-0 mt-0.5" />
          <span className="text-[9px] text-gray-600 leading-relaxed">
            Click a balloon on the drawing to select it, then add a feature.
          </span>
        </div>
      )}
    </div>
  )
}
