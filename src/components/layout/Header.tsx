import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

type NavLink =
  | { label: string; href: string; type: 'anchor' }
  | { label: string; to: string; type: 'route' }

const navLinks: NavLink[] = [
  { label: 'Features', href: '#features', type: 'anchor' },
  { label: 'How It Works', href: '#how-it-works', type: 'anchor' },
  { label: 'Pricing', href: '#pricing', type: 'anchor' },
  { label: 'Roadmap', to: '/roadmap', type: 'route' },
  { label: 'FAQ', href: '#faq', type: 'anchor' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + sub-brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-text-primary tracking-tight">
                FAI Engineer
              </span>
              <span className="text-[10px] font-medium text-text-secondary tracking-wide">
                by{' '}
                <a href="https://ev.engineer" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">EV.ENGINEER</a>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) =>
              link.type === 'route' ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary rounded-lg hover:bg-primary-light transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary rounded-lg hover:bg-primary-light transition-colors duration-200"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-text-primary hover:text-primary transition-colors duration-200"
            >
              Sign In
            </Link>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-sm px-5 py-2.5"
            >
              Start 7-Day Trial
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) =>
            link.type === 'route' ? (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <div className="border-t border-border mt-2 pt-4 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-center text-text-primary border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-center text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              Start 7-Day Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
