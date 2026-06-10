import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { Feature } from '../../featureTable/types/featureTypes'

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
      <button
        onClick={onToggleForm3}
        title={isForm3Open ? 'Close AS9102 Form 3 inspection panel' : 'Open AS9102 Form 3 — full-screen inspection report'}
        className={[
          'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all',
          isForm3Open
            ? 'bg-primary/20 text-primary-light ring-1 ring-primary/40'
            : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]',
        ].join(' ')}
      >
        <div className={[
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
          isForm3Open ? 'bg-primary/30' : 'bg-white/10',
        ].join(' ')}>
          <ClipboardList className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 text-left">
          <div>{isForm3Open ? 'Form 3 — Open' : 'Open Form 3'}</div>
          {isForm3Open && (
            <div className="text-[9px] font-normal text-primary-light/70 mt-0.5">
              Full-screen inspection panel active
            </div>
          )}
        </div>
        {isForm3Open && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse shrink-0" />
        )}
      </button>

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
