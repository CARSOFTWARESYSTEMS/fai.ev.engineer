import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { resolveCurrentDomain } from './domainResolver'
import type { ResolvedDomainContext } from './types'

// ─── Fallback ─────────────────────────────────────────────────────────────────

const FALLBACK: ResolvedDomainContext = {
  hostname:        typeof window !== 'undefined' ? window.location.hostname : '',
  partnerId:       undefined,
  brandingId:      undefined,
  websiteConfigId: undefined,
  defaultProduct:  'fai_reports',
  enabledProducts: ['fai_reports'],
  status:          'unknown',
  source:          'fallback',
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface DomainContextState {
  domainContext: ResolvedDomainContext
  isLoading:     boolean
  error:         string | null
  isFallback:    boolean
}

const DomainContext = createContext<DomainContextState>({
  domainContext: FALLBACK,
  isLoading:     true,
  error:         null,
  isFallback:    true,
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DomainContextProvider({ children }: { children: ReactNode }) {
  const [domainContext, setDomainContext] = useState<ResolvedDomainContext>(FALLBACK)
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    resolveCurrentDomain()
      .then(ctx => {
        if (cancelled) return
        setDomainContext(ctx)
        setError(null)
      })
      .catch(err => {
        if (cancelled) return
        console.warn('[DOMAIN] Domain resolution failed — using fallback:', err)
        setError('Domain context unavailable.')
        setDomainContext({ ...FALLBACK, hostname: window.location.hostname })
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const isFallback = domainContext.source === 'fallback'

  return (
    <DomainContext.Provider value={{ domainContext, isLoading, error, isFallback }}>
      {children}
    </DomainContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDomainContext(): DomainContextState {
  return useContext(DomainContext)
}
