/**
 * OrganizationSwitcher — Phase 1.5
 *
 * Placeholder component that validates UI space in the header.
 * Uses demo data only — no Firestore reads.
 *
 * Phase 2: replace DEMO_ORGS with real organizationMembers query
 * and wire up organization context switching.
 */
import { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useBranding } from '../../hooks/useBranding'
import { useAccessHelpers } from '../../lib/accessHelpers'
import { useCurrentPartner } from '../../services/partnerAccessService'

interface OrgOption {
  id:   string
  name: string
}

// Phase 1.5 demo data — replaced with Firestore data in Phase 2
const DEMO_ORGS: OrgOption[] = [
  { id: 'demo-org', name: 'Demo Organization' },
]

export function OrganizationSwitcher() {
  const { branding }              = useBranding()
  const { canViewOrganization }   = useAccessHelpers()
  const { partner }               = useCurrentPartner()
  const [open, setOpen]  = useState(false)
  const [selected, setSelected] = useState<OrgOption>(DEMO_ORGS[0])
  const ref              = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  if (!canViewOrganization) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border
          bg-white hover:bg-gray-50 transition-colors text-left max-w-[180px] sm:max-w-[220px]"
        aria-label="Switch organization"
        aria-expanded={open}
      >
        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs font-medium text-text-primary truncate flex-1">
          {selected.name}
        </span>
        <ChevronDown className={`w-3 h-3 text-text-secondary shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-border z-50 overflow-hidden">

          {/* Partner context (read-only, derived from branding) */}
          <div className="px-3 py-2 bg-gray-50 border-b border-border">
            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
              Partner
            </p>
            <p className="text-xs font-medium text-text-primary truncate">
              {partner?.name ?? branding.businessName}
            </p>
          </div>

          {/* Organization list */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
              Organization
            </p>
            <div className="flex flex-col gap-0.5">
              {DEMO_ORGS.map(org => (
                <button
                  key={org.id}
                  onClick={() => { setSelected(org); setOpen(false) }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary-light/50
                    transition-colors text-left w-full"
                >
                  <div className="w-6 h-6 rounded-md bg-primary-light flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-[10px]">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-text-primary flex-1 truncate">{org.name}</span>
                  {selected.id === org.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phase badge */}
          <div className="px-3 py-2">
            <p className="text-[10px] text-text-secondary text-center">
              Multi-org switching available in Phase 2
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
