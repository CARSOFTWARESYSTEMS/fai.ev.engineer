import type { ComponentType, ReactNode } from 'react'

type SidebarActionTone = 'blue' | 'green' | 'neutral'

interface SidebarActionCardProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  eyebrow?: string
  tone?: SidebarActionTone
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  titleText?: string
  className?: string
  trailing?: ReactNode
  children?: ReactNode
}

const toneClasses: Record<SidebarActionTone, {
  card: string
  icon: string
  eyebrow: string
  description: string
}> = {
  blue: {
    card: 'border-primary/55 bg-primary/[0.10] text-blue-100 hover:border-primary/80 hover:bg-primary/[0.16] hover:shadow-lg',
    icon: 'bg-primary/20 text-blue-200',
    eyebrow: 'text-blue-300',
    description: 'text-blue-100/65',
  },
  green: {
    card: 'border-emerald-500/45 bg-emerald-500/[0.08] text-emerald-100 hover:border-emerald-500/70 hover:bg-emerald-500/[0.12] hover:shadow-lg',
    icon: 'bg-emerald-500/20 text-emerald-300',
    eyebrow: 'text-emerald-300',
    description: 'text-emerald-300/75',
  },
  neutral: {
    card: 'border-white/[0.08] bg-white/[0.04] text-gray-300 hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white',
    icon: 'bg-white/[0.08] text-gray-400',
    eyebrow: 'text-gray-500',
    description: 'text-gray-500',
  },
}

export function SidebarActionCard({
  icon: Icon,
  title,
  description,
  eyebrow,
  tone = 'blue',
  active = false,
  disabled = false,
  onClick,
  titleText,
  className = '',
  trailing,
  children,
}: SidebarActionCardProps) {
  const styles = toneClasses[tone]
  const classes = [
    'w-full rounded-xl border p-3 text-left shadow-sm transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]',
    onClick ? 'cursor-pointer hover:-translate-y-0.5' : '',
    disabled ? 'cursor-not-allowed opacity-40' : styles.card,
    active ? tone === 'green'
      ? 'shadow-[0_0_16px_rgb(34_197_94_/_0.13)]'
      : 'shadow-[0_0_18px_rgb(15_111_255_/_0.16)]'
      : '',
    className,
  ].join(' ')

  const content = (
    <>
      <div className="flex items-start gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${styles.eyebrow}`}>
              {eyebrow}
            </p>
          )}
          <p className={`${eyebrow ? 'mt-0.5' : ''} text-xs font-semibold`}>{title}</p>
          {description && (
            <p className={`mt-1 text-[9px] font-normal leading-relaxed ${styles.description}`}>
              {description}
            </p>
          )}
        </div>
        {trailing}
      </div>
      {children}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={titleText}
        className={classes}
      >
        {content}
      </button>
    )
  }

  return <div className={classes}>{content}</div>
}

interface SidebarActionButtonProps {
  icon: ComponentType<{ className?: string }>
  label: string
  description?: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  tone?: 'default' | 'danger'
  title?: string
}

export function SidebarActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  disabled = false,
  active = false,
  tone = 'default',
  title,
}: SidebarActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={[
        'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#111827]',
        'disabled:cursor-not-allowed disabled:opacity-35',
        tone === 'danger'
          ? 'border-red-500/25 bg-red-500/[0.06] text-red-300 hover:border-red-500/45 hover:bg-red-500/[0.12]'
          : active
            ? 'border-primary/45 bg-primary/15 text-blue-100'
            : 'border-white/[0.08] bg-white/[0.035] text-gray-300 hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white',
      ].join(' ')}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-none">{label}</span>
        {description && <span className="mt-1 block text-[9px] text-gray-500">{description}</span>}
      </span>
    </button>
  )
}
