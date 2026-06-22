import { CheckCircle2, AlertTriangle } from 'lucide-react'

// ─── FeedbackBanner ───────────────────────────────────────────────────────────

export function FeedbackBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm
      ${type === 'success'
        ? 'bg-success/10 border border-success/20 text-success'
        : 'bg-error/10 border border-error/20 text-error'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  valueColor = 'text-text-primary',
}: {
  label:       string
  value:       string | number
  valueColor?: string
}) {
  return (
    <div className="card p-4">
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-[11px] font-medium text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon:         React.ComponentType<{ className?: string }>
  title:        string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <Icon className="w-8 h-8 text-border mb-3" />
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="text-xs text-text-secondary/70 mt-1 max-w-xs">{description}</p>
      )}
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export function StatusBadge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
// Card with a styled header (gray-50 tint + optional icon accent).
// Drop-in replacement for the inline SectionCard defined in OrganisationDetailPage.

export function SectionCard({
  title,
  icon: Icon,
  iconBg  = 'bg-gray-100',
  iconColor = 'text-text-secondary',
  children,
  action,
}: {
  title:      string
  icon?:      React.ComponentType<{ className?: string }>
  iconBg?:    string
  iconColor?: string
  children:   React.ReactNode
  action?:    React.ReactNode
}) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gray-50 px-5 py-3.5 border-b border-border flex items-center gap-3">
        {Icon && (
          <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        )}
        <h2 className="flex-1 text-sm font-bold text-text-primary">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
