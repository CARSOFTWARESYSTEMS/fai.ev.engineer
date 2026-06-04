// ─── Project status ───────────────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'in-progress' | 'complete' | 'archived'

// ─── Firestore document: projects/{projectId} ─────────────────────────────────

export interface FAIProject {
  projectId: string
  uid: string
  productKey: string
  organizationCode: string
  organizationName: string

  // Drawing metadata
  projectName: string
  customerName: string
  partNumber: string
  partName: string
  drawingNumber: string
  drawingRevision: string
  material: string
  description: string

  // State
  status: ProjectStatus
  version: number

  // Future: PDF and Drive
  sourcePdfName: string
  googleDriveFileId: string

  // Timestamps — stored as Firestore Timestamp, typed as unknown for safety
  createdAt: unknown
  updatedAt: unknown
}

// ─── Input shape for createProject() ─────────────────────────────────────────

export interface CreateProjectInput {
  // Required
  projectName: string
  partNumber: string
  drawingNumber: string
  drawingRevision: string
  // Optional
  customerName?: string
  partName?: string
  material?: string
  description?: string
}

// ─── Display helper ───────────────────────────────────────────────────────────

export function fmtTimestamp(ts: unknown): string {
  if (!ts) return '—'
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date })
      .toDate()
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  if (typeof ts === 'string') {
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return '—'
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  complete: 'Complete',
  archived: 'Archived',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-warning/10 text-warning',
  'in-progress': 'bg-primary/10 text-primary',
  complete: 'bg-success/10 text-success',
  archived: 'bg-gray-100 text-text-secondary',
}
