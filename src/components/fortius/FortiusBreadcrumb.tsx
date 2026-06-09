import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

export function FortiusBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
          <li>
            <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          </li>
          {crumbs.map((crumb, i) => (
            <li key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-primary transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text-primary font-medium">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
