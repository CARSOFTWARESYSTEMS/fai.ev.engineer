import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FolderPlus,
  FolderOpen,
  LogOut,
  Clock,
  Building2,
  MessageCircle,
  Pencil,
  Key,
  AlertCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  Eye,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  LayoutGrid,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { FEATURE_LABELS, type FeatureKey } from '../config/productConfig.types'
import { getUserProjects } from '../projects/project.service'
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
  const label  = fmtDueDate(due)

  const cls = {
    overdue: 'text-red-600 font-semibold',
    today:   'text-orange-600 font-semibold',
    soon:    'text-warning font-medium',
    ok:      'text-text-secondary',
    none:    'text-text-secondary',
  }[status]

  return (
    <span className={`text-xs ${cls}`}>
      {status === 'overdue' ? '⚠ ' : ''}{label}
    </span>
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
  const navigate    = useNavigate()
  const { user, firebaseUser, signOut } = useAuth()
  const { productKey, productConfig, organizationConfig, usingDefaultOrgConfig, canAccess } = useProductConfig()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [projects, setProjects]           = useState<FAIProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  // Recent Projects filters
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dueDateFilter,  setDueDateFilter]  = useState<DueDateFilter>('all')

  useEffect(() => {
    if (!firebaseUser) return
    setProjectsLoading(true)
    getUserProjects(firebaseUser.uid)
      .then(setProjects)
      .finally(() => setProjectsLoading(false))
  }, [firebaseUser?.uid])

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const displayName = user?.displayName || firebaseUser?.displayName || 'User'
  const photoURL    = user?.photoURL    || firebaseUser?.photoURL
  const email       = user?.email       || firebaseUser?.email

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeProjects   = useMemo(() =>
    projects.filter(p => p.status !== 'archived'), [projects])

  const criticalCount    = useMemo(() => countByPriority(activeProjects, 'critical'), [activeProjects])
  const highCount        = useMemo(() => countByPriority(activeProjects, 'high'),     [activeProjects])
  const mediumCount      = useMemo(() => countByPriority(activeProjects, 'medium'),   [activeProjects])
  const inProgressCount  = useMemo(() =>
    projects.filter(p => p.status === 'in-progress').length, [projects])
  const dueThisWeekCount = useMemo(() => countDueThisWeek(activeProjects), [activeProjects])

  interface StatCard {
    label: string
    value: number
    icon:  React.ReactNode
    bg:    string
    alert?: boolean
  }

  const priorityAlert = criticalCount > 0
    ? { label: 'Critical', count: criticalCount, cls: 'bg-red-50 border-red-200 text-red-700' }
    : highCount > 0
    ? { label: 'High',     count: highCount,     cls: 'bg-orange-50 border-orange-200 text-orange-700' }
    : mediumCount > 0
    ? { label: 'Medium',   count: mediumCount,   cls: 'bg-blue-50 border-blue-200 text-blue-700' }
    : null

  // ── Filtered recent projects ───────────────────────────────────────────────
  const recentProjects = useMemo(() => {
    const filtered = filterProjects(projects, {
      status:   statusFilter,
      priority: priorityFilter,
      dueDate:  dueDateFilter,
    })
    return filtered.slice(0, 5)
  }, [projects, statusFilter, priorityFilter, dueDateFilter])

  const statCards: StatCard[] = [
    {
      label: 'Total Projects',
      value: activeProjects.length,
      icon:  <FolderOpen className="w-5 h-5 text-primary" />,
      bg:    'bg-primary-light',
    },
    ...(priorityAlert ? [{
      label: `${priorityAlert.label} Priority`,
      value: priorityAlert.count,
      icon:  <AlertTriangle className="w-5 h-5 text-current" />,
      bg:    priorityAlert.cls,
      alert: true,
    }] : []),
    {
      label: 'In Progress',
      value: inProgressCount,
      icon:  <RefreshCw className="w-5 h-5 text-primary" />,
      bg:    'bg-primary-light',
    },
    {
      label: 'Due This Week',
      value: dueThisWeekCount,
      icon:  <CalendarClock className="w-5 h-5 text-warning" />,
      bg:    'bg-warning/10',
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-text-primary tracking-tight">
                  {productConfig.productName}
                </span>
                <span className="text-[10px] text-text-secondary hidden sm:block">
                  by {productConfig.brandName}
                </span>
              </div>
              <span className="hidden sm:block text-text-secondary text-sm ml-1">/ Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2.5">
                {photoURL ? (
                  <img src={photoURL} alt={displayName}
                    className="w-8 h-8 rounded-full border border-border"
                    referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{displayName[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-semibold text-text-primary">{displayName}</span>
                  <span className="text-xs text-text-secondary">{email}</span>
                </div>
              </div>
              <button onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* ── 1. Welcome ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Welcome back, {displayName.split(' ')[0]}
          </h1>
          <p className="text-text-secondary mt-1">
            Your aerospace drawing ballooning and FAI report toolkit.
          </p>
        </div>

        {/* Profile strip */}
        {user && (
          <div className="bg-white border border-border rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-4">
            {user.organizationName && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-text-primary">{user.organizationName}</span>
                {user.organizationCode !== 'default' && (
                  <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-mono">
                    {user.organizationCode}
                  </span>
                )}
              </div>
            )}
            {user.mobileNumber && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>{user.mobileNumber}</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-semibold bg-success/10 text-success px-3 py-1 rounded-full capitalize">
                {user.subscriptionPlan} plan
              </span>
              <Link to="/profile"
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary-light px-3 py-1.5 rounded-full border border-primary/20 transition-colors">
                <Pencil className="w-3 h-3" />
                Edit Profile
              </Link>
            </div>
          </div>
        )}

        {usingDefaultOrgConfig && (
          <div className="flex items-start gap-2.5 bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Default organization configuration applied. Contact your administrator to configure organization-specific feature access.
          </div>
        )}

        {/* ── 2. Statistics ───────────────────────────────────────────────────── */}
        {!projectsLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label}
                className={`rounded-xl border p-4 flex items-center gap-3 ${
                  stat.alert ? stat.bg + ' border-current/20' : 'bg-white border-border'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  stat.alert ? 'bg-white/60' : stat.bg
                }`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-2xl font-bold ${stat.alert ? 'text-current' : 'text-text-primary'}`}>
                    {stat.value}
                  </p>
                  <p className={`text-xs mt-0.5 truncate ${stat.alert ? 'text-current/80' : 'text-text-secondary'}`}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 3. Recent Projects ──────────────────────────────────────────────── */}
        <div className="card p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-text-primary">Recent Projects</h2>
              {!projectsLoading && (
                <span className="text-xs font-semibold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              )}
              {projectsLoading && (
                <RefreshCw className="w-3.5 h-3.5 text-text-secondary animate-spin" />
              )}
            </div>
            {canAccess('projectList') && projects.length > 0 && (
              <Link to="/projects"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0">
                View All Projects
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Filters */}
          {!projectsLoading && projects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>

              {/* Priority */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>

              {/* Due date */}
              <div className="relative">
                <select
                  value={dueDateFilter}
                  onChange={e => setDueDateFilter(e.target.value as DueDateFilter)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>

              {(statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all') && (
                <button
                  onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setDueDateFilter('all') }}
                  className="text-xs font-medium text-text-secondary hover:text-error transition-colors px-2"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Empty states */}
          {!projectsLoading && projects.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-border mx-auto mb-3" />
              <p className="text-sm text-text-secondary mb-4">No projects created yet.</p>
              {canAccess('createProject') && (
                <button onClick={() => navigate('/projects/new')}
                  className="btn-primary text-sm px-5 py-2.5">
                  <FolderPlus className="w-4 h-4" />
                  Create First Project
                </button>
              )}
            </div>
          )}

          {!projectsLoading && projects.length > 0 && recentProjects.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-text-secondary">No projects match the current filters.</p>
              <button
                onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setDueDateFilter('all') }}
                className="mt-2 text-xs font-semibold text-primary hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {/* Project rows */}
          {!projectsLoading && recentProjects.length > 0 && (
            <div className="flex flex-col gap-3">
              {recentProjects.map((project) => {
                const statusClass  = PROJECT_STATUS_COLORS[project.status]
                const priorityCls  = getPriorityBadgeClass(project.priority)
                const priorityDot  = getPriorityDotClass(project.priority)
                const hasPdf       = project.pdfStatus === 'uploaded' && !!project.googleDriveFileId

                return (
                  <div key={project.projectId}
                    className="rounded-xl border border-border bg-white p-4 hover:border-primary/30 hover:shadow-sm transition-all">

                    {/* Row 1: priority + name + status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${priorityCls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
                          {getPriorityLabel(project.priority)}
                        </span>
                        <Link to={`/projects/${project.projectId}`}
                          className="text-sm font-bold text-text-primary hover:text-primary truncate transition-colors">
                          {project.projectName}
                        </Link>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </div>

                    {/* Row 2: metadata */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5 text-xs text-text-secondary font-mono">
                      <span>Part: {project.partNumber}</span>
                      <span className="text-border">·</span>
                      <span>DWG: {project.drawingNumber}</span>
                      <span className="text-border">·</span>
                      <span>Rev: {project.drawingRevision}</span>
                      {project.customerName && (
                        <>
                          <span className="text-border">·</span>
                          <span className="font-sans">{project.customerName}</span>
                        </>
                      )}
                    </div>

                    {/* Row 3: PDF + due date + actions */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* PDF */}
                        {hasPdf ? (
                          <Link to={`/projects/${project.projectId}/pdf`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline min-w-0">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]">{project.sourcePdfName}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                            <UploadCloud className="w-3 h-3 shrink-0" />
                            No PDF
                          </span>
                        )}
                        {/* Due date */}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-text-secondary shrink-0" />
                          <DueBadge project={project} />
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {hasPdf && canAccess('pdfViewer') && (
                          <Link to={`/projects/${project.projectId}/pdf`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary-light px-2.5 py-1.5 rounded-lg transition-colors border border-primary/20">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">View PDF</span>
                          </Link>
                        )}
                        <Link to={`/projects/${project.projectId}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <Link to={`/projects/${project.projectId}`}
                          className="inline-flex items-center justify-center w-7 h-7 text-text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 4. Quick Actions ────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* New Project */}
            <button
              disabled={!canAccess('createProject')}
              onClick={() => canAccess('createProject') && navigate('/projects/new')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                canAccess('createProject')
                  ? 'border-primary/20 bg-primary-light hover:bg-primary hover:text-white hover:border-primary group cursor-pointer'
                  : 'border-border bg-gray-50 opacity-50 cursor-not-allowed'
              }`}>
              <FolderPlus className={`w-6 h-6 ${canAccess('createProject') ? 'text-primary group-hover:text-white' : 'text-text-secondary'}`} />
              <span className="text-xs font-semibold text-text-primary group-hover:text-white">New Project</span>
            </button>

            {/* View All Projects */}
            <button
              disabled={!canAccess('projectList')}
              onClick={() => canAccess('projectList') && navigate('/projects')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                canAccess('projectList')
                  ? 'border-border bg-white hover:border-primary/30 hover:shadow-sm cursor-pointer group'
                  : 'border-border bg-gray-50 opacity-50 cursor-not-allowed'
              }`}>
              <FolderOpen className={`w-6 h-6 ${canAccess('projectList') ? 'text-primary' : 'text-text-secondary'}`} />
              <span className="text-xs font-semibold text-text-primary">View All Projects</span>
            </button>

            {/* Upload Drawing */}
            <button
              onClick={() => navigate('/projects')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm cursor-pointer group transition-all">
              <UploadCloud className="w-6 h-6 text-primary" />
              <span className="text-xs font-semibold text-text-primary">Upload Drawing</span>
            </button>

            {/* Settings — admin only */}
            {isAdmin && (
              <button
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm cursor-pointer group transition-all"
                onClick={() => navigate('/dashboard')}>
                <Settings className="w-6 h-6 text-text-secondary" />
                <span className="text-xs font-semibold text-text-primary">Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 5. Product & Org Config — admin only ────────────────────────────── */}
        {isAdmin && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Key className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-text-primary">Product &amp; Organization Configuration</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 pb-6 border-b border-border">
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
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Enabled Features</p>
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

        {/* ── 6. Sprint Progress ──────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <h2 className="font-semibold text-text-primary">Sprint Progress</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sprintStatus.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.done ? 'bg-success' : 'bg-border'}`} />
                <span className={item.done ? 'text-text-primary' : 'text-text-secondary'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
