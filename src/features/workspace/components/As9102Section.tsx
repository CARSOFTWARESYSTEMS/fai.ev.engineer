import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { Feature } from '../../featureTable/types/featureTypes'
import { SidebarActionCard } from './SidebarActionCard'

interface As9102SectionProps {
  isExpanded: boolean
  isForm3Open: boolean
  onToggleForm3: () => void
  features: Feature[]
}

export function As9102Section({
  isExpanded,
  isForm3Open,
  onToggleForm3,
  features,
}: As9102SectionProps) {
  if (!isExpanded) return null

  return (
    <div className="px-3 space-y-2">
      {/* Standard label */}
      <div className="px-0 py-0.5">
        <span className="text-[9px] font-medium text-gray-600 tracking-wide">
          AS9102D · First Article Inspection
        </span>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-gray-600">
          Feature Table Summary
        </p>
        <p className="mt-1 text-xs font-semibold text-gray-300">
          {features.length} characteristic{features.length !== 1 ? 's' : ''} available for inspection
        </p>
      </div>

      {/* Open/Close Form 3 button */}
      <SidebarActionCard
        icon={ClipboardList}
        onClick={onToggleForm3}
        title={isForm3Open ? 'AS9102 Form 3 — Open' : 'Open AS9102 Form 3'}
        description={isForm3Open ? 'Full-screen inspection panel active' : 'Record inspection results'}
        titleText={isForm3Open ? 'Close AS9102 Form 3 inspection panel' : 'Open AS9102 Form 3 — full-screen inspection report'}
        tone="blue"
        active
        className="as9102-entry-cta"
        trailing={isForm3Open ? (
          <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse shrink-0" />
        ) : undefined}
      />

      {!isForm3Open && (
        <div className="rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-300">Next Step</p>
          <p className="mt-1 text-[10px] text-blue-100/70">Open Form 3 to begin inspection</p>
        </div>
      )}

      {/* Status legend — shown as guide when form3 not open */}
      {!isForm3Open && (
        <>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 space-y-1.5">
            <p className="text-[9px] font-semibold tracking-[0.1em] text-gray-600 uppercase mb-1.5">
              Inspection Status
            </p>
            {[
              { icon: CheckCircle2, label: 'Pass',    cls: 'text-emerald-500' },
              { icon: XCircle,      label: 'Fail',    cls: 'text-red-500' },
              { icon: Clock,        label: 'Pending', cls: 'text-amber-500' },
            ].map(({ icon: Icon, label, cls }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className={`w-3 h-3 ${cls} shrink-0`} />
                <span className="text-[10px] text-gray-500">{label}</span>
              </div>
            ))}
            <p className="text-[9px] text-gray-600 pt-1 border-t border-white/[0.04]">
              Open Form 3 to record and view inspection results.
            </p>
          </div>

        </>
      )}
    </div>
  )
}
