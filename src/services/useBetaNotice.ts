import { useEffect, useState } from 'react'
import { subscribeToBetaNotice, BETA_NOTICE_DEFAULTS } from './betaNoticeService'
import type { BetaNoticeConfig } from './betaNoticeService'

const SESSION_KEY = 'fai-beta-banner-dismissed'

// Fingerprint of the meaningful fields that should re-show the banner if changed.
// Changing title, message, severity, or toggling enabled/dismissible all invalidate
// a previously stored dismiss, causing the banner to reappear.
function fingerprint(c: BetaNoticeConfig): string {
  return `${c.enabled}|${c.title}|${c.message}|${c.severity}|${c.dismissible}`
}

export function useBetaNotice() {
  const [config,      setConfig]      = useState<BetaNoticeConfig>(BETA_NOTICE_DEFAULTS)
  const [isLoading,   setIsLoading]   = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    return subscribeToBetaNotice(incoming => {
      setConfig(incoming)
      setIsLoading(false)
      // Re-evaluate dismiss: only keep it if the stored fingerprint still matches
      const stored = sessionStorage.getItem(SESSION_KEY)
      setIsDismissed(stored !== null && stored === fingerprint(incoming))
    })
  }, [])

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, fingerprint(config))
    setIsDismissed(true)
  }

  return { config, isLoading, isDismissed, dismiss }
}
