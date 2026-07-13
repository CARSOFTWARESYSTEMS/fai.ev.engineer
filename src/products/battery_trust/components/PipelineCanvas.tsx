import { CheckCircle2, XCircle, MinusCircle, CircleDashed, Loader2 } from 'lucide-react'
import type { SimulationStepResult, SimulationStepStatus } from '../domain/types'

const STATUS_STYLE: Record<SimulationStepStatus, { icon: React.ComponentType<{ className?: string }>; text: string; chip: string }> = {
  PENDING: { icon: CircleDashed, text: 'text-text-secondary', chip: 'bg-background text-text-secondary border-border' },
  READY:   { icon: CircleDashed, text: 'text-text-secondary', chip: 'bg-background text-text-secondary border-border' },
  RUNNING: { icon: Loader2,      text: 'text-primary',        chip: 'bg-blue-50 text-primary border-blue-200' },
  PASS:    { icon: CheckCircle2, text: 'text-emerald-600',    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAIL:    { icon: XCircle,      text: 'text-red-600',        chip: 'bg-red-50 text-red-700 border-red-200' },
  SKIPPED: { icon: MinusCircle,  text: 'text-text-secondary', chip: 'bg-background text-text-secondary border-border' },
  BLOCKED: { icon: XCircle,      text: 'text-amber-600',      chip: 'bg-amber-50 text-amber-700 border-amber-200' },
}

interface Props {
  steps: SimulationStepResult[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export function PipelineCanvas({ steps, selectedIndex, onSelect }: Props) {
  return (
    <div className="flex flex-col" role="list" aria-label="Mission simulation pipeline">
      {steps.map((step, i) => {
        const style = STATUS_STYLE[step.status]
        const Icon = style.icon
        const selected = selectedIndex === i
        return (
          <div key={step.simulatorId} role="listitem" className="flex flex-col">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={selected ? 'step' : undefined}
              className={`text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                selected ? 'border-primary bg-primary-light' : 'border-border bg-white hover:border-primary/40'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${style.text} ${step.status === 'RUNNING' ? 'animate-spin' : ''}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-text-secondary">{step.simulatorId}</span>
                  <span className="text-sm font-semibold text-text-primary truncate">{step.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.chip}`}>{step.status}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 truncate">{step.summary}</p>
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className="ml-6 h-4 w-px bg-border" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
