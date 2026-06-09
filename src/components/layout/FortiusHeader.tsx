import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Capabilities',         href: '#capabilities' },
  { label: 'Industries',           href: '#industries' },
  { label: 'Manufacturing',        href: '#manufacturing' },
  { label: 'Gallery',              href: '#gallery' },
  { label: 'Leadership',           href: '#leadership' },
  { label: 'Technology Partners',  href: '#technology-partners' },
  { label: 'Contact',              href: '#contact' },
]

export function FortiusHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — links back to home */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-text-primary tracking-tight">
                Fortius
              </span>
              <span className="text-[10px] font-medium text-text-secondary tracking-wide">
                Machining Solutions
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary rounded-lg hover:bg-primary-light transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center shrink-0">
            <a
              href="#contact"
              className="btn-primary text-sm px-5 py-2.5"
            >
              Request Quote
            </a>
          </div>

          {/* Mobile toggle */}
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
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-border mt-2 pt-4">
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-center text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              Request Quote
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
