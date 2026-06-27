import { useState } from 'react'
import { ClipboardList, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useUserOrg } from '../../../hooks/useUserOrg'
import { submitDailyCheckin } from '../services/dailyCheckin.service'

interface Props {
  onSubmitted: () => void
}

export function DailyCheckinPanel({ onSubmitted }: Props) {
  const { firebaseUser, user } = useAuth()
  const { org }                = useUserOrg()

  const [yesterdayWork,   setYesterdayWork]   = useState('')
  const [todayPlan,       setTodayPlan]       = useState('')
  const [hasBlocker,      setHasBlocker]      = useState(false)
  const [blockerDesc,     setBlockerDesc]     = useState('')
  const [estimatedHours,  setEstimatedHours]  = useState(4)
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firebaseUser) return
    if (!yesterdayWork.trim() || !todayPlan.trim()) return
    if (hasBlocker && !blockerDesc.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      await submitDailyCheckin({
        uid:                 firebaseUser.uid,
        userEmail:           firebaseUser.email ?? '',
        userName:            user?.displayName ?? firebaseUser.displayName ?? '',
        organisationId:      org?.organisationId,
        partnerId:           org?.partnerId,
        productKey:          'battery_pm',
        yesterdayWork:       yesterdayWork.trim(),
        todayPlan:           todayPlan.trim(),
        hasBlocker,
        blockerDescription:  hasBlocker ? blockerDesc.trim() : undefined,
        estimatedHoursToday: estimatedHours,
      })
      onSubmitted()
    } catch {
      setError('Failed to submit check-in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldCls = `w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none`

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-text-primary">Daily Engineering Check-in</h2>
          <p className="text-xs text-text-secondary mt-0.5">{today}</p>
        </div>
      </div>

      <p className="text-xs text-text-secondary mb-4 border-l-2 border-primary/30 pl-3 italic">
        Submit your daily check-in to unlock the Engineering workspace for today.
      </p>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Yesterday */}
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
            Yesterday's Completed Work <span className="text-error">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={yesterdayWork}
            onChange={e => setYesterdayWork(e.target.value)}
            placeholder="What did you complete yesterday?"
            className={fieldCls}
          />
        </div>

        {/* Today plan */}
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
            Today's Planned Work <span className="text-error">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={todayPlan}
            onChange={e => setTodayPlan(e.target.value)}
            placeholder="What are you planning to work on today?"
            className={fieldCls}
          />
        </div>

        {/* Blocker toggle */}
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">
            Blockers
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="blocker"
                value="no"
                checked={!hasBlocker}
                onChange={() => setHasBlocker(false)}
                className="accent-primary"
              />
              <span className="text-sm text-text-primary">No blockers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="blocker"
                value="yes"
                checked={hasBlocker}
                onChange={() => setHasBlocker(true)}
                className="accent-error"
              />
              <span className="text-sm text-text-primary">I have a blocker</span>
            </label>
          </div>
        </div>

        {/* Blocker description */}
        {hasBlocker && (
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Blocker Description <span className="text-error">*</span>
            </label>
            <textarea
              required={hasBlocker}
              rows={2}
              value={blockerDesc}
              onChange={e => setBlockerDesc(e.target.value)}
              placeholder="Describe the blocker and what help you need…"
              className={fieldCls}
            />
          </div>
        )}

        {/* Estimated hours */}
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
            Estimated Engineering Hours Today
          </label>
          <select
            value={estimatedHours}
            onChange={e => setEstimatedHours(Number(e.target.value))}
            className="w-40 px-3 py-2 rounded-xl border border-border bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
              <option key={h} value={h}>{h} hour{h !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div className="pt-2 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={submitting || !yesterdayWork.trim() || !todayPlan.trim() || (hasBlocker && !blockerDesc.trim())}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white
              text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Submit Check-in
          </button>
        </div>
      </form>
    </div>
  )
}
