import { useState } from 'react'
import { FileText, Save, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { updateEvidence } from '../services/storyLifecycle.service'
import type { EosEvidence, EosStoryState } from '../types/eos.types'
import { emptyEvidence } from '../types/eos.types'

interface EvidenceFieldDef {
  key:         keyof EosEvidence
  label:       string
  placeholder: string
}

const EVIDENCE_FIELDS: EvidenceFieldDef[] = [
  { key: 'googleDriveFolder',  label: 'Google Drive Folder',  placeholder: 'https://drive.google.com/drive/folders/...' },
  { key: 'architectureDoc',    label: 'Architecture Document', placeholder: 'https://docs.google.com/...' },
  { key: 'designDoc',          label: 'Design Document',       placeholder: 'https://docs.google.com/...' },
  { key: 'githubRepo',         label: 'GitHub Repository',     placeholder: 'https://github.com/org/repo' },
  { key: 'githubBranch',       label: 'GitHub Branch',         placeholder: 'feature/wp-001-s1-battery-id-schema' },
  { key: 'pullRequest',        label: 'Pull Request',          placeholder: 'https://github.com/org/repo/pull/...' },
  { key: 'verificationReport', label: 'Verification Report',   placeholder: 'https://drive.google.com/...' },
  { key: 'securityReport',     label: 'Security Report',       placeholder: 'https://drive.google.com/...' },
  { key: 'demoVideo',          label: 'Demo Video',            placeholder: 'https://drive.google.com/... or https://youtube.com/...' },
  { key: 'presentation',       label: 'Presentation',          placeholder: 'https://docs.google.com/presentation/...' },
]

interface Props {
  storyId:       string
  workPackageId: string
  productKey:    string
  storyState:    EosStoryState | null
  canEdit:       boolean
}

export function StoryEvidencePanel({ storyId, workPackageId, productKey, storyState, canEdit }: Props) {
  const { firebaseUser } = useAuth()

  const evidence = storyState?.evidence ?? emptyEvidence()

  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState<EosEvidence>(evidence)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function startEdit() {
    setDraft({ ...evidence })
    setEditing(true)
    setSaved(false)
  }

  async function handleSave() {
    if (!firebaseUser?.email) return
    setSaving(true)
    setError(null)
    try {
      await updateEvidence(storyId, workPackageId, productKey, draft, {
        email: firebaseUser.email,
        name:  firebaseUser.displayName ?? firebaseUser.email,
      })
      setSaved(true)
      setEditing(false)
    } catch {
      setError('Failed to save evidence. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const hasAnyEvidence = Object.values(evidence).some(v => v)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">Engineering Evidence</span>
        </div>
        {canEdit && !editing && (
          <button
            onClick={startEdit}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {hasAnyEvidence ? 'Edit Links' : 'Add Links'}
          </button>
        )}
      </div>

      <p className="text-xs text-text-secondary">
        Store links to all engineering artefacts. No file uploads — metadata only.
      </p>

      {error && (
        <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Evidence links saved.
        </div>
      )}

      {editing ? (
        <div className="flex flex-col gap-3">
          {EVIDENCE_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                {label}
              </label>
              <input
                type="url"
                value={draft[key]}
                onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          ))}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              onClick={() => setEditing(false)}
              className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl
                bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {EVIDENCE_FIELDS.filter(({ key }) => evidence[key]).map(({ key, label }) => (
            <a
              key={key}
              href={evidence[key]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {label}
            </a>
          ))}
          {!hasAnyEvidence && (
            <p className="text-xs text-text-secondary italic">
              No evidence links yet.{canEdit ? ' Click "Add Links" to add artefact URLs.' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
