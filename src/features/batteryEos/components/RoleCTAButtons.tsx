import { Info, PlayCircle, Wrench } from 'lucide-react'
import type { EosRoleAccess } from '../types/eos.types'

interface Props {
  access:          EosRoleAccess
  onInfo?:         () => void
  onDemo?:         () => void
  onEngineering?:  () => void
  activeView?:     'info' | 'demo' | 'engineering'
}

export function RoleCTAButtons({ access, onInfo, onDemo, onEngineering, activeView }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {access.canInfo && (
        <button
          onClick={onInfo}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            activeView === 'info'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-text-secondary border-border hover:text-primary hover:border-primary/30'
          }`}
        >
          <Info className="w-3 h-3" />
          Info
        </button>
      )}
      {access.canDemo && (
        <button
          onClick={onDemo}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            activeView === 'demo'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-text-secondary border-border hover:text-indigo-600 hover:border-indigo-300'
          }`}
        >
          <PlayCircle className="w-3 h-3" />
          Demo
        </button>
      )}
      {access.canEngineering && (
        <button
          onClick={onEngineering}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            activeView === 'engineering'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-text-secondary border-border hover:text-emerald-700 hover:border-emerald-300'
          }`}
        >
          <Wrench className="w-3 h-3" />
          Engineering
        </button>
      )}
    </div>
  )
}
