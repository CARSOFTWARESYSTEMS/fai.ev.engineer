import { useNavigate } from 'react-router-dom'
import {
  FolderPlus,
  FolderOpen,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react'
import { useAuth } from '../auth/MockAuthProvider'

const dashboardCards = [
  {
    icon: <FolderPlus className="w-6 h-6 text-primary" />,
    title: 'Create Project',
    description: 'Start a new FAI ballooning project from an engineering drawing PDF.',
    cta: 'New Project',
    disabled: false,
    soon: false,
  },
  {
    icon: <FolderOpen className="w-6 h-6 text-primary" />,
    title: 'Recent Projects',
    description: 'Open and continue your existing FAI projects.',
    cta: 'View Projects',
    disabled: true,
    soon: false,
  },
  {
    icon: <CreditCard className="w-6 h-6 text-warning" />,
    title: 'Subscription Status',
    description: 'Manage your plan, billing, and trial period.',
    cta: 'Manage',
    disabled: true,
    soon: false,
  },
  {
    icon: <Settings className="w-6 h-6 text-text-secondary" />,
    title: 'Product Configuration',
    description: 'Configure theme, features, and product settings.',
    cta: 'Configure',
    disabled: true,
    soon: true,
  },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dashboard header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                FAI Engineer
              </span>
              <span className="hidden sm:block text-text-secondary text-sm ml-1">/ Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
                <User className="w-4 h-4" />
                <span>{user?.displayName || user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome banner */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Welcome to FAI Engineer
          </h1>
          <p className="text-text-secondary mt-1">
            Your aerospace drawing ballooning and FAI report toolkit.
          </p>
        </div>

        {/* Trial notice */}
        <div className="mb-8 flex items-center gap-3 bg-primary-light border border-primary/20 rounded-xl px-5 py-4">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">7-Day Trial Active</p>
            <p className="text-xs text-text-secondary mt-0.5">
              You have full access to all features during your trial period. PDF viewer, ballooning, and export tools are coming in the next sprint.
            </p>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {dashboardCards.map((card) => (
            <div
              key={card.title}
              className={`card p-6 flex flex-col gap-4 ${card.disabled ? 'opacity-60' : 'hover:shadow-md transition-shadow'}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                  {card.icon}
                </div>
                {card.soon && (
                  <span className="text-xs font-semibold bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-text-primary">{card.title}</h2>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <button
                disabled={card.disabled}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  card.disabled
                    ? 'bg-gray-100 text-text-secondary cursor-not-allowed'
                    : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {card.cta}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Status section */}
        <div className="mt-10 card p-6">
          <h2 className="font-semibold text-text-primary mb-4">Sprint 1 — Foundation Complete</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Public marketing website', done: true },
              { label: 'Authentication pages (UI)', done: true },
              { label: 'Protected route guard', done: true },
              { label: 'Theme and routing structure', done: true },
              { label: 'Firebase Authentication', done: false },
              { label: 'PDF Viewer', done: false },
              { label: 'Balloon Tool', done: false },
              { label: 'Feature Table', done: false },
              { label: 'AS9102 Form 3 Export', done: false },
              { label: 'Google Drive Integration', done: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.done ? 'bg-success' : 'bg-border'}`} />
                <span className={item.done ? 'text-text-primary' : 'text-text-secondary'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
