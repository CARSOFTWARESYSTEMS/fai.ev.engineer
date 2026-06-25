// ─── Domain Validation Utilities ─────────────────────────────────────────────

const HOSTNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/

export function isValidHostname(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  const v = value.trim().toLowerCase()
  if (v.startsWith('https://') || v.startsWith('http://')) return false
  if (v.endsWith('/')) return false
  return HOSTNAME_RE.test(v)
}

// Normalise a raw hostname input to the canonical storage format.
export function normaliseHostname(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function hostnameValidationError(value: string): string | null {
  if (!value.trim()) return 'Hostname is required.'
  if (value.includes('https://') || value.includes('http://')) return 'Enter the hostname only — no https:// prefix.'
  if (value.endsWith('/')) return 'Remove the trailing slash.'
  if (!HOSTNAME_RE.test(value.trim().toLowerCase())) return 'Use lowercase letters, digits, hyphens, and dots only.'
  return null
}
