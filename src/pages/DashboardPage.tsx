import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBranding } from '../hooks/useBranding'
import {
  FolderPlus,
  FolderOpen,
  Pencil,
  Trash2,
  Key,
  AlertCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  ChevronDown,
  X,
  UploadCloud,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { UserAvatarMenu } from '../components/ui/UserAvatarMenu'
import { OrganizationSwitcher } from '../components/ui/OrganizationSwitcher'
import { DeleteProjectModal } from '../components/ui/DeleteProjectModal'
import { BetaTestingBanner } from '../components/ui/BetaTestingBanner'
import { BetaWatermark } from '../components/ui/BetaWatermark'
import { FEATURE_LABELS, type FeatureKey } from '../config/productConfig.types'
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
} from '../projects/projectPriority'
import {
  getProjectDueDate,
  filterProjects,
  countByPriority,
  countDueThisWeek,
  type DueDateFilter,
} from '../projects/projectFilters'
import { fmtDueDate, dueDateStatus } from '../projects/projectDueDate'

// ─── Feature badge keys (admin panel only) ────────────────────────────────────

const FEATURE_BADGE_KEYS: FeatureKey[] = [
  'dashboard', 'createProject', 'projectList', 'pdfViewer',
  'manualBallooning', 'featureTable', 'form3Export',
  'googleDriveSave', 'ocrExtraction', 'adminPortal',
]

// ─── Due date badge ───────────────────────────────────────────────────────────

function DueBadge({ project }: { project: FAIProject }) {
  const due = getProjectDueDate(project)
  if (!due) return <span className="text-xs text-text-secondary">—</span>
  const status = dueDateStatus(due)
  const cls = {
    overdue: 'text-red-600 font-semibold',
    today:   'text-orange-600 font-medium',
    soon:    'text-warning font-medium',
    ok:      'text-text-secondary',
    none:    'text-text-secondary',
  }[status]
  return <span className={`text-xs ${cls}`}>{status === 'overdue' ? '⚠ ' : ''}{fmtDueDate(due)}</span>
}

// ─── Filter select ────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, children }: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-[120px] pl-3 pr-6 py-1.5 text-xs font-medium border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  )
}

// ─── Sprint status ────────────────────────────────────────────────────────────

const sprintStatus = [
  { label: 'Public marketing website',        done: true  },
  { label: 'Google Sign-In + Firestore',       done: true  },
  { label: 'Complete Profile + Edit Profile',  done: true  },
  { label: 'Product Key + Org Feature Config', done: true  },
  { label: 'Project creation + metadata',      done: true  },
  { label: 'Project list + detail view',       done: true  },
  { label: 'Edit + delete projects',           done: true  },
  { label: 'PDF upload + Google Drive',        done: true  },
  { label: 'Priority + Due Date fields',       done: true  },
  { label: 'Dashboard optimization',           done: true  },
  { label: 'Kanban view',                      done: true  },
  { label: 'Balloon Tool',                     done: false },
  { label: 'Feature Table',                    done: false },
  { label: 'AS9102 Form 3 Export',             done: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, firebaseUser } = useAuth()
  const { productKey, productConfig, organizationConfig, usingDefaultOrgConfig, canAccess } = useProductConfig()
  const { branding } = useBranding()

  const isManager = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager'

  const [projects, setProjects]               = useState<FAIProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [orgWarningDismissed, setOrgWarningDismissed] = useState(false)

  // Filters
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dueDateFilter,  setDueDateFilter]  = useState<DueDateFilter>('all')

  const hasActiveFilter = statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all'
  const clearFilters    = () => { setStatusFilter('all'); setPriorityFilter('all'); setDueDateFilter('all') }

  // Delete state
  const [projectToDelete, setProjectToDelete] = useState<FAIProject | null>(null)
  const [isDeleting,      setIsDeleting]      = useState(false)

  useEffect(() => {
    if (!firebaseUser) return
    setProjectsLoading(true)
    getUserProjects(firebaseUser.uid)
      .then(setProjects)
      .finally(() => setProjectsLoading(false))
  }, [firebaseUser?.uid])

  const handleDeleteConfirm = async () => {
    if (!isManager || !projectToDelete || !firebaseUser) return
    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete.projectId, firebaseUser.uid, firebaseUser.email ?? '')
      setProjects(prev => prev.filter(p => p.projectId !== projectToDelete.projectId))
      setProjectToDelete(null)
    } catch {
      setProjectToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const displayName = user?.displayName || firebaseUser?.displayName || 'User'

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeProjects   = useMemo(() => projects.filter(p => p.status !== 'archived'), [projects])
  const criticalCount    = useMemo(() => countByPriority(activeProjects, 'critical'), [activeProjects])
  const highCount        = useMemo(() => countByPriority(activeProjects, 'high'),     [activeProjects])
  const mediumCount      = useMemo(() => countByPriority(activeProjects, 'medium'),   [activeProjects])
  const lowCount         = useMemo(() => countByPriority(activeProjects, 'low'),      [activeProjects])
  const inProgressCount  = useMemo(() => projects.filter(p => p.status === 'in-progress').length, [projects])
  const dueThisWeekCount = useMemo(() => countDueThisWeek(activeProjects), [activeProjects])

  // Highest priority — pick the most urgent non-zero bucket
  const highestPriority = criticalCount > 0
    ? { label: 'Critical', count: criticalCount, cls: 'bg-red-50 border-red-200 text-red-700', dotCls: 'bg-red-500', attention: true }
    : highCount   > 0
    ? { label: 'High',     count: highCount,     cls: 'bg-orange-50 border-orange-200 text-orange-700', dotCls: 'bg-orange-500', attention: true }
    : mediumCount > 0
    ? { label: 'Medium',   count: mediumCount,   cls: 'bg-blue-50 border-blue-200 text-blue-700',   dotCls: 'bg-blue-400', attention: false }
    : lowCount    > 0
    ? { label: 'Low',      count: lowCount,      cls: 'bg-gray-50 border-gray-200 text-gray-600',   dotCls: 'bg-gray-400', attention: false }
    : null

  // ── Filtered recent projects (max 5) ───────────────────────────────────────
  const recentProjects = useMemo(() =>
    filterProjects(projects, { status: statusFilter, priority: priorityFilter, dueDate: dueDateFilter }).slice(0, 4),
    [projects, statusFilter, priorityFilter, dueDateFilter]
  )

  interface StatCard {
    label:    string
    value:    number | string
    icon:     React.ReactNode
    bg:       string
    alert?:   boolean
    dotCls?:  string
    subtext?: string
    href?:    string
  }

  const statCards: StatCard[] = [
    {
      label:   'Total Projects',
      value:   activeProjects.length,
      icon:    <FolderOpen className="w-5 h-5 text-primary" />,
      bg:      'bg-primary-light',
      href:    '/projects',
    },
    ...(highestPriority ? [{
      label:   'Highest Priority',
      value:   highestPriority.label,
      icon:    <AlertTriangle className="w-5 h-5 text-current" />,
      bg:      highestPriority.cls,
      alert:   true,
      dotCls:  highestPriority.dotCls,
      subtext: highestPriority.attention
        ? `${highestPriority.count} project${highestPriority.count !== 1 ? 's' : ''} need attention`
        : `${highestPriority.count} project${highestPriority.count !== 1 ? 's' : ''}`,
      href:    `/projects?priority=${highestPriority.label.toLowerCase()}`,
    }] : []),
    {
      label:   'In Progress',
      value:   inProgressCount,
      icon:    <RefreshCw className="w-5 h-5 text-primary" />,
      bg:      'bg-primary-light',
      href:    '/projects?status=in_progress',
    },
    {
      label:   'Due This Week',
      value:   dueThisWeekCount,
      icon:    <CalendarClock className="w-5 h-5 text-warning" />,
      bg:      'bg-warning/10',
      href:    '/projects?due=this_week',
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BetaWatermark />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Left: Logo + product title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div className="flex flex-col gap-1 leading-none">
                <span className="text-sm font-bold text-text-primary tracking-tight">{branding.businessName}</span>
                <span className="text-[10px] text-text-secondary hidden sm:block">
                  powered by{' '}
                  <a href={branding.poweredByUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                    {branding.poweredByText.replace(/^powered by\s+/i, '') || 'EV.ENGINEER'}
                  </a>
                </span>
              </div>
              <span className="hidden sm:block text-text-secondary text-sm ml-1">/ Dashboard</span>
            </div>

            {/* Right: org switcher + avatar dropdown */}
            <div className="flex items-center gap-2">
              <OrganizationSwitcher />
              <UserAvatarMenu />
            </div>
          </div>
        </div>
      </header>

      <BetaTestingBanner />

      {/* ── Dismissible org warning ────────────────────────────────────────── */}
      {usingDefaultOrgConfig && !orgWarningDismissed && (
        <div className="bg-warning/10 border-b border-warning/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
            <p className="text-xs text-warning flex-1">
              Default organization configuration applied. Contact your administrator to configure feature access.
            </p>
            <button onClick={() => setOrgWarningDismissed(true)}
              className="p-1 rounded hover:bg-warning/20 transition-colors shrink-0">
              <X className="w-3.5 h-3.5 text-warning" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">

        {/* ── 1. Welcome + New Project CTA ────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Welcome back, {displayName.split(' ')[0]}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Your aerospace drawing ballooning and FAI report toolkit.
            </p>
          </div>
          {canAccess('createProject') && (
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary text-sm shrink-0 mt-1">
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        {/* ── 2. Statistics ────────────────────────────────────────────────── */}
        {!projectsLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                onClick={() => stat.href && navigate(stat.href)}
                className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${
                  stat.href ? 'cursor-pointer hover:shadow-md hover:border-primary/40' : ''
                } ${stat.alert ? `${stat.bg} border-current/20` : 'bg-white border-border'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.alert ? 'bg-white/60' : stat.bg}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  {typeof stat.value === 'string' ? (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {stat.dotCls && <span className={`w-2 h-2 rounded-full shrink-0 ${stat.dotCls}`} />}
                      <p className={`text-base font-bold leading-none ${stat.alert ? 'text-current' : 'text-text-primary'}`}>
                        {stat.value}
                      </p>
                    </div>
                  ) : (
                    <p className={`text-2xl font-bold leading-none mb-0.5 ${stat.alert ? 'text-current' : 'text-text-primary'}`}>
                      {stat.value}
                    </p>
                  )}
                  <p className={`text-xs truncate ${stat.alert ? 'text-current/70' : 'text-text-secondary'}`}>
                    {stat.label}
                  </p>
                  {stat.subtext && (
                    <p className={`text-[10px] mt-0.5 truncate ${stat.alert ? 'text-current/60' : 'text-text-secondary/70'}`}>
                      {stat.subtext}
                    </p>
                  )}
                </div>
                {stat.href && (
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 opacity-40 ${stat.alert ? 'text-current' : 'text-text-secondary'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── 3. Recent Projects ───────────────────────────────────────────── */}
        <div className="card p-5">

          {/* Title left · Filters + View All right — single row */}
          <div className="flex items-center justify-between gap-x-3 gap-y-2 flex-wrap mb-4">
            <div className="flex items-center gap-2 shrink-0">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-text-primary">Recent Projects</h2>
              {!projectsLoading && (
                <span className="text-xs font-semibold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              )}
              {projectsLoading && <RefreshCw className="w-3.5 h-3.5 text-text-secondary animate-spin" />}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!projectsLoading && projects.length > 0 && (
                <>
                  <FilterSelect value={statusFilter} onChange={setStatusFilter}>
                    <option value="all">Status</option>
                    <option value="draft">Draft</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </FilterSelect>

                  <FilterSelect value={priorityFilter} onChange={setPriorityFilter}>
                    <option value="all">Priority</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </FilterSelect>

                  <FilterSelect value={dueDateFilter} onChange={v => setDueDateFilter(v as DueDateFilter)}>
                    <option value="all">Due Date</option>
                    <option value="overdue">Overdue</option>
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                  </FilterSelect>

                  {hasActiveFilter && (
                    <button onClick={clearFilters}
                      className="text-xs font-medium text-text-secondary hover:text-error transition-colors">
                      Clear
                    </button>
                  )}
                </>
              )}

              <Link to="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shrink-0">
                View All Projects
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Empty: no projects */}
          {!projectsLoading && projects.length === 0 && (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <FileText className="w-8 h-8 text-border mx-auto mb-3" />
              <p className="text-sm text-text-secondary mb-4">No projects yet. Create your first one.</p>
              {canAccess('createProject') && (
                <button onClick={() => navigate('/projects/new')} className="btn-primary text-sm">
                  <FolderPlus className="w-4 h-4" />
                  New Project
                </button>
              )}
            </div>
          )}

          {/* Empty: filter mismatch */}
          {!projectsLoading && projects.length > 0 && recentProjects.length === 0 && (
            <div className="text-center py-6 border border-dashed border-border rounded-xl">
              <p className="text-sm text-text-secondary">No projects match the current filters.</p>
              <button onClick={clearFilters} className="mt-2 text-xs font-semibold text-primary hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {/* Project card grid */}
          {!projectsLoading && recentProjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentProjects.map((project) => {
                const statusClass = PROJECT_STATUS_COLORS[project.status]
                const priorityCls = getPriorityBadgeClass(project.priority)
                const priorityDot = getPriorityDotClass(project.priority)
                const hasPdf      = project.pdfStatus === 'uploaded' && !!project.googleDriveFileId
                const due         = getProjectDueDate(project)
                const dStatus     = due ? dueDateStatus(due) : 'none'
                const dueCls      = dStatus === 'overdue' ? 'text-red-600 font-semibold'
                                  : dStatus === 'today'   ? 'text-orange-600 font-medium'
                                  : dStatus === 'soon'    ? 'text-warning font-medium'
                                  : 'text-text-secondary'

                return (
                  <div key={project.projectId}
                    className="border border-border rounded-xl p-4 bg-white hover:border-primary/30 hover:shadow-sm transition-all flex flex-col">

                    {/* Top: priority + status, with due date right-aligned on desktop */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${priorityCls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
                          {getPriorityLabel(project.priority)}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
                          {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      {due && (
                        <span className={`text-xs whitespace-nowrap sm:text-right ${dueCls}`}>
                          Due: <DueBadge project={project} />
                        </span>
                      )}
                    </div>

                    {/* Project name */}
                    <Link to={`/projects/${project.projectId}`}
                      className="text-sm font-bold text-text-primary hover:text-primary transition-colors leading-snug mb-2.5 line-clamp-2">
                      {project.projectName}
                    </Link>

                    {/* Meta: part / dwg / rev */}
                    <div className="flex flex-col gap-0.5 text-xs font-mono text-text-secondary mb-2.5">
                      <span>Part: {project.partNumber}</span>
                      <span>DWG: {project.drawingNumber}</span>
                      <span>Rev: {project.drawingRevision}</span>
                    </div>

                    {/* PDF line */}
                    <div className="mb-3">
                      {hasPdf ? (
                        <Link to={`/projects/${project.projectId}/pdf`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline truncate max-w-full">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">PDF: {project.sourcePdfName}</span>
                        </Link>
                      ) : (
                        <Link to={`/projects/${project.projectId}`}
                          className="inline-flex items-center gap-1 text-xs text-text-secondary/60 hover:text-primary transition-colors">
                          <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                          <span>Upload PDF</span>
                        </Link>
                      )}
                    </div>

                    {/* Actions — pushed to bottom */}
                    <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
                      <Link to={`/projects/${project.projectId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-2.5 py-1.5 rounded-lg transition-colors">
                        Open
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link to={`/projects/${project.projectId}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-primary hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors border border-border">
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Link>
                      {isManager && (
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
        </div>

        {/* ── 4. Product & Org Config — admin only ─────────────────────────── */}
        {isManager && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-text-primary">Product &amp; Organization Configuration</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5 pb-5 border-b border-border">
              {[
                { label: 'Product',      value: productConfig.productName },
                { label: 'Product Key',  value: productKey, mono: true },
                { label: 'Organization', value: organizationConfig.organizationName },
                { label: 'Org Code',     value: organizationConfig.organizationCode, mono: true },
                { label: 'Plan',         value: organizationConfig.plan, capitalize: true },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{item.label}</p>
                  <p className={`text-sm font-medium text-text-primary ${item.mono ? 'font-mono' : ''} ${item.capitalize ? 'capitalize' : ''}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">Enabled Features</p>
              <div className="flex flex-wrap gap-2">
                {FEATURE_BADGE_KEYS.map((key) => {
                  const on = canAccess(key)
                  return (
                    <span key={key}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                        on ? 'bg-primary-light text-primary border-primary/20' : 'bg-gray-100 text-text-secondary border-transparent'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-primary' : 'bg-gray-400'}`} />
                      {FEATURE_LABELS[key]}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Sprint Progress ───────────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <h2 className="font-semibold text-text-primary">Sprint Progress</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sprintStatus.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.done ? 'bg-success' : 'bg-border'}`} />
                <span className={item.done ? 'text-text-primary' : 'text-text-secondary'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {isManager && projectToDelete && (
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
