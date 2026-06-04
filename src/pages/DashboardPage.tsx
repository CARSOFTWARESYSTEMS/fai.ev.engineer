import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FolderPlus,
  FolderOpen,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Building2,
  MessageCircle,
  Pencil,
  Key,
  AlertCircle,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProductConfig } from '../config/hooks/useProductConfig'
import { FEATURE_LABELS, type FeatureKey } from '../config/productConfig.types'
import { getUserProjects } from '../projects/project.service'
import {
  type FAIProject,
  fmtTimestamp,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '../projects/project.types'

const FEATURE_BADGE_KEYS: FeatureKey[] = [
  'dashboard', 'createProject', 'projectList', 'pdfViewer',
  'manualBallooning', 'featureTable', 'form3Export',
  'googleDriveSave', 'ocrExtraction', 'adminPortal',
]

const sprintStatus = [
  { label: 'Public marketing website', done: true },
  { label: 'Google Sign-In + Firestore profile', done: true },
  { label: 'Complete Profile + Edit Profile', done: true },
  { label: 'Product Key + Org Feature Config', done: true },
  { label: 'Project creation + metadata', done: true },
  { label: 'Project list + detail view', done: true },
  { label: 'Edit + delete projects (soft delete)', done: true },
  { label: 'PDF Viewer', done: false },
  { label: 'Balloon Tool', done: false },
  { label: 'Feature Table', done: false },
  { label: 'AS9102 Form 3 Export', done: false },
  { label: 'Google Drive Integration', done: false },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, firebaseUser, signOut } = useAuth()
  const { productKey, productConfig, organizationConfig, usingDefaultOrgConfig, canAccess } = useProductConfig()

  // Project state
  const [projects, setProjects] = useState<FAIProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) return
    setProjectsLoading(true)
    getUserProjects(firebaseUser.uid)
      .then(setProjects)
      .finally(() => setProjectsLoading(false))
  }, [firebaseUser?.uid])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = user?.displayName || firebaseUser?.displayName || 'User'
  const photoURL = user?.photoURL || firebaseUser?.photoURL
  const email = user?.email || firebaseUser?.email

  const projectCountLabel = projectsLoading
    ? 'Loading…'
    : `${projects.length} Project${projects.length !== 1 ? 's' : ''}`

  const recentProjects = projects.slice(0, 5)

  // Feature-aware card definitions
  const dashboardCards = [
    {
      icon: <FolderPlus className="w-6 h-6 text-primary" />,
      title: 'Create Project',
      description: 'Start a new FAI ballooning project from an engineering drawing PDF.',
      cta: 'New Project',
      href: '/projects/new',
      feature: 'createProject' as FeatureKey,
      badge: null as string | null,
      soon: false,
    },
    {
      icon: <FolderOpen className="w-6 h-6 text-primary" />,
      title: 'My Projects',
      description: canAccess('projectList')
        ? 'View and manage your FAI projects.'
        : 'Project listing is not enabled for your organization.',
      cta: 'View Projects',
      href: '/projects',
      feature: 'projectList' as FeatureKey,
      badge: projectCountLabel,
      soon: false,
    },
    {
      icon: <CreditCard className="w-6 h-6 text-warning" />,
      title: 'Subscription Status',
      description: 'Manage your plan, billing, and trial period.',
      cta: 'Manage',
      href: null as string | null,
      feature: null as FeatureKey | null,
      badge: null as string | null,
      soon: false,
    },
    {
      icon: <Settings className="w-6 h-6 text-text-secondary" />,
      title: 'Product Configuration',
      description: 'Admin feature — manage organization config, feature flags, and team access.',
      cta: 'Admin Only',
      href: null as string | null,
      feature: 'adminPortal' as FeatureKey,
      badge: null as string | null,
      soon: true,
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Welcome back, {displayName.split(' ')[0]}
          </h1>
          <p className="text-text-secondary mt-1">
            Your aerospace drawing ballooning and FAI report toolkit.
          </p>
        </div>

        {/* Profile strip */}
        {user && (
          <div className="mb-5 bg-white border border-border rounded-xl px-5 py-4 flex flex-wrap items-center gap-4">
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

        {/* Default org warning */}
        {usingDefaultOrgConfig && (
          <div className="mb-5 flex items-start gap-2.5 bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Default organization configuration applied. Contact your administrator to configure organization-specific feature access.
          </div>
        )}

        {/* Trial notice */}
        <div className="mb-6 flex items-start gap-3 bg-primary-light border border-primary/20 rounded-xl px-5 py-4">
          <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary">
              {productConfig.pricing.trialDays}-Day Trial Active
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Full feature access during your trial. PDF viewer and balloon tool coming in the next phase.
            </p>
          </div>
        </div>

        {/* Feature-aware cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {dashboardCards.map((card) => {
            const enabled = card.feature !== null ? canAccess(card.feature) : false
            return (
              <div key={card.title}
                className={`card p-6 flex flex-col gap-4 ${!enabled ? 'opacity-60' : 'hover:shadow-md transition-shadow'}`}>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {card.badge && (
                      <span className="text-xs font-semibold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                        {card.badge}
                      </span>
                    )}
                    {card.soon && (
                      <span className="text-xs font-semibold bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-text-primary">{card.title}</h2>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">{card.description}</p>
                </div>
                <button
                  disabled={!enabled}
                  onClick={() => enabled && card.href && navigate(card.href)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    enabled
                      ? 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                      : 'bg-gray-100 text-text-secondary cursor-not-allowed'
                  }`}
                >
                  {card.cta}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Recent Projects widget ──────────────────────────────────────── */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-text-primary">Recent Projects</h2>
              {!projectsLoading && (
                <span className="text-xs font-semibold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {projectsLoading && (
                <RefreshCw className="w-3.5 h-3.5 text-text-secondary animate-spin" />
              )}
              {canAccess('projectList') && projects.length > 0 && (
                <Link to="/projects"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View All
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {projectsLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!projectsLoading && recentProjects.length === 0 && (
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

          {!projectsLoading && recentProjects.length > 0 && (
            <div className="flex flex-col divide-y divide-border">
              {recentProjects.map((project) => {
                const statusClass = PROJECT_STATUS_COLORS[project.status]
                return (
                  <div key={project.projectId}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {project.projectName}
                      </p>
                      <p className="text-xs text-text-secondary font-mono truncate">
                        {project.partNumber} · {project.drawingNumber} · Rev {project.drawingRevision}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:block ${statusClass}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                      <span className="text-xs text-text-secondary hidden md:block">
                        {fmtTimestamp(project.updatedAt)}
                      </span>
                      <button
                        onClick={() => navigate(`/projects/${project.projectId}`)}
                        className="text-xs font-semibold text-primary hover:bg-primary-light px-2.5 py-1.5 rounded-lg transition-colors border border-primary/20">
                        Open
                      </button>
                      <Link
                        to={`/projects/${project.projectId}/edit`}
                        className="text-xs font-semibold text-text-secondary hover:text-primary hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors">
                        Edit
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Product & Org Config Panel */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Key className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-text-primary">Product &amp; Organization Configuration</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 pb-6 border-b border-border">
            {[
              { label: 'Product', value: productConfig.productName },
              { label: 'Product Key', value: productKey, mono: true },
              { label: 'Organization', value: organizationConfig.organizationName },
              { label: 'Org Code', value: organizationConfig.organizationCode, mono: true },
              { label: 'Plan', value: organizationConfig.plan, capitalize: true },
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

        {/* Sprint status */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary mb-4">
            Sprint Progress — Days 1–4.2 Complete
          </h2>
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
