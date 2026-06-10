import {
  ClipboardCheck,
  Download,
  Eye,
  ListChecks,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { WorkspaceMode } from '../types/workspaceTypes'

interface WorkspaceModeSelectorProps {
  mode: WorkspaceMode
  isBalloonMode: boolean
  onChange: (mode: WorkspaceMode) => void
}

const MODES: {
  id: WorkspaceMode
  label: string
  description: string
  icon: LucideIcon
}[] = [
  { id: 'review', label: 'Review', description: 'View drawing and project summary', icon: Eye },
  { id: 'ballooning', label: 'Ballooning', description: 'Place and manage balloons', icon: Target },
  { id: 'features', label: 'Features', description: 'Create and edit characteristics', icon: ListChecks },
  { id: 'as9102', label: 'AS9102', description: 'Inspect and record results', icon: ClipboardCheck },
  { id: 'export', label: 'Export', description: 'Download reports and deliverables', icon: Download },
]

export function WorkspaceModeSelector({
  mode,
  isBalloonMode,
  onChange,
}: WorkspaceModeSelectorProps) {
  const activeMode = MODES.find(item => item.id === mode) ?? MODES[0]
  const ActiveIcon = activeMode.icon

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center px-2">
      <div className="hidden min-w-0 items-center gap-1 xl:flex">
        {MODES.map((m, index) => {
          const isActive = mode === m.id
          const isBallooningActive = m.id === 'ballooning' && isActive && isBalloonMode
          const Icon = m.icon
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              aria-current={isActive ? 'step' : undefined}
              title={m.description}
              className={[
                'flex h-9 items-center gap-1.5 rounded-lg border px-2 transition-all',
                isActive
                  ? isBallooningActive
                    ? 'border-emerald-500/60 bg-primary text-white shadow-[0_0_10px_rgb(34_197_94_/_0.14)]'
                    : 'border-primary bg-primary text-white shadow-sm'
                  : 'border-white/[0.08] bg-white/[0.04] text-gray-400 hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-gray-200',
              ].join(' ')}
            >
              <span className={[
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-gray-500',
              ].join(' ')}>
                {index + 1}
              </span>
              <Icon className={isActive ? 'h-3 w-3 text-white' : 'h-3 w-3 text-gray-500'} />
              <span className="whitespace-nowrap text-[10px] font-semibold">{m.label}</span>
              {isBallooningActive && (
                <span className={[
                  'h-1.5 w-1.5 rounded-full bg-emerald-300',
                  'shadow-[0_0_5px_rgb(110_231_183)]',
                ].join(' ')} />
              )}
            </button>
          )
        })}
      </div>

      <label className="relative flex min-w-0 flex-1 items-center xl:hidden">
        <span className="sr-only">Current workflow step</span>
        <ActiveIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-blue-300" />
        <select
          value={mode}
          onChange={event => onChange(event.target.value as WorkspaceMode)}
          className="h-9 w-full min-w-[138px] appearance-none rounded-lg border border-primary/50 bg-primary/20 py-1 pl-8 pr-7 text-[10px] font-semibold text-blue-100 outline-none"
          title="Current workflow step"
        >
          {MODES.map((item, index) => (
            <option key={item.id} value={item.id}>
              {index + 1} {item.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 text-[10px] text-blue-300">▼</span>
      </label>
    </div>
  )
}
