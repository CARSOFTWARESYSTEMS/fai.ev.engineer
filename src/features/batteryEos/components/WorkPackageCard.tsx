import { Package, ChevronRight, Calendar, TrendingUp } from 'lucide-react'
import type { EosWorkPackage, EosRoleAccess } from '../types/eos.types'
import { EOS_WP_STATUS_LABELS, EOS_WP_STATUS_COLORS, EOS_PRIORITY_COLORS } from '../types/eos.types'
import { RoleCTAButtons } from './RoleCTAButtons'

interface Props {
  wp:      EosWorkPackage
  access:  EosRoleAccess
  onInfo?:        () => void
  onDemo?:        () => void
  onEngineering?: () => void
  activeView?:    'info' | 'demo' | 'engineering'
}

export function WorkPackageCard({ wp, access, onInfo, onDemo, onEngineering, activeView }: Props) {
  const totalStories    = wp.stories.length
  const approvedStories = wp.stories.filter(s => s.status === 'approved' || s.status === 'released').length

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden hover:shadow-sm transition-all">
      {/* Header strip */}
      <div className="bg-gray-50 border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold font-mono text-primary bg-primary-light px-1.5 py-0.5 rounded">
            {wp.workPackageId}
          </span>
          <ChevronRight className="w-3 h-3 text-border shrink-0" />
          <span className="text-[10px] text-text-secondary truncate">{wp.missionName}</span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${EOS_PRIORITY_COLORS[wp.priority]}`}>
          {wp.priority.charAt(0).toUpperCase() + wp.priority.slice(1)}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Icon + title + status */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary leading-snug">{wp.title}</p>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{wp.definition}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${EOS_WP_STATUS_COLORS[wp.status]}`}>
            {EOS_WP_STATUS_LABELS[wp.status]}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-secondary flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Progress
            </span>
            <span className="text-[10px] font-semibold text-text-primary">
              {approvedStories}/{totalStories} stories
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${totalStories > 0 ? Math.round((approvedStories / totalStories) * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Milestones + due date */}
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span>{wp.milestones.length} milestones</span>
          <span>{totalStories} stories</span>
          {wp.dueDate && (
            <span className="flex items-center gap-1 ml-auto">
              <Calendar className="w-3 h-3" />
              {new Date(wp.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="pt-2 border-t border-border">
          <RoleCTAButtons
            access={access}
            onInfo={onInfo}
            onDemo={onDemo}
            onEngineering={onEngineering}
            activeView={activeView}
          />
        </div>
      </div>
    </div>
  )
}
