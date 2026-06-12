import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import {
  type ReviewDecision,
  type EditableProjectStatus,
  REVIEW_DECISION_LABELS,
  VALID_DECISIONS_FOR_STATUS,
  PROJECT_STATUS_LABELS,
} from '../../projects/project.types'

interface Props {
  targetStatus: EditableProjectStatus
  onConfirm: (decision: ReviewDecision, comment: string) => void
  onCancel: () => void
}

export function ReviewDecisionModal({ targetStatus, onConfirm, onCancel }: Props) {
  const validDecisions = VALID_DECISIONS_FOR_STATUS[targetStatus] ?? []
  const [decision, setDecision] = useState<ReviewDecision | ''>(
    validDecisions.length === 1 ? validDecisions[0] : ''
  )
  const [comment, setComment] = useState('')

  const commentTrimmed = comment.trim()
  const canConfirm = decision !== '' && commentTrimmed.length >= 5

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm(decision as ReviewDecision, commentTrimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Review Decision Required</h2>
            <p className="text-sm text-text-secondary mt-1">
              Moving to{' '}
              <span className="font-semibold text-text-primary">
                {PROJECT_STATUS_LABELS[targetStatus]}
              </span>{' '}
              requires a decision and comment.
            </p>
          </div>
        </div>

        {/* Decision */}
        <div className="mb-4">
          <label htmlFor="review-decision" className="block text-sm font-medium text-text-primary mb-1.5">
            Decision
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="review-decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value as ReviewDecision)}
            className="input-field"
          >
            {validDecisions.length !== 1 && (
              <option value="" disabled>Select a decision…</option>
            )}
            {validDecisions.map((d) => (
              <option key={d} value={d}>{REVIEW_DECISION_LABELS[d]}</option>
            ))}
          </select>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label htmlFor="review-comment" className="block text-sm font-medium text-text-primary mb-1.5">
            Comment
            <span className="text-error ml-1">*</span>
            <span className="text-text-secondary font-normal text-xs ml-1.5">min. 5 characters</span>
          </label>
          <textarea
            id="review-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe the basis for this decision…"
            className="input-field resize-none placeholder-slate-300"
            autoFocus
          />
          {comment.length > 0 && comment.trim().length < 5 && (
            <p className="mt-1.5 text-xs text-error">
              Comment must be at least 5 characters.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-sm px-4 py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Decision
          </button>
        </div>
      </div>
    </div>
  )
}
