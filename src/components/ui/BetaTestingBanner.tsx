import { AlertTriangle, Info, X } from 'lucide-react'
import { useBetaNotice } from '../../services/useBetaNotice'
import type { BetaNoticeSeverity } from '../../services/betaNoticeService'

interface BetaTestingBannerProps {
  variant?: 'light' | 'dark'
}

type SeverityStyle = {
  wrapper: string
  icon: string
  text: string
  closeBtn: string
}

const LIGHT_STYLES: Record<BetaNoticeSeverity, SeverityStyle> = {
  error: {
    wrapper:  'bg-red-50 border-b border-red-200',
    icon:     'text-red-600',
    text:     'text-red-700',
    closeBtn: 'text-red-500 hover:bg-red-100',
  },
  warning: {
    wrapper:  'bg-amber-50 border-b border-amber-200',
    icon:     'text-amber-600',
    text:     'text-amber-700',
    closeBtn: 'text-amber-500 hover:bg-amber-100',
  },
  info: {
    wrapper:  'bg-blue-50 border-b border-blue-200',
    icon:     'text-blue-600',
    text:     'text-blue-700',
    closeBtn: 'text-blue-500 hover:bg-blue-100',
  },
}

const DARK_STYLES: Record<BetaNoticeSeverity, SeverityStyle> = {
  error: {
    wrapper:  'bg-red-950/80 border-b border-red-900/60',
    icon:     'text-red-400',
    text:     'text-red-300',
    closeBtn: 'text-red-400 hover:bg-red-900/40',
  },
  warning: {
    wrapper:  'bg-amber-950/80 border-b border-amber-900/60',
    icon:     'text-amber-400',
    text:     'text-amber-300',
    closeBtn: 'text-amber-400 hover:bg-amber-900/40',
  },
  info: {
    wrapper:  'bg-blue-950/80 border-b border-blue-900/60',
    icon:     'text-blue-400',
    text:     'text-blue-300',
    closeBtn: 'text-blue-400 hover:bg-blue-900/40',
  },
}

export function BetaTestingBanner({ variant = 'light' }: BetaTestingBannerProps) {
  const { config, isLoading, isDismissed, dismiss } = useBetaNotice()

  if (isLoading || !config.enabled || isDismissed) return null

  const styles    = (variant === 'dark' ? DARK_STYLES : LIGHT_STYLES)[config.severity]
  const Icon      = config.severity === 'info' ? Info : AlertTriangle
  const innerCls  = variant === 'light'
    ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5'
    : 'px-4 sm:px-6 py-2'

  return (
    <div className={`${styles.wrapper} shrink-0`}>
      <div className={`${innerCls} flex items-start gap-2.5`}>
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${styles.icon}`} />
        <p className={`flex-1 text-xs font-medium leading-relaxed ${styles.text}`}>
          <span className="font-bold">{config.title}:</span>{' '}
          {config.message}
        </p>
        {config.dismissible && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss beta notice"
            className={`shrink-0 rounded p-0.5 transition-colors ${styles.closeBtn}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
