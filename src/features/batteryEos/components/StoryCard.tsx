import { Clock, Calendar, User, ChevronRight } from 'lucide-react'
import type { EosStory } from '../types/eos.types'
import {
  EOS_STORY_STATUS_LABELS,
  EOS_STORY_STATUS_COLORS,
  EOS_PRIORITY_COLORS,
} from '../types/eos.types'

interface Props {
  story:    EosStory
  onClick?: () => void
}

export function StoryCard({ story, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`border border-border rounded-xl p-4 bg-white flex flex-col gap-2.5 transition-all ${
        onClick ? 'cursor-pointer hover:border-primary/30 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono font-bold text-text-secondary shrink-0">{story.storyId}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${EOS_PRIORITY_COLORS[story.priority]}`}>
            {story.priority.charAt(0).toUpperCase() + story.priority.slice(1)}
          </span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${EOS_STORY_STATUS_COLORS[story.status]}`}>
          {EOS_STORY_STATUS_LABELS[story.status]}
        </span>
      </div>

      <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">{story.title}</p>
      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{story.description}</p>

      <div className="flex items-center gap-3 text-[10px] text-text-secondary pt-1 border-t border-border">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {story.engineeringHours}h eng + {story.qaHours}h QA
        </span>
        {story.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(story.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        )}
        {story.assignedEngineer && (
          <span className="flex items-center gap-1 ml-auto">
            <User className="w-3 h-3" />
            {story.assignedEngineer.split('@')[0]}
          </span>
        )}
        {onClick && <ChevronRight className="w-3 h-3 ml-auto shrink-0 text-text-secondary/50" />}
      </div>
    </div>
  )
}
