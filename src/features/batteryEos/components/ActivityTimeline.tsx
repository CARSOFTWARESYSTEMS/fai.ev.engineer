import { Clock, ArrowRight } from 'lucide-react'
import type { EosStatusHistoryEntry } from '../types/eos.types'
import { EOS_STORY_STATUS_LABELS, EOS_STORY_STATUS_COLORS } from '../types/eos.types'

interface Props {
  history: EosStatusHistoryEntry[]
}

export function ActivityTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-xl">
        <Clock className="w-6 h-6 text-border mx-auto mb-2" />
        <p className="text-xs text-text-secondary">No history yet. Transitions will appear here.</p>
      </div>
    )
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  )

  return (
    <div className="flex flex-col gap-0">
      {sorted.map((entry, i) => (
        <div key={i} className="flex gap-3">
          {/* Timeline spine */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
            {i < sorted.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>

          {/* Content */}
          <div className={`pb-4 flex-1 min-w-0 ${i < sorted.length - 1 ? '' : 'pb-0'}`}>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${EOS_STORY_STATUS_COLORS[entry.fromStatus]}`}>
                {EOS_STORY_STATUS_LABELS[entry.fromStatus]}
              </span>
              <ArrowRight className="w-3 h-3 text-text-secondary shrink-0" />
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${EOS_STORY_STATUS_COLORS[entry.toStatus]}`}>
                {EOS_STORY_STATUS_LABELS[entry.toStatus]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-text-secondary">
              <span>{entry.changedBy}</span>
              <span>·</span>
              <span>
                {new Date(entry.changedAt).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            {entry.reason && (
              <p className="text-xs text-text-secondary italic mt-1 leading-relaxed">
                "{entry.reason}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
