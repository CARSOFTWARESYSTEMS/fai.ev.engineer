import { useState } from 'react'
import { ClipboardCheck, Star, Loader2, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react'
import type { EosWorkPackage, EosStory, EosReview, EosReviewScore, EosApprovalDecision, EosStoryState } from '../types/eos.types'
import { EOS_STORY_STATUS_LABELS, EOS_STORY_STATUS_COLORS } from '../types/eos.types'
import { submitReview, calculateOverallScore } from '../services/engineeringReview.service'

const SCORE_FIELDS: { key: keyof Omit<EosReviewScore, 'overallScore'>; label: string }[] = [
  { key: 'requirementsCompliance',  label: 'Requirements Compliance'  },
  { key: 'architectureQuality',     label: 'Architecture Quality'     },
  { key: 'implementationQuality',   label: 'Implementation Quality'   },
  { key: 'testingQuality',          label: 'Testing Quality'          },
  { key: 'securityQuality',         label: 'Security Quality'         },
  { key: 'documentationQuality',    label: 'Documentation Quality'    },
  { key: 'demoQuality',             label: 'Demo Quality'             },
]

function emptyScore(): EosReviewScore {
  return {
    requirementsCompliance: 0,
    architectureQuality:    0,
    implementationQuality:  0,
    testingQuality:         0,
    securityQuality:        0,
    documentationQuality:   0,
    demoQuality:            0,
    overallScore:           0,
  }
}

interface ReviewFormProps {
  story:         EosStory
  wp:            EosWorkPackage
  reviewerEmail: string
  reviewerUid:   string
  organisationId?: string
  partnerId?:    string
  onSubmitted:   (review: EosReview) => void
  onCancel:      () => void
}

function ReviewForm({ story, wp, reviewerEmail, reviewerUid, organisationId, partnerId, onSubmitted, onCancel }: ReviewFormProps) {
  const [score,     setScore]     = useState<EosReviewScore>(emptyScore())
  const [comments,  setComments]  = useState('')
  const [decision,  setDecision]  = useState<EosApprovalDecision>('pending')
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function setField(key: keyof Omit<EosReviewScore, 'overallScore'>, value: number) {
    setScore(prev => {
      const next = { ...prev, [key]: value }
      next.overallScore = calculateOverallScore(next)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comments.trim()) return
    if (decision === 'pending') { setError('Please select Approve or Request Rework.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const now    = new Date().toISOString()
      const review = await submitReview({
        storyId:       story.storyId,
        workPackageId: wp.workPackageId,
        productKey:    'battery_pm',
        reviewerEmail,
        reviewerUid,
        organisationId,
        partnerId,
        score,
        comments:      comments.trim(),
        decision,
        submittedAt:   now,
      })
      onSubmitted(review)
    } catch {
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldCls = `w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition`

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-gray-50 border border-border rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-text-secondary mb-0.5">{story.storyId} — {wp.workPackageId}</p>
        <p className="text-sm font-bold text-text-primary">{story.title}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Score fields */}
      <div className="card p-4">
        <p className="text-xs font-bold text-text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          Review Scores (out of 10)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCORE_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-text-secondary block mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={10} step={1}
                  value={score[key]}
                  onChange={e => setField(key, Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-bold text-text-primary w-6 text-right">{score[key]}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">Overall Score</span>
          <span className={`text-xl font-bold ${
            score.overallScore >= 8 ? 'text-success' : score.overallScore >= 6 ? 'text-warning' : 'text-error'
          }`}>
            {score.overallScore.toFixed(1)} / 10
          </span>
        </div>
      </div>

      {/* Comments */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
          Reviewer Comments <span className="text-error">*</span>
        </label>
        <textarea
          required rows={4}
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Provide detailed feedback for the engineer…"
          className={`${fieldCls} resize-none`}
        />
      </div>

      {/* Decision */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">
          Decision <span className="text-error">*</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDecision('approved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
              decision === 'approved'
                ? 'bg-success text-white border-success'
                : 'bg-white text-text-secondary border-border hover:border-success/40 hover:text-success'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => setDecision('rework_requested')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
              decision === 'rework_requested'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-text-secondary border-border hover:border-amber-400 hover:text-amber-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Request Rework
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <button type="button" onClick={onCancel}
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting || !comments.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white
            text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          Submit Review
        </button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  workPackages:  EosWorkPackage[]
  storyStates?:  Record<string, EosStoryState>
  reviewerEmail: string
  reviewerUid:   string
  organisationId?: string
  partnerId?:    string
}

export function ReviewQueue({ workPackages, storyStates = {}, reviewerEmail, reviewerUid, organisationId, partnerId }: Props) {
  const [reviewingStory, setReviewingStory] = useState<{ story: EosStory; wp: EosWorkPackage } | null>(null)
  const [submitted,      setSubmitted]      = useState<EosReview[]>([])

  const reviewableStories = workPackages.flatMap(wp =>
    wp.stories
      .filter(s => {
        const status = storyStates[s.storyId]?.status ?? s.status
        return status === 'technical_review' || status === 'ready_for_verification'
      })
      .filter(s => !submitted.some(r => r.storyId === s.storyId))
      .map(s => ({
        story: { ...s, status: storyStates[s.storyId]?.status ?? s.status },
        wp,
      }))
  )

  if (reviewingStory) {
    return (
      <div className="max-w-2xl">
        <ReviewForm
          story={reviewingStory.story}
          wp={reviewingStory.wp}
          reviewerEmail={reviewerEmail}
          reviewerUid={reviewerUid}
          organisationId={organisationId}
          partnerId={partnerId}
          onSubmitted={r => {
            setSubmitted(prev => [...prev, r])
            setReviewingStory(null)
          }}
          onCancel={() => setReviewingStory(null)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Review Queue</h3>
        <span className="text-xs font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">
          {reviewableStories.length}
        </span>
      </div>

      {submitted.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/5 border border-success/20 text-success text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {submitted.length} review{submitted.length > 1 ? 's' : ''} submitted this session.
        </div>
      )}

      {reviewableStories.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <ClipboardCheck className="w-8 h-8 text-border mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No stories awaiting review.</p>
          <p className="text-xs text-text-secondary/70 mt-1">Stories in Technical Review status will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviewableStories.map(({ story, wp }) => (
            <div key={story.storyId} className="border border-border rounded-xl p-4 bg-white flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-text-secondary">{story.storyId}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${EOS_STORY_STATUS_COLORS[story.status]}`}>
                    {EOS_STORY_STATUS_LABELS[story.status]}
                  </span>
                  <span className="text-[10px] text-text-secondary">{wp.workPackageId}</span>
                </div>
                <p className="text-sm font-semibold text-text-primary line-clamp-1">{story.title}</p>
              </div>
              <button
                onClick={() => setReviewingStory({ story, wp })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shrink-0"
              >
                Review
                <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
