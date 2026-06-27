import { CheckCircle2, Clock, AlertTriangle, ClipboardList, Calendar } from 'lucide-react'
import type { EosDailyCheckin, EosWorkPackage, EosStory, EosStoryState } from '../types/eos.types'
import { EOS_PRIORITY_COLORS } from '../types/eos.types'
import { StoryCard } from './StoryCard'

interface Props {
  workPackages:   EosWorkPackage[]
  storyStates?:   Record<string, EosStoryState>
  todayCheckin:   EosDailyCheckin | null
  userEmail?:     string
  onSelectStory?: (story: EosStory, wp: EosWorkPackage) => void
}

export function EngineerDashboard({ workPackages, storyStates = {}, todayCheckin, userEmail, onSelectStory }: Props) {
  const myStories: { story: EosStory; wp: EosWorkPackage }[] = workPackages.flatMap(wp =>
    wp.stories
      .filter(s => {
        const assignedEmail = storyStates[s.storyId]?.assignedEngineerEmail ?? s.assignedEngineer
        return !userEmail || !assignedEmail || assignedEmail === userEmail
      })
      .map(s => ({
        story: { ...s, status: storyStates[s.storyId]?.status ?? s.status },
        wp,
      }))
  )

  const activeStories = myStories.filter(({ story }) =>
    story.status === 'assigned' || story.status === 'in_development' || story.status === 'ready_for_verification',
  )
  const blockedStories = myStories.filter(({ story }) => story.status === 'blocked' || story.status === 'rework_required')

  return (
    <div className="flex flex-col gap-5">

      {/* Check-in summary */}
      {todayCheckin && (
        <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Check-in submitted for today</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide font-semibold mb-0.5">Yesterday</p>
                <p className="text-xs text-text-primary">{todayCheckin.yesterdayWork}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide font-semibold mb-0.5">Today's Plan</p>
                <p className="text-xs text-text-primary">{todayCheckin.todayPlan}</p>
              </div>
            </div>
            {todayCheckin.hasBlocker && (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span><strong>Blocker:</strong> {todayCheckin.blockerDescription}</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-3 text-[10px] text-text-secondary">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{todayCheckin.estimatedHoursToday}h planned today</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(todayCheckin.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Work Packages" value={workPackages.length} icon={ClipboardList} bg="bg-primary-light" iconCls="text-primary" />
        <StatCard label="Active Stories" value={activeStories.length} icon={Clock} bg="bg-blue-50" iconCls="text-blue-600" />
        <StatCard label="Blocked" value={blockedStories.length} icon={AlertTriangle} bg={blockedStories.length > 0 ? 'bg-red-50' : 'bg-gray-50'} iconCls={blockedStories.length > 0 ? 'text-error' : 'text-text-secondary'} />
      </div>

      {/* Active stories */}
      {activeStories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Active Stories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeStories.map(({ story, wp }) => (
              <StoryCard
                key={story.storyId}
                story={story}
                onClick={onSelectStory ? () => onSelectStory(story, wp) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blocked */}
      {blockedStories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-error mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Blocked Stories
          </h3>
          <div className="flex flex-col gap-2">
            {blockedStories.map(({ story }) => (
              <div key={story.storyId} className="border border-red-200 bg-red-50/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-text-secondary">{story.storyId}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${EOS_PRIORITY_COLORS[story.priority]}`}>
                    {story.priority}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{story.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {myStories.length === 0 && (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <ClipboardList className="w-8 h-8 text-border mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No stories assigned yet.</p>
          <p className="text-xs text-text-secondary/70 mt-1">Open a Work Package to view all stories.</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, bg, iconCls }: {
  label: string; value: number; icon: React.ComponentType<{className?:string}>; bg: string; iconCls: string
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${iconCls}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  )
}
