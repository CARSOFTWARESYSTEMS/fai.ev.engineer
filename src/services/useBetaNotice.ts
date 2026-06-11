import { useEffect, useState } from 'react'
import { subscribeToBetaNotice, BETA_NOTICE_DEFAULTS } from './betaNoticeService'
import type { BetaNoticeConfig } from './betaNoticeService'

// Stores the nonce of the config version the user dismissed.
// Any new save generates a fresh nonce → stored value no longer matches → banner re-appears.
const SESSION_KEY = 'fai-beta-banner-dismissed-nonce'

export function useBetaNotice() {
  const [config,      setConfig]      = useState<BetaNoticeConfig>(BETA_NOTICE_DEFAULTS)
  const [isLoading,   setIsLoading]   = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    return subscribeToBetaNotice(incoming => {
      setConfig(incoming)
      setIsLoading(false)
      const stored = sessionStorage.getItem(SESSION_KEY)
      // Keep dismissed only if the stored nonce still matches this exact version
      setIsDismissed(
        stored !== null &&
        incoming.nonce != null &&
        stored === incoming.nonce,
      )
    })
  }, [])

  const dismiss = () => {
    if (config.nonce) sessionStorage.setItem(SESSION_KEY, config.nonce)
    setIsDismissed(true)
  }

  return { config, isLoading, isDismissed, dismiss }
}
