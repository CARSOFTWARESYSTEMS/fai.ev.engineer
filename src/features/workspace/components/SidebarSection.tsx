import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ComponentType } from 'react'

interface SidebarSectionProps {
  title: string
  icon: ComponentType<{ className?: string }>
  count?: number
  isExpanded: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function SidebarSection({
  title,
  icon: Icon,
  count,
  isExpanded,
  isOpen,
  onToggle,
  children,
}: SidebarSectionProps) {
  // Icon-only collapsed sidebar: show just the icon button
  if (!isExpanded) {
    return (
      <div className="py-0.5 px-1.5">
        <button
          onClick={onToggle}
          title={title}
          className="w-full flex items-center justify-center p-2.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
        >
          <Icon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Section divider header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 pt-4 pb-1.5 group"
      >
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-[9px] font-bold tracking-[0.18em] text-gray-500 group-hover:text-gray-400 uppercase whitespace-nowrap transition-colors">
            {title}
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
          {count !== undefined && (
            <span className="text-[9px] font-bold text-gray-600 tabular-nums shrink-0">{count}</span>
          )}
        </div>
        {isOpen
          ? <ChevronDown className="w-3 h-3 text-gray-600 group-hover:text-gray-400 shrink-0 transition-colors" />
          : <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-gray-400 shrink-0 transition-colors" />
        }
      </button>

      {isOpen && (
        <div className="pb-3">
          {children}
        </div>
      )}
    </div>
  )
}
