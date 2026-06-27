import { Users, AlertTriangle, CheckCircle2, Clock, BarChart2 } from 'lucide-react'
import type { EosDailyCheckin, EosWorkPackage, EosStoryState } from '../types/eos.types'

interface Props {
  workPackages:  EosWorkPackage[]
  storyStates?:  Record<string, EosStoryState>
  orgCheckins?:  EosDailyCheckin[]
}

export function ManagerDashboard({ workPackages, storyStates = {}, orgCheckins = [] }: Props) {
  // Resolve effective status — Firestore state takes priority over seed data
  const allStories = workPackages.flatMap(wp =>
    wp.stories.map(s => ({
      ...s,
      wpTitle: wp.title,
      status: storyStates[s.storyId]?.status ?? s.status,
    })),
  )

  const byStatus = {
    in_development:         allStories.filter(s => s.status === 'in_development').length,
    ready_for_verification: allStories.filter(s => s.status === 'ready_for_verification' || s.status === 'verification').length,
    technical_review:       allStories.filter(s => s.status === 'technical_review').length,
    approved:               allStories.filter(s => s.status === 'approved' || s.status === 'released').length,
    blocked:                allStories.filter(s => s.status === 'blocked' || s.status === 'rework_required').length,
  }

  const todayDate  = new Date().toISOString().slice(0, 10)
  const todayCheckins = orgCheckins.filter(c => c.date === todayDate)
  const blockerCheckins = todayCheckins.filter(c => c.hasBlocker)

  return (
    <div className="flex flex-col gap-5">

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="In Development" value={byStatus.in_development} cls="text-indigo-600" bg="bg-indigo-50" icon={Clock} />
        <StatCard label="QA / Review"    value={byStatus.ready_for_verification} cls="text-amber-600" bg="bg-amber-50" icon={BarChart2} />
        <StatCard label="Approved"        value={byStatus.approved} cls="text-green-600" bg="bg-green-50" icon={CheckCircle2} />
        <StatCard label="Blocked"         value={byStatus.blocked} cls={byStatus.blocked > 0 ? 'text-error' : 'text-text-secondary'} bg={byStatus.blocked > 0 ? 'bg-red-50' : 'bg-gray-50'} icon={AlertTriangle} />
      </div>

      {/* Today's check-ins */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Today's Check-ins</h3>
          <span className="text-xs font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">{todayCheckins.length}</span>
        </div>

        {todayCheckins.length === 0 ? (
          <p className="text-sm text-text-secondary italic">No check-ins submitted today yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {todayCheckins.map(c => (
              <div key={c.checkinId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{c.userName || c.userEmail}</p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{c.todayPlan}</p>
                    {c.hasBlocker && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="line-clamp-1">{c.blockerDescription}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-text-secondary">{c.estimatedHoursToday}h today</span>
                    {c.hasBlocker && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {blockerCheckins.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {blockerCheckins.length} engineer{blockerCheckins.length > 1 ? 's have' : ' has'} a blocker today. Please follow up.
          </div>
        )}
      </div>

      {/* Work Package progress */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Work Package Progress</h3>
        </div>
        <div className="flex flex-col gap-4">
          {workPackages.map(wp => {
            const total    = wp.stories.length
            const approved = wp.stories.filter(s => {
              const status = storyStates[s.storyId]?.status ?? s.status
              return status === 'approved' || status === 'released'
            }).length
            const pct      = total > 0 ? Math.round((approved / total) * 100) : 0
            return (
              <div key={wp.workPackageId}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-primary mr-2">{wp.workPackageId}</span>
                    <span className="text-xs font-medium text-text-primary">{wp.title}</span>
                  </div>
                  <span className="text-xs font-semibold text-text-primary">{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary">
                  <span>{approved} of {total} stories approved</span>
                  <span>{wp.stories.filter(s => (storyStates[s.storyId]?.status ?? s.status) === 'blocked').length} blocked</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, cls, bg, icon: Icon }: {
  label: string; value: number; cls: string; bg: string; icon: React.ComponentType<{className?:string}>
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${cls}`} />
      </div>
      <div>
        <p className={`text-xl font-bold ${cls}`}>{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  )
}
