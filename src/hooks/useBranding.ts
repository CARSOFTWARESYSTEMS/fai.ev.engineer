import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'
import { getCurrentHostname, subscribeDomainBranding } from '../services/domainBrandingService'
import type { BrandingPreset } from '../services/brandingService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedBranding {
  businessName:            string
  businessCode:            string
  logoUrl?:                string
  website?:                string
  poweredByText:           string
  poweredByUrl:            string
  supportEmail?:           string
  supportPhone?:           string
  whatsappNumber?:         string
  technicalSupportNumber?: string
}

export interface UseBrandingResult {
  branding:         ResolvedBranding
  activeBrandingId: string | undefined
  loading:          boolean
  isFallback:       boolean
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

export const FALLBACK_BRANDING: ResolvedBranding = {
  businessName:           'FAI Engineer',
  businessCode:           'fai',
  poweredByText:          'EV.ENGINEER',
  poweredByUrl:           'https://ev.engineer',
  supportEmail:           'info@itelematics.com',
  supportPhone:           '+918880423666',
  whatsappNumber:         '918880423666',
  technicalSupportNumber: '919108206147',
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BrandingContext = createContext<UseBrandingResult>({
  branding:         FALLBACK_BRANDING,
  activeBrandingId: undefined,
  loading:          true,
  isFallback:       true,
})

// ─── Resolver ─────────────────────────────────────────────────────────────────

function resolvePreset(preset: BrandingPreset): ResolvedBranding {
  return {
    businessName:           preset.businessName            || FALLBACK_BRANDING.businessName,
    businessCode:           preset.businessCode            || FALLBACK_BRANDING.businessCode,
    logoUrl:                preset.logoUrl,
    website:                preset.website,
    poweredByText:          preset.poweredByText           || FALLBACK_BRANDING.poweredByText,
    poweredByUrl:           preset.poweredByUrl            || FALLBACK_BRANDING.poweredByUrl,
    supportEmail:           preset.supportEmail,
    supportPhone:           preset.supportPhone,
    whatsappNumber:         preset.whatsappNumber,
    technicalSupportNumber: preset.technicalSupportNumber,
  }
}

// ─── Provider — one Firestore subscription for the whole app ─────────────────

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding,         setBranding]         = useState<ResolvedBranding>(FALLBACK_BRANDING)
  const [activeBrandingId, setActiveBrandingId] = useState<string | undefined>(undefined)
  const [loading,          setLoading]          = useState(true)
  const [isFallback,       setIsFallback]       = useState(true)

  useEffect(() => {
    const hostname = getCurrentHostname()
    return subscribeDomainBranding(hostname, preset => {
      if (preset) {
        setBranding(resolvePreset(preset))
        setActiveBrandingId(preset.brandingId)
        setIsFallback(false)
      } else {
        setBranding(FALLBACK_BRANDING)
        setActiveBrandingId(undefined)
        setIsFallback(true)
      }
      setLoading(false)
    })
  }, [])

  return createElement(BrandingContext.Provider, { value: { branding, activeBrandingId, loading, isFallback } }, children)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBranding(): UseBrandingResult {
  return useContext(BrandingContext)
}
