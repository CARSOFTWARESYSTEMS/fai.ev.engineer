import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  Key,
  Building2,
  Lock,
  UploadCloud,
  Eye,
  FileText,
  RefreshCw,
  Shield,
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { getProjectById, updateProject, deleteProject } from '../projects/project.service'
import {
  uploadProjectPdf,
  deleteProjectPdf,
  validatePdfFile,
  getPdfErrorMessage,
} from '../projects/projectFile.service'
import { loadGisScript, requestDriveToken } from '../lib/googleDrive'
import {
  type FAIProject,
  type EditableProjectStatus,
  fmtTimestamp,
  PROJECT_STATUS_LABELS,
  EDITABLE_STATUS_OPTIONS,
} from '../projects/project.types'
import {
  PRIORITY_LABELS,
  normalisePriority,
  type ProjectPriority,
} from '../projects/projectPriority'
import { toDate } from '../projects/projectDueDate'
import { DeleteProjectModal } from '../components/ui/DeleteProjectModal'

interface FormState {
  projectName: string
  customerName: string
  partNumber: string
  partName: string
  drawingNumber: string
  drawingRevision: string
  material: string
  description: string
  status: EditableProjectStatus
  priority: ProjectPriority
  dueDate: string
}

const EDITABLE_STATUSES = EDITABLE_STATUS_OPTIONS
const PRIORITY_OPTIONS: ProjectPriority[] = ['critical', 'high', 'medium', 'low']

function toDateInputValue(value: unknown): string {
  const date = toDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function firestoreError(err: unknown, action: 'update' | 'delete'): string {
  const code = (err as { code?: string })?.code ?? ''
  if (code.includes('permission-denied')) return `You do not have permission to ${action} this project.`
  if (code.includes('not-found'))         return 'Project not found.'
  if (code.includes('unavailable') || code.includes('network-request-failed'))
    return 'Firestore is temporarily unavailable. Please try again.'
  return `Unable to ${action} project. Please try again.`
}

function Field({ label, id, required, value, onChange, placeholder, mono }: {
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
        autoComplete="off"
      />
    </div>
  )
}

export function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { productConfig } = useProductConfig()

  const [project, setProject] = useState<FAIProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [form, setForm] = useState<FormState>({
    projectName: '',
    customerName: '',
    partNumber: '',
    partName: '',
    drawingNumber: '',
    drawingRevision: '',
    material: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    dueDate: '',
  })

  const [isSaving,     setIsSaving]     = useState(false)
  const [saveError,    setSaveError]    = useState('')
  const [saveSuccess,  setSaveSuccess]  = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [isDeleting,   setIsDeleting]   = useState(false)
  const [deleteError,  setDeleteError]  = useState('')
  const [isUploading,      setIsUploading]      = useState(false)
  const [uploadError,      setUploadError]      = useState('')
  const [isDeletingPdf,    setIsDeletingPdf]    = useState(false)
  const [confirmDeletePdf, setConfirmDeletePdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Pre-load GIS script so Drive token popup fires on button click (user gesture)
  useEffect(() => { loadGisScript().catch(() => {}) }, [])

  // ── Load project ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return
    setIsLoading(true)
    getProjectById(projectId)
      .then((p) => {
        if (!p) { setLoadError('Project not found or you do not have access.'); return }
        if (p.uid !== user?.uid) { setLoadError('You do not have access to this project.'); return }
        setProject(p)
        setForm({
          projectName:     p.projectName,
          customerName:    p.customerName,
          partNumber:      p.partNumber,
          partName:        p.partName,
          drawingNumber:   p.drawingNumber,
          drawingRevision: p.drawingRevision,
          material:        p.material,
          description:     p.description,
          status:          (p.status === 'complete' ? 'completed' : p.status) as EditableProjectStatus,
          priority:        normalisePriority(p.priority),
          dueDate:         toDateInputValue(p.dueDate),
        })
      })
      .catch((err: { code?: string }) => {
        const code = err?.code ?? ''
        setLoadError(
          code.includes('permission-denied')
            ? 'Permission denied — you do not have access to this project.'
            : 'Failed to load project. Please try again.'
        )
      })
      .finally(() => setIsLoading(false))
  }, [projectId, user?.uid])

  // ── PDF upload ──────────────────────────────────────────────────────────────
  const handleUploadClick = async () => {
    setUploadError('')
    try {
      await requestDriveToken(user?.email ?? '')
    } catch (err) {
      setUploadError(getPdfErrorMessage(err))
      return
    }
    fileInputRef.current?.click()
  }

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const validationError = validatePdfFile(file)
    if (validationError) { setUploadError(validationError); return }

    setUploadError('')
    setIsUploading(true)
    try {
      await uploadProjectPdf(
        project!.projectId,
        user!.uid,
        user!.email ?? '',
        file,
        project!.googleDriveFileId || undefined
      )
      const updated = await getProjectById(project!.projectId)
      if (updated) setProject(updated)
    } catch (err) {
      setUploadError(getPdfErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePdf = async () => {
    if (!project || !user) return
    setIsDeletingPdf(true)
    setUploadError('')
    try {
      await deleteProjectPdf(project.projectId, user.uid, project.googleDriveFileId, user.email ?? '')
      const updated = await getProjectById(project.projectId)
      if (updated) setProject(updated)
      setConfirmDeletePdf(false)
    } catch {
      setUploadError('Unable to delete PDF. Please try again.')
      setConfirmDeletePdf(false)
    } finally {
      setIsDeletingPdf(false)
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess(false)

    if (!form.projectName.trim())     { setSaveError('Project Name is required.'); return }
    if (!form.partNumber.trim())      { setSaveError('Part Number is required.'); return }
    if (!form.drawingNumber.trim())   { setSaveError('Drawing Number is required.'); return }
    if (!form.drawingRevision.trim()) { setSaveError('Drawing Revision is required.'); return }

    const isManager = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager'
    if (isManager && !form.dueDate) { setSaveError('Due Date is required for manager updates.'); return }

    setIsSaving(true)
    try {
      await updateProject(projectId!, user!.uid, user!.role, {
        projectName:     form.projectName,
        customerName:    form.customerName,
        partNumber:      form.partNumber,
        partName:        form.partName,
        drawingNumber:   form.drawingNumber,
        drawingRevision: form.drawingRevision,
        material:        form.material,
        description:     form.description,
        ...(isManager ? {
          status:   form.status,
          priority: form.priority,
          dueDate:  form.dueDate,
        } : {}),
      })
      setSaveSuccess(true)
      setTimeout(() => navigate(`/projects/${projectId}`), 800)
    } catch (err) {
      setSaveError(firestoreError(err, 'update'))
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const canDelete = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager'
    if (!canDelete || !projectId || !user) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteProject(projectId, user.uid, user.email ?? '')
      setShowDelete(false)
      navigate('/projects', { replace: true })
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? ''
      setDeleteError(
        msg.includes('Google Drive') ? msg : firestoreError(err, 'delete')
      )
      setShowDelete(false)
      setIsDeleting(false)
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl font-bold text-error">!</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">{loadError || 'Project not found'}</h1>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          Check that you have the correct link, or return to your projects list.
        </p>
        <Link to="/projects" className="btn-primary">Back to Projects</Link>
      </div>
    )
  }

  const isManager = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to={`/projects/${projectId}`}
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Project
              </Link>
              <span className="text-border">/</span>
              <span className="text-sm font-semibold text-text-primary truncate">{project.projectName}</span>
              <span className="text-border shrink-0">/</span>
              <span className="text-sm text-text-secondary shrink-0">Edit</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="hidden sm:block text-sm font-bold text-text-primary">
                {productConfig.productName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 pb-28">
        {/* Page title + status */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Edit Project</h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Update drawing and part information.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-52 shrink-0">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Status
            </label>
            {isManager ? (
              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as EditableProjectStatus }))
                }
                className="input-field"
              >
                {EDITABLE_STATUSES.map((status) => (
                  <option key={status} value={status}>{PROJECT_STATUS_LABELS[status]}</option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 rounded-lg border border-border bg-gray-50 text-sm text-text-secondary select-none">
                {PROJECT_STATUS_LABELS[form.status as keyof typeof PROJECT_STATUS_LABELS] ?? form.status}
              </div>
            )}
          </div>
        </div>

        {/* Admin planning */}
        {isManager && (
          <div className="rounded-xl border border-primary/20 bg-primary-light/50 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Admin Planning</h2>
                <p className="text-xs text-text-secondary">Admin-only planning controls.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="priority" className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Priority
                </label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priority: e.target.value as ProjectPriority }))
                  }
                  className="input-field bg-white"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Due Date
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                  <input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="input-field pl-10 bg-white"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="mb-5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {saveError}
          </div>
        )}

        {/* Save success */}
        {saveSuccess && (
          <div className="mb-5 px-4 py-3 bg-success/10 border border-success/20 text-success text-sm rounded-xl flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Project updated successfully. Redirecting…
          </div>
        )}

        {/* Delete error */}
        {deleteError && (
          <div className="mb-5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {deleteError}
          </div>
        )}

        <form id="edit-project-form" onSubmit={handleSave} className="flex flex-col gap-5">
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

          {/* Drawing PDF */}
          <div className="card p-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Drawing PDF
            </h2>

            {uploadError && (
              <div className="mb-3 px-3 py-2 bg-error/10 border border-error/20 text-error text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {uploadError}
              </div>
            )}

            {project.pdfStatus === 'uploaded' && project.googleDriveFileId ? (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{project.sourcePdfName}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {project.sourcePdfSize
                        ? `${(project.sourcePdfSize / (1024 * 1024)).toFixed(1)} MB · `
                        : ''}
                      {fmtTimestamp(project.sourcePdfUploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/projects/${projectId}/pdf`}
                    className="btn-primary text-sm w-full justify-center"
                  >
                    <Eye className="w-4 h-4" />
                    View PDF
                  </Link>

                  {confirmDeletePdf ? (
                    <div className="flex flex-col items-center gap-2 py-2.5 px-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-xs text-text-secondary">Remove this PDF permanently?</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDeletePdf}
                          disabled={isDeletingPdf}
                          className="text-xs font-semibold text-white bg-error hover:bg-red-700 disabled:opacity-60 px-3 py-1.5 rounded-md transition-colors"
                        >
                          {isDeletingPdf ? 'Deleting…' : 'Yes, Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePdf(false)}
                          disabled={isDeletingPdf}
                          className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={isUploading || isDeletingPdf}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white text-primary font-semibold text-sm rounded-lg border border-primary hover:bg-primary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 shrink-0" />
                        )}
                        {isUploading ? 'Uploading…' : 'Replace PDF'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePdf(true)}
                        disabled={isUploading || isDeletingPdf}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-error font-semibold text-sm rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        Delete PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-5 h-5 text-text-secondary" />
                </div>
                <p className="text-sm text-text-secondary mb-3">No drawing PDF uploaded yet.</p>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload PDF
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfSelect}
            />
          </div>

          {/* Optional fields */}
          <div className="card p-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-5">
              Additional Details{' '}
              <span className="font-normal normal-case text-text-secondary">(optional)</span>
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

          {/* Read-only context */}
          <div className="card p-5 bg-gray-50">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Read-Only Fields
            </h2>
            <div className="divide-y divide-border">
              {[
                { label: 'Product Key',   value: project.productKey,             mono: true,  icon: <Key      className="w-3.5 h-3.5 text-primary" /> },
                { label: 'Org Code',      value: project.organizationCode,       mono: true,  icon: <Building2 className="w-3.5 h-3.5 text-primary" /> },
                { label: 'Organization',  value: project.organizationName,       mono: false, icon: <Building2 className="w-3.5 h-3.5 text-primary" /> },
                { label: 'Version',       value: `v${project.version}`,          mono: true,  icon: null },
                { label: 'Created',       value: fmtTimestamp(project.createdAt),mono: false, icon: null },
                { label: 'Last Updated',  value: fmtTimestamp(project.updatedAt),mono: false, icon: null },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text-secondary flex items-center gap-1.5">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className={`font-medium text-text-primary ${item.mono ? 'font-mono text-xs' : ''}`}>
                    {item.value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </form>
      </main>

      {/* ── Sticky action bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="edit-project-form"
              disabled={isSaving || saveSuccess}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <Link to={`/projects/${projectId}`} className="btn-ghost text-sm">Cancel</Link>
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => { setDeleteError(''); setShowDelete(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 font-semibold text-sm rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          )}
        </div>
      </div>

      {isManager && showDelete && (
        <DeleteProjectModal
          projectName={project.projectName}
          isDeleting={isDeleting}
          onCancel={() => { setShowDelete(false); setDeleteError('') }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
