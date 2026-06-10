import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FolderPlus,
  FileText,
  Search,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Eye,
  ArrowRight,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  Clock,
  Flag,
  CalendarDays,
  UploadCloud,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { getUserProjects, deleteProject } from '../projects/project.service'
import {
  type FAIProject,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '../projects/project.types'
import {
  getPriorityLabel,
  getPriorityBadgeClass,
  getPriorityDotClass,
  normalisePriority,
  type ProjectPriority,
} from '../projects/projectPriority'
import {
  getProjectDueDate,
  filterProjects,
  type DueDateFilter,
} from '../projects/projectFilters'
import {
  fmtDueDate,
  dueDateStatus,
  isOverdue,
  isDueToday,
  isDueThisWeek,
  isDueThisMonth,
} from '../projects/projectDueDate'
import { DeleteProjectModal } from '../components/ui/DeleteProjectModal'

type ViewMode = 'priority' | 'date' | 'list' | 'kanban'

// ─── Priority column config ───────────────────────────────────────────────────

const PRIORITY_GROUPS: { key: ProjectPriority; label: string; colorCls: string }[] = [
  { key: 'critical', label: 'Critical', colorCls: 'border-t-red-500' },
  { key: 'high',     label: 'High',     colorCls: 'border-t-orange-500' },
  { key: 'medium',   label: 'Medium',   colorCls: 'border-t-blue-500' },
  { key: 'low',      label: 'Low',      colorCls: 'border-t-gray-400' },
]

// ─── Date bucket config ───────────────────────────────────────────────────────

type DateBucket = 'overdue' | 'today' | 'this_week' | 'this_month' | 'later' | 'none'

const DATE_GROUPS: {
  key: DateBucket
  label: string
  headerCls: string
  accentCls: string
}[] = [
  { key: 'overdue',    label: 'Overdue',     headerCls: 'text-red-600',         accentCls: 'border-l-red-500' },
  { key: 'today',      label: 'Today',       headerCls: 'text-orange-600',      accentCls: 'border-l-orange-500' },
  { key: 'this_week',  label: 'This Week',   headerCls: 'text-yellow-700',      accentCls: 'border-l-yellow-500' },
  { key: 'this_month', label: 'This Month',  headerCls: 'text-blue-600',        accentCls: 'border-l-blue-500' },
  { key: 'later',      label: 'Later',       headerCls: 'text-text-secondary',  accentCls: 'border-l-gray-400' },
  { key: 'none',       label: 'No Due Date', headerCls: 'text-text-secondary',  accentCls: 'border-l-gray-200' },
]

function getDateBucket(project: FAIProject): DateBucket {
  const due = getProjectDueDate(project)
  if (!due) return 'none'
  if (isOverdue(due)) return 'overdue'
  if (isDueToday(due)) return 'today'
  if (isDueThisWeek(due)) return 'this_week'
  if (isDueThisMonth(due)) return 'this_month'
  return 'later'
}

// ─── Kanban column config ─────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { key: 'draft',       label: 'Draft',       colorCls: 'border-t-warning' },
  { key: 'in-progress', label: 'In Progress', colorCls: 'border-t-primary' },
  { key: 'review',      label: 'Review',      colorCls: 'border-t-purple-500' },
  { key: 'completed',   label: 'Completed',   colorCls: 'border-t-success' },
] as const

// ─── View toggle config ───────────────────────────────────────────────────────

const VIEW_MODES: { mode: ViewMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { mode: 'priority', icon: Flag,          label: 'Priority' },
  { mode: 'date',     icon: CalendarDays,  label: 'By Date' },
  { mode: 'list',     icon: LayoutList,    label: 'List' },
  { mode: 'kanban',   icon: LayoutGrid,    label: 'Kanban' },
]

// ─── Due date badge ───────────────────────────────────────────────────────────

function DueBadge({ project }: { project: FAIProject }) {
  const due = getProjectDueDate(project)
  if (!due) return null
  const status = dueDateStatus(due)
  const cls = {
    overdue: 'text-red-600 font-semibold',
    today:   'text-orange-600 font-medium',
    soon:    'text-warning font-medium',
    ok:      'text-text-secondary',
    none:    'text-text-secondary',
  }[status]
  return (
    <span className={`text-xs ${cls} flex items-center gap-1`}>
      <Clock className="w-3 h-3 shrink-0" />
      {status === 'overdue' && '⚠ '}{fmtDueDate(due)}
    </span>
  )
}

// ─── Shared project card (Kanban / Priority / Date views) ─────────────────────

function KanbanCard({ project, canDelete, onDelete }: {
  project: FAIProject
  canDelete: boolean
  onDelete: (p: FAIProject) => void
}) {
  const hasPdf      = project.pdfStatus === 'uploaded' && !!project.googleDriveFileId
  const priorityCls = getPriorityBadgeClass(project.priority)
  const priorityDot = getPriorityDotClass(project.priority)

  return (
    <div className="bg-white rounded-xl border border-border p-3.5 hover:border-primary/30 hover:shadow-sm transition-all flex flex-col gap-2">
      <div className="flex items-start justify-between gap-1.5">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${priorityCls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
          {getPriorityLabel(project.priority)}
        </span>
        {hasPdf && (
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" aria-label={project.sourcePdfName} />
        )}
      </div>

      <Link to={`/projects/${project.projectId}`}
        className="text-sm font-semibold text-text-primary hover:text-primary line-clamp-2 transition-colors leading-snug">
        {project.projectName}
      </Link>

      <div className="text-xs text-text-secondary font-mono leading-relaxed">
        <span>{project.partNumber}</span>
        {project.drawingRevision && <span> · Rev {project.drawingRevision}</span>}
      </div>

      <DueBadge project={project} />

      {/* PDF row */}
      {hasPdf ? (
        <Link to={`/projects/${project.projectId}/pdf`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-full">
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">{project.sourcePdfName}</span>
        </Link>
      ) : (
        <Link to={`/projects/${project.projectId}`}
          className="inline-flex items-center gap-1 text-xs text-text-secondary/60 hover:text-primary transition-colors">
          <UploadCloud className="w-3 h-3 shrink-0" />
          <span>Upload PDF</span>
        </Link>
      )}

      <div className="flex items-center gap-1 mt-1 pt-2 border-t border-border">
        <Link to={`/projects/${project.projectId}`}
          className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:bg-primary-light py-1.5 rounded-lg transition-colors">
          <Eye className="w-3.5 h-3.5" />
          Open
        </Link>
        <Link to={`/projects/${project.projectId}/edit`}
          className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold text-text-secondary hover:text-primary hover:bg-gray-100 py-1.5 rounded-lg transition-colors">
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
        {canDelete && (
          <button
            onClick={() => onDelete(project)}
            className="inline-flex items-center justify-center w-7 h-7 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, firebaseUser } = useAuth()
  const { productConfig, canAccess } = useProductConfig()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [projects, setProjects]   = useState<FAIProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState('')
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('fai-projects-view') as ViewMode | null
    const valid: ViewMode[] = ['priority', 'date', 'list', 'kanban']
    return (saved && valid.includes(saved)) ? saved : 'kanban'
  })

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem('fai-projects-view', mode)
  }, [])

  // Filters — initialised from URL query params when present
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState(() => {
    const p = searchParams.get('status') ?? 'all'
    return p === 'in_progress' ? 'in-progress' : p
  })
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get('priority') ?? 'all')
  const [dueDateFilter,  setDueDateFilter]  = useState<DueDateFilter>(() =>
    (searchParams.get('due') as DueDateFilter) ?? 'all'
  )

  // Delete modal
  const [projectToDelete, setProjectToDelete] = useState<FAIProject | null>(null)
  const [isDeleting,      setIsDeleting]      = useState(false)
  const [deleteSuccess,   setDeleteSuccess]   = useState(false)

  const load = async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    setError('')
    try {
      const data = await getUserProjects(firebaseUser.uid)
      setProjects(data.filter(p => p.status !== 'deleted' as string))
    } catch {
      setError('Unable to load projects. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [firebaseUser?.uid])

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!isAdmin || !projectToDelete || !firebaseUser) return
    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete.projectId, firebaseUser.uid, firebaseUser.email ?? '')
      setProjects(prev => prev.filter(p => p.projectId !== projectToDelete.projectId))
      setProjectToDelete(null)
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 4000)
    } catch (err) {
      const msg  = (err as { message?: string })?.message ?? ''
      const code = (err as { code?: string })?.code ?? ''
      if (msg.includes('Google Drive')) {
        setError(msg)
      } else if (code.includes('permission-denied')) {
        setError('You do not have permission to delete this project.')
      } else if (code.includes('not-found')) {
        setError('Project not found or already deleted.')
        setProjects(prev => prev.filter(p => p.projectId !== projectToDelete.projectId))
      } else {
        setError('Unable to delete project. Please try again.')
      }
      setProjectToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Filtered projects ───────────────────────────────────────────────────────
  const filteredProjects = useMemo(() =>
    filterProjects(projects, { status: statusFilter, priority: priorityFilter, dueDate: dueDateFilter, search }),
    [projects, statusFilter, priorityFilter, dueDateFilter, search]
  )

  const hasFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setDueDateFilter('all')
  }

  // ── Kanban buckets ──────────────────────────────────────────────────────────
  const kanbanBuckets = useMemo(() =>
    KANBAN_COLUMNS.map(col => ({
      ...col,
      projects: filteredProjects.filter(p =>
        p.status === col.key || (col.key === 'completed' && p.status === 'complete')
      ),
    })),
    [filteredProjects]
  )

  // ── Priority buckets ────────────────────────────────────────────────────────
  const priorityBuckets = useMemo(() =>
    PRIORITY_GROUPS.map(g => ({
      ...g,
      projects: filteredProjects.filter(p => normalisePriority(p.priority) === g.key),
    })),
    [filteredProjects]
  )

  // ── Date buckets ────────────────────────────────────────────────────────────
  const dateBuckets = useMemo(() => {
    const sorted = [...filteredProjects].sort((a, b) => {
      const da = getProjectDueDate(a)?.getTime() ?? Infinity
      const db = getProjectDueDate(b)?.getTime() ?? Infinity
      return da - db
    })
    return DATE_GROUPS.map(g => ({
      ...g,
      projects: sorted.filter(p => getDateBucket(p) === g.key),
    }))
  }, [filteredProjects])

  // ── Reusable grouped column layout ─────────────────────────────────────────
  function GroupedColumns<T extends { key: string; label: string; colorCls: string; projects: FAIProject[] }>({
    groups,
  }: { groups: T[] }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {groups.map(col => (
          <div key={col.key}
            className={`bg-gray-50 rounded-xl border-t-4 ${col.colorCls} border border-border border-t-[4px] p-3`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-text-primary">{col.label}</span>
              <span className="text-xs font-semibold bg-white border border-border text-text-secondary px-2 py-0.5 rounded-full">
                {col.projects.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.projects.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-secondary">No projects</div>
              ) : (
                col.projects.map(project => (
                  <KanbanCard
                    key={project.projectId}
                    project={project}
                    canDelete={isAdmin}
                    onDelete={setProjectToDelete}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Header / loading / error states ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors shrink-0">
                ← Dashboard
              </Link>
              <span className="text-border">/</span>
              <span className="text-sm font-bold text-text-primary">My Projects</span>
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title + New Project */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Projects</h1>
            {!isLoading && (
              <p className="text-sm text-text-secondary mt-0.5">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                {hasFilters ? ' matching filters' : ''}
              </p>
            )}
          </div>
          {canAccess('createProject') && (
            <button onClick={() => navigate('/projects/new')} className="btn-primary text-sm">
              <FolderPlus className="w-4 h-4" />
              + New Project
            </button>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {deleteSuccess && (
          <div className="mb-5 px-4 py-3 bg-success/10 border border-success/20 text-success text-sm rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Project deleted successfully.
          </div>
        )}

        {/* ── Controls ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>

          {/* Due date filter */}
          <div className="relative">
            <select value={dueDateFilter} onChange={e => setDueDateFilter(e.target.value as DueDateFilter)}
              className="appearance-none pl-3 pr-7 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
              <option value="all">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters}
              className="text-sm font-medium text-text-secondary hover:text-error transition-colors px-2 py-2">
              Clear
            </button>
          )}

          {/* View toggle — push to right */}
          <div className="ml-auto flex items-center border border-border rounded-lg overflow-hidden bg-white">
            {VIEW_MODES.map(({ mode, icon: Icon, label }, i) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors',
                  i > 0 ? 'border-l border-border' : '',
                  viewMode === mode ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50',
                ].join(' ')}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-20 bg-white rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-border mx-auto mb-4" />
            {hasFilters ? (
              <>
                <p className="text-sm text-text-secondary mb-3">No projects match the current filters.</p>
                <button onClick={clearFilters}
                  className="text-sm font-semibold text-primary hover:underline">Clear filters</button>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-4">No projects yet.</p>
                {canAccess('createProject') && (
                  <button onClick={() => navigate('/projects/new')} className="btn-primary text-sm">
                    <FolderPlus className="w-4 h-4" />
                    Create First Project
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PRIORITY VIEW ─────────────────────────────────────────────────── */}
        {!isLoading && filteredProjects.length > 0 && viewMode === 'priority' && (
          <GroupedColumns groups={priorityBuckets} />
        )}

        {/* ── BY DATE VIEW ──────────────────────────────────────────────────── */}
        {!isLoading && filteredProjects.length > 0 && viewMode === 'date' && (
          <div className="flex flex-col gap-8">
            {dateBuckets.filter(g => g.projects.length > 0).map(group => (
              <div key={group.key}>
                <div className={`flex items-center gap-2.5 mb-3 pl-3 border-l-4 ${group.accentCls}`}>
                  <span className={`text-sm font-bold ${group.headerCls}`}>{group.label}</span>
                  <span className="text-xs font-semibold bg-white border border-border text-text-secondary px-2 py-0.5 rounded-full">
                    {group.projects.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {group.projects.map(project => (
                    <KanbanCard
                      key={project.projectId}
                      project={project}
                      canDelete={isAdmin}
                      onDelete={setProjectToDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
        {!isLoading && filteredProjects.length > 0 && viewMode === 'list' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => {
              const statusClass = PROJECT_STATUS_COLORS[project.status]
              const priorityCls = getPriorityBadgeClass(project.priority)
              const priorityDot = getPriorityDotClass(project.priority)
              const hasPdf      = project.pdfStatus === 'uploaded' && !!project.googleDriveFileId
              const due         = getProjectDueDate(project)

              return (
                <div key={project.projectId}
                  className="bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all flex flex-col">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${priorityCls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
                        {getPriorityLabel(project.priority)}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    {due && (
                      <span className="inline-flex items-center gap-1 text-xs text-text-secondary whitespace-nowrap sm:text-right">
                        Due: <DueBadge project={project} />
                      </span>
                    )}
                  </div>

                  <Link to={`/projects/${project.projectId}`}
                    className="block text-sm font-bold text-text-primary hover:text-primary truncate transition-colors mb-2">
                    {project.projectName}
                  </Link>

                  <div className="flex flex-col gap-0.5 mb-2.5 text-xs text-text-secondary font-mono">
                    <span>Part: {project.partNumber}</span>
                    <span>DWG: {project.drawingNumber}</span>
                    <span>Rev: {project.drawingRevision}</span>
                  </div>

                  <div className="mb-3">
                    {hasPdf ? (
                      <Link to={`/projects/${project.projectId}/pdf`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline min-w-0 max-w-full">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">PDF: {project.sourcePdfName}</span>
                      </Link>
                    ) : (
                      <Link to={`/projects/${project.projectId}`}
                        className="inline-flex items-center gap-1 text-xs text-text-secondary/60 hover:text-primary transition-colors">
                        <UploadCloud className="w-3 h-3 shrink-0" />
                        <span>Upload PDF</span>
                      </Link>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
                    <Link to={`/projects/${project.projectId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-2.5 py-1.5 rounded-lg transition-colors">
                      Open
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link to={`/projects/${project.projectId}/edit`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="ml-auto inline-flex items-center justify-center w-7 h-7 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── KANBAN VIEW ───────────────────────────────────────────────────── */}
        {!isLoading && filteredProjects.length > 0 && viewMode === 'kanban' && (
          <GroupedColumns groups={kanbanBuckets} />
        )}

      </main>

      {/* Delete modal */}
      {isAdmin && projectToDelete && (
        <DeleteProjectModal
          projectName={projectToDelete.projectName}
          isDeleting={isDeleting}
          onCancel={() => setProjectToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
