import type { WorkspaceMode } from '../types/workspaceTypes'

interface WorkspaceModeSelectorProps {
  mode: WorkspaceMode
  onChange: (mode: WorkspaceMode) => void
}

const MODES: { id: WorkspaceMode; label: string; description: string }[] = [
  { id: 'review',     label: 'Review',     description: 'Navigate the drawing' },
  { id: 'ballooning', label: 'Ballooning', description: 'Add and manage balloons' },
  { id: 'features',   label: 'Features',   description: 'Manage feature table' },
  { id: 'as9102',     label: 'AS9102',     description: 'First article inspection' },
]

export function WorkspaceModeSelector({ mode, onChange }: WorkspaceModeSelectorProps) {
  return (
    <div className="px-3 pb-2">
      <p className="text-[9px] font-bold tracking-[0.18em] text-gray-500 uppercase mb-1.5">
        Workspace Mode
      </p>
      <div className="grid grid-cols-2 gap-1">
        {MODES.map(m => {
          const isActive = mode === m.id
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              title={m.description}
              className={[
                'flex items-center gap-1.5 text-[10px] font-semibold py-1.5 px-2 rounded-md transition-all text-left leading-none',
                isActive
                  ? 'bg-primary/30 text-white ring-1 ring-primary/60 shadow-sm shadow-primary/20'
                  : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300',
              ].join(' ')}
            >
              <span className={[
                'w-1.5 h-1.5 rounded-full shrink-0 transition-all',
                isActive ? 'bg-primary-light' : 'bg-white/10',
              ].join(' ')} />
              {m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
