import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderPlus, AlertCircle, Key, Building2 } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { useBranding } from '../hooks/useBranding'
import { createProject } from '../projects/project.service'
import type { ProjectPriority } from '../projects/projectPriority'
import { PRIORITY_LABELS, PRIORITY_BADGE_CLASS } from '../projects/projectPriority'

interface FormState {
  projectName: string
  customerName: string
  partNumber: string
  partName: string
  drawingNumber: string
  drawingRevision: string
  material: string
  description: string
  priority: ProjectPriority
}

const PRIORITY_OPTIONS: ProjectPriority[] = ['critical', 'high', 'medium', 'low']

const EMPTY: FormState = {
  projectName: '',
  customerName: '',
  partNumber: '',
  partName: '',
  drawingNumber: '',
  drawingRevision: '',
  material: '',
  description: '',
  priority: 'medium',
}

function Field({
  label,
  id,
  required,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string
  id: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  placeholder: string
  mono?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
        {required && <span className="text-error ml-1">*</span>}
        {!required && <span className="text-text-secondary font-normal text-xs ml-1.5">optional</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-field placeholder-slate-300 ${mono ? 'font-mono' : ''}`}
        required={required}
        autoComplete="off"
      />
    </div>
  )
}

export function CreateProjectPage() {
  const navigate = useNavigate()
  const { user, firebaseUser } = useAuth()
  const { productKey, organizationConfig } = useProductConfig()
  const { branding } = useBranding()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')

  const set = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrorCode('')

    // Client-side required validation
    if (!form.projectName.trim()) { setError('Project Name is required.'); return }
    if (!form.partNumber.trim())   { setError('Part Number is required.'); return }
    if (!form.drawingNumber.trim()) { setError('Drawing Number is required.'); return }
    if (!form.drawingRevision.trim()) { setError('Drawing Revision is required.'); return }

    setIsSaving(true)
    try {
      const project = await createProject(
        {
          projectName: form.projectName,
          customerName: form.customerName,
          partNumber: form.partNumber,
          partName: form.partName,
          drawingNumber: form.drawingNumber,
          drawingRevision: form.drawingRevision,
          material: form.material,
          description: form.description,
          priority: form.priority,
        },
        {
          uid: firebaseUser!.uid,
          productKey,
          organizationCode: user?.organizationCode || 'default',
          organizationName: user?.organizationName || organizationConfig.organizationName,
          defaultDueDays: organizationConfig.settings?.defaultDueDays ?? 7,
        }
      )
      navigate(`/projects/${project.projectId}`, { replace: true })
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      const code = e?.code ?? 'unknown'
      setErrorCode(code)
      if (code.includes('permission-denied') || code.includes('insufficient-permissions')) {
        setError('Permission denied — Firestore rules are blocking project creation. Please check Firebase Console → Firestore → Rules and ensure the projects collection rule is published.')
      } else if (code.includes('unauthenticated')) {
        setError('Your session has expired. Please sign out and sign in again.')
      } else if (code.includes('unavailable') || code.includes('network-request-failed')) {
        setError('Firestore is temporarily unavailable. Please check your connection and try again.')
      } else if (code.includes('invalid-argument')) {
        setError('Invalid project data. Please check all entered details and try again.')
      } else {
        setError(e?.message ?? 'Failed to create project. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="text-border">/</span>
              <span className="text-sm font-semibold text-text-primary">New Project</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <div className="hidden sm:flex flex-col gap-1 leading-none">
                <span className="text-sm font-bold text-text-primary">{branding.businessName}</span>
                <span className="text-[10px] text-text-secondary">
                  powered by{' '}
                  <a href={branding.poweredByUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                    {branding.poweredByText.replace(/^powered by\s+/i, '') || 'EV.ENGINEER'}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 pb-28">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Create New Project</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Enter drawing and part information to start an FAI project.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {errorCode && <p className="mt-1.5 font-mono text-xs text-error/70 pl-6">code: {errorCode}</p>}
          </div>
        )}

        <form id="create-project-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Required fields */}
          <div className="card p-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-5">
              Required Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field
                  label="Project Name" id="projectName" required
                  value={form.projectName} onChange={set('projectName')}
                  placeholder="e.g. FAI — Bracket Assembly Rev B"
                />
              </div>
              <Field
                label="Part Number" id="partNumber" required mono
                value={form.partNumber} onChange={set('partNumber')}
                placeholder="e.g. PART-2847"
              />
              <Field
                label="Drawing Number" id="drawingNumber" required mono
                value={form.drawingNumber} onChange={set('drawingNumber')}
                placeholder="e.g. DWG-2847"
              />
              <Field
                label="Drawing Revision" id="drawingRevision" required mono
                value={form.drawingRevision} onChange={set('drawingRevision')}
                placeholder="e.g. Rev B"
              />
              <Field
                label="Customer Name" id="customerName"
                value={form.customerName} onChange={set('customerName')}
                placeholder="e.g. Airbus"
              />
            </div>
          </div>

          {/* Optional fields */}
          <div className="card p-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-5">
              Additional Details <span className="font-normal normal-case text-text-secondary">(optional)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Part Name" id="partName"
                value={form.partName} onChange={set('partName')}
                placeholder="e.g. Mounting Bracket"
              />
              <Field
                label="Material" id="material"
                value={form.material} onChange={set('material')}
                placeholder="e.g. Aluminium 6061-T6"
              />
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1.5">
                  Description
                  <span className="text-text-secondary font-normal text-xs ml-1.5">optional</span>
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description')(e.target.value)}
                  placeholder="Brief description of the FAI scope or notes…"
                  className="input-field resize-none placeholder-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="card p-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Priority <span className="text-error ml-1">*</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRIORITY_OPTIONS.map((p) => {
                const isSelected = form.priority === p
                return (
                  <label key={p}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? `${PRIORITY_BADGE_CLASS[p]} border-current/40 shadow-sm`
                        : 'border-border bg-white hover:border-primary/30 hover:bg-gray-50'
                    }`}>
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={isSelected}
                      onChange={() => set('priority')(p)}
                      className="sr-only"
                    />
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      p === 'critical' ? 'bg-red-500'
                      : p === 'high'   ? 'bg-orange-500'
                      : p === 'medium' ? 'bg-blue-500'
                      : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-semibold">{PRIORITY_LABELS[p]}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Auto-filled context */}
          <div className="card p-5 bg-gray-50">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Project Context (auto-filled)
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Key className="w-4 h-4 text-primary shrink-0" />
                <span>Product Key:</span>
                <span className="font-mono font-semibold text-text-primary">{productKey}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span>Organization:</span>
                <span className="font-medium text-text-primary">
                  {user?.organizationName || organizationConfig.organizationName}
                </span>
                <span className="font-mono text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">
                  {user?.organizationCode || 'default'}
                </span>
              </div>
            </div>
          </div>

        </form>
      </main>

      {/* ── Sticky action bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            type="submit"
            form="create-project-form"
            disabled={isSaving}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                Create Project
              </>
            )}
          </button>
          <Link to="/dashboard" className="btn-ghost text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  )
}
