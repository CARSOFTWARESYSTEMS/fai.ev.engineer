import { useState } from 'react'
import { Zap, Loader2, AlertTriangle, TrendingUp } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getValidTransitions, transitionStory, updateProgress } from '../services/storyLifecycle.service'
import type { EosRoleAccess, EosStoryState, EosStoryStatus } from '../types/eos.types'
import { EOS_STORY_STATUS_LABELS, EOS_STORY_STATUS_COLORS } from '../types/eos.types'
import type { EosTransitionRule } from '../services/storyLifecycle.service'

interface Props {
  storyId:       string
  workPackageId: string
  productKey:    string
  storyState:    EosStoryState | null
  access:        EosRoleAccess
  onTransitioned?: (newState: EosStoryState) => void
}

const VARIANT_CLS: Record<EosTransitionRule['variant'], string> = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  success: 'bg-success text-white hover:bg-success/90',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  danger:  'bg-error text-white hover:bg-error/90',
  ghost:   'bg-white text-text-secondary border border-border hover:text-text-primary hover:border-primary/30',
}

export function StoryLifecyclePanel({
  storyId, workPackageId, productKey, storyState, access, onTransitioned,
}: Props) {
  const { firebaseUser } = useAuth()
  const currentStatus: EosStoryStatus = storyState?.status ?? 'planned'
  const progress = storyState?.progress ?? 0

  const transitions = getValidTransitions(currentStatus, access)

  // pendingReason: holds the transition that needs a reason before firing
  // submittingStatus: tracks which button is currently executing
  const [pendingReason,     setPendingReason]     = useState<EosTransitionRule | null>(null)
  const [reason,            setReason]            = useState('')
  const [submittingStatus,  setSubmittingStatus]  = useState<EosStoryStatus | null>(null)
  const [error,             setError]             = useState<string | null>(null)
  const [progressEdit,      setProgressEdit]      = useState(false)
  const [progressDraft,     setProgressDraft]     = useState(progress)
  const [savingProgress,    setSavingProgress]    = useState(false)

  async function fireTransition(t: EosTransitionRule, resolvedReason?: string) {
    if (!firebaseUser?.email) return
    setSubmittingStatus(t.toStatus)
    setError(null)
    try {
      const next = await transitionStory(
        storyId, workPackageId, productKey,
        t.toStatus,
        { email: firebaseUser.email, name: firebaseUser.displayName ?? firebaseUser.email },
        { reason: resolvedReason || undefined },
      )
      setPendingReason(null)
      setReason('')
      onTransitioned?.(next)
    } catch {
      setError('Transition failed. Please try again.')
    } finally {
      setSubmittingStatus(null)
    }
  }

  function handleCTAClick(t: EosTransitionRule) {
    setError(null)
    if (t.requiresReason) {
      // Open inline reason form — don't fire yet
      setPendingReason(t)
      setReason('')
    } else {
      // Fire immediately — no confirmation needed
      fireTransition(t)
    }
  }

  async function handleSaveProgress() {
    if (!firebaseUser?.email) return
    setSavingProgress(true)
    try {
      await updateProgress(
        storyId, workPackageId, productKey, progressDraft,
        { email: firebaseUser.email, name: firebaseUser.displayName ?? firebaseUser.email },
      )
      setProgressEdit(false)
    } catch {
      // progress save failure is non-critical
    } finally {
      setSavingProgress(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Current status + progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${EOS_STORY_STATUS_COLORS[currentStatus]}`}>
            {EOS_STORY_STATUS_LABELS[currentStatus]}
          </span>
          {storyState?.blockedReason && currentStatus === 'blocked' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{storyState.blockedReason}</span>
            </div>
          )}
          {storyState?.reworkReason && currentStatus === 'rework_required' && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{storyState.reworkReason}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-secondary flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Progress
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-text-primary">
                {progressEdit ? `${progressDraft}%` : `${progress}%`}
              </span>
              {(access.isEngineer || access.isManager) && !progressEdit && (
                <button
                  onClick={() => { setProgressDraft(progress); setProgressEdit(true) }}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium"
                >
                  Update
                </button>
              )}
            </div>
          </div>
          {progressEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={100} step={5}
                value={progressDraft}
                onChange={e => setProgressDraft(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <button
                onClick={handleSaveProgress}
                disabled={savingProgress}
                className="text-[10px] font-semibold px-2 py-1 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {savingProgress ? '…' : 'Save'}
              </button>
              <button
                onClick={() => setProgressEdit(false)}
                className="text-[10px] text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Transition actions */}
      {transitions.length > 0 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-text-primary">Actions</span>
          </div>

          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* Action buttons — always visible; spinner appears inline on the active button */}
            <div className="flex flex-wrap gap-2">
              {transitions.map(t => {
                const isRunning = submittingStatus === t.toStatus
                const anyRunning = submittingStatus !== null
                return (
                  <button
                    key={t.toStatus}
                    onClick={() => handleCTAClick(t)}
                    disabled={anyRunning}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl
                      transition-colors disabled:opacity-60 ${VARIANT_CLS[t.variant]}`}
                  >
                    {isRunning
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : null}
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* Reason input — only shown for transitions that require one */}
            {pendingReason && (
              <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-border">
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  {pendingReason.reasonLabel} <span className="text-error">*</span>
                </label>
                <textarea
                  autoFocus
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe the reason…"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fireTransition(pendingReason, reason.trim())}
                    disabled={!reason.trim() || submittingStatus !== null}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-xl
                      transition-colors disabled:opacity-50 ${VARIANT_CLS[pendingReason.variant]}`}
                  >
                    {submittingStatus === pendingReason.toStatus && <Loader2 className="w-3 h-3 animate-spin" />}
                    Confirm
                  </button>
                  <button
                    onClick={() => { setPendingReason(null); setReason('') }}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      {(storyState?.startedAt || storyState?.completedAt) && (
        <div className="flex flex-wrap gap-3 text-[10px] text-text-secondary pt-1">
          {storyState.startedAt && (
            <span>Started: {new Date(storyState.startedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          )}
          {storyState.completedAt && (
            <span>Completed: {new Date(storyState.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          )}
        </div>
      )}
    </div>
  )
}
