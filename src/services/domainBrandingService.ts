import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { BrandingPreset } from './brandingService'

export function getCurrentHostname(): string {
  return window.location.hostname
}

// Subscribes to the brandings collection and returns the first enabled preset
// whose `domains` array contains the given hostname. Returns null if none match.
// Uses a single `array-contains` query (no composite index required).
export function subscribeDomainBranding(
  hostname: string,
  callback: (branding: BrandingPreset | null) => void,
): () => void {
  const q = query(
    collection(firestore, 'brandings'),
    where('domains', 'array-contains', hostname),
  )

  let hasResolved = false

  return onSnapshot(
    q,
    snap => {
      hasResolved = true
      const match = snap.docs.find(d => (d.data() as BrandingPreset).enabled !== false)
      if (!match) { callback(null); return }
      callback({ brandingId: match.id, ...(match.data() as Omit<BrandingPreset, 'brandingId'>) })
    },
    _err => {
      // First-time failure (e.g. unauthenticated on cold load) → fall back.
      // Subsequent failures (e.g. logout revokes auth) → keep last known branding.
      if (!hasResolved) {
        hasResolved = true
        callback(null)
      }
    },
  )
}
