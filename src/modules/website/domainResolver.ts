import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '../../firebase/firestore'
import type { ProductId } from '../../auth/AuthTypes'
import type { DomainMapping, ResolvedDomainContext } from './types'

// ─── Fallback context ─────────────────────────────────────────────────────────

const FALLBACK_CONTEXT: ResolvedDomainContext = {
  hostname:        '',
  partnerId:       undefined,
  brandingId:      undefined,
  websiteConfigId: undefined,
  defaultProduct:  'fai_reports',
  enabledProducts: ['fai_reports'],
  status:          'unknown',
  source:          'fallback',
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function toContext(hostname: string, d: DomainMapping): ResolvedDomainContext {
  return {
    hostname,
    partnerId:       d.partnerId       || undefined,
    brandingId:      d.brandingId      || undefined,
    websiteConfigId: d.websiteConfigId || undefined,
    defaultProduct:  d.defaultProduct  || 'fai_reports',
    enabledProducts: Array.isArray(d.enabledProducts) && d.enabledProducts.length > 0
      ? d.enabledProducts as ProductId[]
      : ['fai_reports'],
    status: d.status === 'inactive' ? 'inactive' : 'active',
    source: 'firebase',
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolves the given hostname against the domainMappings Firestore collection.
 * Falls back gracefully if the doc is missing or the read fails.
 */
export async function resolveDomain(hostname: string): Promise<ResolvedDomainContext> {
  if (!hostname) return { ...FALLBACK_CONTEXT, hostname }

  try {
    const snap = await getDoc(doc(firestore, 'domainMappings', hostname))
    if (!snap.exists()) return { ...FALLBACK_CONTEXT, hostname }
    return toContext(hostname, snap.data() as DomainMapping)
  } catch {
    return { ...FALLBACK_CONTEXT, hostname }
  }
}

/**
 * Resolves the current browser hostname (window.location.hostname).
 */
export async function resolveCurrentDomain(): Promise<ResolvedDomainContext> {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  return resolveDomain(hostname)
}
