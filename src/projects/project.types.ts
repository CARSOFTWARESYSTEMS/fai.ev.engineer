import type { ProjectPriority } from './projectPriority'

// ─── Project status ───────────────────────────────────────────────────────────
// Keep 'in-progress' and 'complete' in union for backward-compat with existing
// Firestore documents. New documents use 'in-progress', 'review', 'completed'.

export type ProjectStatus =
  | 'draft'
  | 'in-progress'
  | 'review'
  | 'complete'       // legacy — display as "Completed"
  | 'completed'
  | 'archived'

export type EditableProjectStatus = 'draft' | 'in-progress' | 'review' | 'completed' | 'archived'

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

  // Priority — defaults to 'medium' if missing
  priority?: ProjectPriority

  // Due date
  dueDate?: unknown                  // Firestore Timestamp
  defaultDueDaysApplied?: number

  // PDF Drawing — stored in Google Drive under FAI.EV.ENGINEER/{uid}/{projectId}/
  sourcePdfName: string
  sourcePdfSize?: number
  sourcePdfUploadedAt?: unknown
  sourcePdfUploadedBy?: string
  pdfStatus?: 'none' | 'uploaded'

  // Google Drive folder + file references
  googleDriveFileId: string
  googleDriveViewUrl?: string
  googleDriveRootFolderId?: string
  googleDriveUserFolderId?: string
  googleDriveProjectFolderId?: string

  // Timestamps — stored as Firestore Timestamp, typed as unknown for safety
  createdAt: unknown
  updatedAt: unknown
}

// ─── Input shape for createProject() ─────────────────────────────────────────

export interface CreateProjectInput {
  projectName: string
  partNumber: string
  drawingNumber: string
  drawingRevision: string
  customerName?: string
  partName?: string
  material?: string
  description?: string
}

// ─── Input shape for updateProject() ─────────────────────────────────────────

export interface UpdateProjectInput {
  projectName?: string
  customerName?: string
  partNumber?: string
  partName?: string
  drawingNumber?: string
  drawingRevision?: string
  material?: string
  description?: string
  status?: EditableProjectStatus
}

// ─── Display helpers ──────────────────────────────────────────────────────────

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
  'draft':       'Draft',
  'in-progress': 'In Progress',
  'review':      'Review',
  'complete':    'Completed',
  'completed':   'Completed',
  'archived':    'Archived',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  'draft':       'bg-warning/10 text-warning',
  'in-progress': 'bg-primary/10 text-primary',
  'review':      'bg-purple-100 text-purple-700',
  'complete':    'bg-success/10 text-success',
  'completed':   'bg-success/10 text-success',
  'archived':    'bg-gray-100 text-text-secondary',
}

export const EDITABLE_STATUS_OPTIONS: EditableProjectStatus[] = [
  'draft', 'in-progress', 'review', 'completed', 'archived',
]
