import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderPlus,
  ArrowRight,
  FileText,
  RefreshCw,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { getUserProjects, deleteProject } from '../projects/project.service'
import {
  type FAIProject,
  fmtTimestamp,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '../projects/project.types'
import { DeleteProjectModal } from '../components/ui/DeleteProjectModal'

type SortKey = 'updated' | 'created' | 'name'

function getMillis(ts: unknown): number {
  if (!ts) return 0
  if (typeof (ts as { toMillis?: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis()
  }
  return 0
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { user, firebaseUser } = useAuth()
  const { productConfig, canAccess } = useProductConfig()

  const [projects, setProjects] = useState<FAIProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('updated')

  const [projectToDelete, setProjectToDelete] = useState<FAIProject | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const load = async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    setError('')
    try {
      const list = await getUserProjects(firebaseUser.uid)
      setProjects(list)
    } catch {
      setError('Failed to load projects. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [firebaseUser?.uid])

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || !firebaseUser) return
    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete.projectId, firebaseUser.uid, firebaseUser.email ?? '')
      setProjects((prev) => prev.filter((p) => p.projectId !== projectToDelete.projectId))
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
        setProjects((prev) => prev.filter((p) => p.projectId !== projectToDelete.projectId))
      } else if (code.includes('unavailable') || code.includes('network-request-failed')) {
        setError('Firestore is temporarily unavailable. Please try again.')
      } else {
        setError('Unable to delete project. Please try again.')
      }
      setProjectToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredProjects = useMemo(() => {
    let result = [...projects]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.partNumber.toLowerCase().includes(q) ||
          p.drawingNumber.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'name') {
      result.sort((a, b) => a.projectName.localeCompare(b.projectName))
    } else if (sortBy === 'created') {
      result.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
    } else {
      // updated — already sorted by service, but re-sort in case filter changed order
      result.sort((a, b) => getMillis(b.updatedAt) - getMillis(a.updatedAt))
    }

    return result
  }, [projects, search, sortBy])

  // Feature-disabled friendly message
  if (!canAccess('projectList')) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-text-secondary hover:text-primary transition-colors">
                ← Dashboard
              </Link>
              <span className="text-border">/</span>
              <span className="text-sm font-semibold text-text-primary">Projects</span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
          <AlertCircle className="w-10 h-10 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Project list not enabled</h2>
          <p className="text-text-secondary max-w-sm mb-6">
            Project listing is not enabled for your organization. Contact your administrator to enable this feature.
          </p>
          <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
                <FileText className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="text-border">/</span>
              <span className="text-sm font-semibold text-text-primary">My Projects</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-xs">F</span>
                </div>
                <span className="text-sm font-bold text-text-primary">{productConfig.productName}</span>
              </div>
              {canAccess('createProject') && (
                <button onClick={() => navigate('/projects/new')} className="btn-primary text-sm px-4 py-2.5">
                  <FolderPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Projects</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {user?.organizationName
                ? `${user.organizationName} — FAI projects`
                : 'View and manage your FAI projects.'}
            </p>
          </div>
          <button onClick={load} disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary-light self-start sm:self-auto"
            aria-label="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search + Sort toolbar */}
        {!isLoading && projects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project name, part number, drawing number…"
                className="input-field pl-10 placeholder-slate-300"
              />
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="input-field pr-9 appearance-none cursor-pointer text-sm w-full sm:w-48"
              >
                <option value="updated">Latest Updated</option>
                <option value="created">Latest Created</option>
                <option value="name">Project Name (A–Z)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          </div>
        )}

        {/* Success */}
        {deleteSuccess && (
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-success/10 border border-success/20 text-success text-sm rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Project deleted successfully.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — no projects at all */}
        {!isLoading && projects.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">No projects found</h2>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              Create your first FAI project to start working with drawings and inspection reports.
            </p>
            {canAccess('createProject') && (
              <button onClick={() => navigate('/projects/new')} className="btn-primary">
                <FolderPlus className="w-4 h-4" />
                Create First Project
              </button>
            )}
          </div>
        )}

        {/* Empty state — search returned nothing */}
        {!isLoading && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-text-secondary">
              No projects match <span className="font-semibold text-text-primary">"{search}"</span>
            </p>
            <button onClick={() => setSearch('')}
              className="text-sm text-primary hover:underline mt-2 block mx-auto">
              Clear search
            </button>
          </div>
        )}

        {/* Project list */}
        {!isLoading && filteredProjects.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {filteredProjects.map((project) => {
                const statusClass = PROJECT_STATUS_COLORS[project.status]
                return (
                  <div key={project.projectId}
                    className="card p-5 hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-text-primary truncate">
                            {project.projectName}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}>
                            {PROJECT_STATUS_LABELS[project.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-text-secondary font-mono">
                          <span>{project.partNumber}</span>
                          <span className="text-border">·</span>
                          <span>{project.drawingNumber}</span>
                          <span className="text-border">·</span>
                          <span>Rev {project.drawingRevision}</span>
                          {project.customerName && (
                            <>
                              <span className="text-border">·</span>
                              <span className="font-sans">{project.customerName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden md:block text-xs text-text-secondary">
                          {fmtTimestamp(project.updatedAt)}
                        </span>
                        <button
                          onClick={() => navigate(`/projects/${project.projectId}`)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-colors">
                          Open
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/projects/${project.projectId}/edit`}
                          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary px-3 py-2 rounded-lg border border-border hover:bg-gray-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button
                          onClick={() => setProjectToDelete(project)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-center text-xs text-text-secondary mt-4">
              Showing {filteredProjects.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </main>

      {projectToDelete && (
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
