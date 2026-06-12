import { useEffect, useState } from 'react'
import { subscribeToActiveBranding, type BrandingPreset } from '../services/brandingService'

export interface ResolvedBranding {
  businessName:   string
  businessCode:   string
  logoUrl?:       string
  poweredByText:  string
  poweredByUrl:   string
  supportEmail?:  string
  supportPhone?:  string
  whatsappNumber?: string
}

export const FALLBACK_BRANDING: ResolvedBranding = {
  businessName:  'FAI Engineer',
  businessCode:  'fai',
  logoUrl:       undefined,
  poweredByText: 'powered by EV.ENGINEER',
  poweredByUrl:  'https://ev.engineer',
}

function resolvePreset(preset: BrandingPreset | null): ResolvedBranding {
  if (!preset) return FALLBACK_BRANDING
  return {
    businessName:   preset.businessName  || FALLBACK_BRANDING.businessName,
    businessCode:   preset.businessCode  || FALLBACK_BRANDING.businessCode,
    logoUrl:        preset.logoUrl,
    poweredByText:  preset.poweredByText || FALLBACK_BRANDING.poweredByText,
    poweredByUrl:   preset.poweredByUrl  || FALLBACK_BRANDING.poweredByUrl,
    supportEmail:   preset.supportEmail,
    supportPhone:   preset.supportPhone,
    whatsappNumber: preset.whatsappNumber,
  }
}

export interface UseBrandingResult {
  branding:   ResolvedBranding
  loading:    boolean
  isFallback: boolean
}

export function useBranding(): UseBrandingResult {
  const [branding,   setBranding]   = useState<ResolvedBranding>(FALLBACK_BRANDING)
  const [loading,    setLoading]    = useState(true)
  const [isFallback, setIsFallback] = useState(true)

  useEffect(() => {
    const unsub = subscribeToActiveBranding(preset => {
      setBranding(resolvePreset(preset))
      setIsFallback(preset === null)
      setLoading(false)
    })
    return unsub
  }, [])

  return { branding, loading, isFallback }
}
