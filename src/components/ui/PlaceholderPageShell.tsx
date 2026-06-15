import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Construction, CheckCircle2, CalendarClock, ArrowLeft, ChevronRight } from 'lucide-react'
import { UserAvatarMenu } from './UserAvatarMenu'
import { useBranding } from '../../hooks/useBranding'

interface BreadcrumbItem {
  label: string
  to?:   string
}

interface SubNavItem {
  label: string
  to:    string
}

interface Props {
  title:       string
  description: string
  icon:        ReactNode
  breadcrumbs: BreadcrumbItem[]
  subNav?:     SubNavItem[]
  backTo?:     string
  backLabel?:  string
  phase?:      string
  archRef?:    string
}

export function PlaceholderPageShell({
  title,
  description,
  icon,
  breadcrumbs,
  subNav,
  backTo,
  backLabel,
  phase = 'Phase 2',
  archRef,
}: Props) {
  const { branding } = useBranding()
  const location     = useLocation()

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Left: logo + breadcrumbs */}
            <div className="flex items-center gap-2 min-w-0">
              <Link to="/dashboard" className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {branding.businessName.charAt(0).toUpperCase()}
                </span>
              </Link>
              <div className="flex items-center gap-1 min-w-0">
                {breadcrumbs.map((crumb, i) => (
                  <div key={i} className="flex items-center gap-1 min-w-0">
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-secondary shrink-0" />}
                    {crumb.to
                      ? <Link to={crumb.to} className="text-sm text-text-secondary hover:text-primary transition-colors truncate">{crumb.label}</Link>
                      : <span className="text-sm font-semibold text-text-primary truncate">{crumb.label}</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            <UserAvatarMenu />
          </div>
        </div>

        {/* Sub-navigation */}
        {subNav && subNav.length > 0 && (
          <div className="border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-1 h-10 overflow-x-auto">
                {subNav.map(item => {
                  const isActive = location.pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-primary-light text-primary'
                          : 'text-text-secondary hover:text-primary hover:bg-primary-light/50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center gap-6">

        {backTo && (
          <div className="w-full max-w-lg">
            <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              {backLabel ?? 'Back'}
            </Link>
          </div>
        )}

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
          {icon}
        </div>

        {/* Title + description */}
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>

        {/* Status cards */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-success/10 border border-success/20 flex-1 w-full">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <div>
              <p className="text-xs font-semibold text-success">Architecture Approved</p>
              <p className="text-[10px] text-success/70">Design frozen 2026-06-15</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary-light border border-primary/20 flex-1 w-full">
            <CalendarClock className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary">Implementation Planned</p>
              <p className="text-[10px] text-primary/70">Scheduled: {phase}</p>
            </div>
          </div>
        </div>

        {/* Construction notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-border max-w-md w-full">
          <Construction className="w-4 h-4 text-text-secondary shrink-0" />
          <p className="text-xs text-text-secondary">
            This feature is under development. Navigation and routes are active for internal validation.
          </p>
        </div>

        {archRef && (
          <p className="text-[10px] text-text-secondary">
            Architecture ref: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">{archRef}</code>
          </p>
        )}
      </main>
    </div>
  )
}
