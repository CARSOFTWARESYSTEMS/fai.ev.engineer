import { useEffect, useState } from 'react'
import { subscribeToBetaNotice, BETA_NOTICE_DEFAULTS } from './betaNoticeService'
import type { BetaNoticeConfig } from './betaNoticeService'

const SESSION_KEY = 'fai-beta-banner-dismissed'

export function useBetaNotice() {
  const [config, setConfig]       = useState<BetaNoticeConfig>(BETA_NOTICE_DEFAULTS)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true',
  )

  useEffect(() => {
    const unsubscribe = subscribeToBetaNotice(incoming => {
      setConfig(incoming)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setIsDismissed(true)
  }

  return { config, isLoading, isDismissed, dismiss }
}
