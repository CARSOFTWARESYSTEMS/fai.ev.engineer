import { useState } from 'react'
import { Users, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { assignStory } from '../services/storyLifecycle.service'
import type { EosStoryState, EosRoleAccess } from '../types/eos.types'

interface Props {
  storyId:       string
  workPackageId: string
  productKey:    string
  storyState:    EosStoryState | null
  access:        EosRoleAccess
}

export function AssignmentPanel({ storyId, workPackageId, productKey, storyState, access }: Props) {
  const { firebaseUser } = useAuth()

  const [editing,       setEditing]       = useState(false)
  const [engineerEmail, setEngineerEmail] = useState(storyState?.assignedEngineerEmail ?? '')
  const [engineerName,  setEngineerName]  = useState(storyState?.assignedEngineerName  ?? '')
  const [reviewerEmail, setReviewerEmail] = useState(storyState?.assignedReviewerEmail ?? '')
  const [approverEmail, setApproverEmail] = useState(storyState?.assignedApproverEmail ?? '')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  function startEdit() {
    setEngineerEmail(storyState?.assignedEngineerEmail ?? '')
    setEngineerName(storyState?.assignedEngineerName   ?? '')
    setReviewerEmail(storyState?.assignedReviewerEmail ?? '')
    setApproverEmail(storyState?.assignedApproverEmail ?? '')
    setEditing(true)
    setSaved(false)
  }

  async function handleSave() {
    if (!firebaseUser?.email) return
    setSaving(true)
    setError(null)
    try {
      await assignStory(
        storyId, workPackageId, productKey,
        {
          engineerEmail: engineerEmail.trim() || undefined,
          engineerName:  engineerName.trim()  || undefined,
          reviewerEmail: reviewerEmail.trim() || undefined,
          approverEmail: approverEmail.trim() || undefined,
        },
        { email: firebaseUser.email, name: firebaseUser.displayName ?? firebaseUser.email },
      )
      setSaved(true)
      setEditing(false)
    } catch {
      setError('Failed to save assignments. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = `w-full px-3 py-2 rounded-xl border border-border bg-white text-xs
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">Assignments</span>
        </div>
        {access.isManager && !editing && (
          <button
            onClick={startEdit}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {storyState?.assignedEngineerEmail ? 'Edit' : 'Assign'}
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Assignments saved.
        </div>
      )}

      {editing ? (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Engineer Email
            </label>
            <input type="email" value={engineerEmail} onChange={e => setEngineerEmail(e.target.value)}
              placeholder="engineer@company.com" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Engineer Name
            </label>
            <input type="text" value={engineerName} onChange={e => setEngineerName(e.target.value)}
              placeholder="Full Name" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Reviewer Email
            </label>
            <input type="email" value={reviewerEmail} onChange={e => setReviewerEmail(e.target.value)}
              placeholder="reviewer@company.com" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide block mb-1">
              Approver Email
            </label>
            <input type="email" value={approverEmail} onChange={e => setApproverEmail(e.target.value)}
              placeholder="approver@company.com" className={inputCls} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button onClick={() => setEditing(false)}
              className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl
                bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Assignments
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AssignmentRow label="Engineer"  value={storyState?.assignedEngineerEmail} name={storyState?.assignedEngineerName} />
          <AssignmentRow label="Reviewer"  value={storyState?.assignedReviewerEmail} />
          <AssignmentRow label="Approver"  value={storyState?.assignedApproverEmail} />
          {!storyState?.assignedEngineerEmail && !storyState?.assignedReviewerEmail && (
            <p className="text-xs text-text-secondary italic">
              No assignments yet.{access.isManager ? ' Click "Assign" to assign team members.' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AssignmentRow({ label, value, name }: { label: string; value?: string | null; name?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-text-secondary w-16 shrink-0">{label}</span>
      <span className="font-medium text-text-primary">{name ?? value}</span>
      {name && <span className="text-text-secondary/70">({value})</span>}
    </div>
  )
}
