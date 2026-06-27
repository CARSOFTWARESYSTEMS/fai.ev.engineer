import { useState, useEffect, useRef } from 'react'
import { Users, Save, Loader2, CheckCircle2, ChevronDown, Search, UserX } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useUserOrg } from '../../../hooks/useUserOrg'
import { subscribeOrganisationMembers } from '../../../services/organisationService'
import { assignStory } from '../services/storyLifecycle.service'
import type { OrganisationMember } from '../../../services/organisationService'
import type { EosStoryState, EosRoleAccess } from '../types/eos.types'

interface Props {
  storyId:       string
  workPackageId: string
  productKey:    string
  storyState:    EosStoryState | null
  access:        EosRoleAccess
}

// ─── Member picker combobox ───────────────────────────────────────────────────

interface MemberPickerProps {
  label:        string
  value:        string
  onChange:     (email: string) => void
  members:      OrganisationMember[]
  canInviteNew: boolean
  placeholder?: string
}

function MemberPicker({ label, value, onChange, members, canInviteNew, placeholder }: MemberPickerProps) {
  const [query,  setQuery]  = useState(value)
  const [open,   setOpen]   = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)

  // Sync query when parent resets value
  useEffect(() => { setQuery(value) }, [value])

  const filtered = members.filter(m =>
    m.userEmail.toLowerCase().includes(query.toLowerCase()),
  )

  function select(email: string) {
    onChange(email)
    setQuery(email)
    setOpen(false)
  }

  function handleBlur(e: React.FocusEvent) {
    // Close only if focus leaves the entire container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false)
      if (!canInviteNew) {
        // Revert to last confirmed value if text doesn't match a member
        const match = members.find(m => m.userEmail.toLowerCase() === query.toLowerCase())
        if (!match) { setQuery(value); return }
        onChange(match.userEmail)
      } else {
        onChange(query.trim())
      }
    }
  }

  const inputCls = `w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-white text-xs
    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition`

  return (
    <div ref={containerRef} onBlur={handleBlur}>
      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide block mb-1">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={query}
          placeholder={placeholder ?? 'Search members…'}
          readOnly={!canInviteNew && members.length > 0}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          className={`${inputCls} cursor-${!canInviteNew && members.length > 0 ? 'pointer' : 'text'}`}
        />
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="mt-1 rounded-xl border border-border bg-white shadow-lg z-50 max-h-44 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-xs text-text-secondary italic flex items-center gap-2">
              <UserX className="w-3.5 h-3.5" />
              {members.length === 0 ? 'No org members loaded.' : 'No members match.'}
              {canInviteNew && query && (
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); select(query.trim()) }}
                  className="ml-auto text-primary font-semibold hover:underline"
                >
                  Use "{query.trim()}"
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); select('') }}
                className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-gray-50 border-b border-border"
              >
                — Unassign
              </button>
              {filtered.map(m => (
                <button
                  key={m.membershipId}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); select(m.userEmail) }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-primary-light/60 transition-colors flex items-center justify-between gap-2 ${
                    value === m.userEmail ? 'bg-primary-light text-primary font-semibold' : 'text-text-primary'
                  }`}
                >
                  <span className="truncate">{m.userEmail}</span>
                  <span className="text-[10px] text-text-secondary shrink-0 capitalize">{m.role}</span>
                </button>
              ))}
              {canInviteNew && query && !filtered.some(m => m.userEmail === query) && (
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); select(query.trim()) }}
                  className="w-full text-left px-3 py-2 text-xs text-primary font-medium hover:bg-primary-light/60 border-t border-border"
                >
                  Use "{query.trim()}" (invite)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssignmentPanel({ storyId, workPackageId, productKey, storyState, access }: Props) {
  const { firebaseUser }        = useAuth()
  const { org }                 = useUserOrg()
  const [members, setMembers]   = useState<OrganisationMember[]>([])

  const [editing,       setEditing]       = useState(false)
  const [engineerEmail, setEngineerEmail] = useState(storyState?.assignedEngineerEmail ?? '')
  const [reviewerEmail, setReviewerEmail] = useState(storyState?.assignedReviewerEmail ?? '')
  const [approverEmail, setApproverEmail] = useState(storyState?.assignedApproverEmail ?? '')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Subscribe to active org members
  useEffect(() => {
    if (!org?.organisationId) return
    return subscribeOrganisationMembers(org.organisationId, all => {
      setMembers(all.filter(m => m.active))
    })
  }, [org?.organisationId])

  function startEdit() {
    setEngineerEmail(storyState?.assignedEngineerEmail ?? '')
    setReviewerEmail(storyState?.assignedReviewerEmail ?? '')
    setApproverEmail(storyState?.assignedApproverEmail ?? '')
    setEditing(true)
    setSaved(false)
    setError(null)
  }

  async function handleSave() {
    if (!firebaseUser?.email) return
    setSaving(true)
    setError(null)
    try {
      await assignStory(
        storyId, workPackageId, productKey,
        {
          engineerEmail: engineerEmail || undefined,
          engineerName:  engineerEmail || undefined,
          reviewerEmail: reviewerEmail || undefined,
          approverEmail: approverEmail || undefined,
        },
        { email: firebaseUser.email, name: firebaseUser.displayName ?? firebaseUser.email },
      )
      setSaved(true)
      setEditing(false)
    } catch (err) {
      console.error('[AssignmentPanel] assignStory failed:', err)
      setError('Failed to save assignments. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Filter members by role relevance for each field
  const engineerMembers = members.filter(m =>
    ['engineer', 'manager', 'owner'].includes(m.role),
  )
  const reviewerMembers = members.filter(m =>
    ['manager', 'owner', 'approver', 'inspector'].includes(m.role),
  )
  const approverMembers = members.filter(m =>
    ['manager', 'owner', 'approver'].includes(m.role),
  )

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
          {!access.canInviteNew && members.length === 0 && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No org members found. Join an organisation to assign team members.
            </p>
          )}

          <MemberPicker
            label="Engineer"
            value={engineerEmail}
            onChange={setEngineerEmail}
            members={engineerMembers}
            canInviteNew={access.canInviteNew}
            placeholder="Select engineer…"
          />
          <MemberPicker
            label="Reviewer"
            value={reviewerEmail}
            onChange={setReviewerEmail}
            members={reviewerMembers}
            canInviteNew={access.canInviteNew}
            placeholder="Select reviewer…"
          />
          <MemberPicker
            label="Approver"
            value={approverEmail}
            onChange={setApproverEmail}
            members={approverMembers}
            canInviteNew={access.canInviteNew}
            placeholder="Select approver…"
          />

          {!access.canInviteNew && (
            <p className="text-[10px] text-text-secondary italic">
              Only existing org members can be assigned. Contact your owner or admin to invite new members.
            </p>
          )}

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
          <AssignmentRow label="Engineer" value={storyState?.assignedEngineerEmail} name={storyState?.assignedEngineerName} />
          <AssignmentRow label="Reviewer" value={storyState?.assignedReviewerEmail} />
          <AssignmentRow label="Approver" value={storyState?.assignedApproverEmail} />
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
  const displayName = name && name !== value ? name : null
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-text-secondary w-16 shrink-0">{label}</span>
      <span className="font-medium text-text-primary">{displayName ?? value}</span>
      {displayName && <span className="text-text-secondary/70">({value})</span>}
    </div>
  )
}
