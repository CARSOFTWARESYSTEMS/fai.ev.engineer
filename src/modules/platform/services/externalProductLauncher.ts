import type { ProductId } from '../../../auth/AuthTypes'
import { getProductEntry } from '../productCatalogue'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LaunchTokenPayload {
  uid:             string
  email:           string
  role:            string
  partnerId:       string
  organisationId?: string
  productKey:      ProductId
  domain:          string
  permissions:     string[]
  iat:             number
  exp:             number
  nonce:           string
}

export interface ExternalProductLaunchInput {
  productKey:      ProductId
  targetDomain:    string
  uid:             string
  email:           string
  role:            string
  partnerId:       string
  organisationId?: string
  permissions:     string[]
}

// ─── Token provider interface ─────────────────────────────────────────────────

export interface LaunchTokenProvider {
  createLaunchToken(payload: LaunchTokenPayload): Promise<string>
}

// ─── Dev placeholder token provider ──────────────────────────────────────────
// WARNING: This implementation does NOT sign the token.
// It is a base64url-encoded JSON placeholder for development only.
// Replace with CloudFunctionLaunchTokenProvider before any production external launch.

class DevLaunchTokenProvider implements LaunchTokenProvider {
  async createLaunchToken(payload: LaunchTokenPayload): Promise<string> {
    console.warn(
      '[LAUNCH] WARNING: Using unsigned dev token. NOT suitable for production.',
      'Replace with a Cloud Function signer before shipping external products.'
    )
    const json  = JSON.stringify(payload)
    const b64   = typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json).toString('base64')
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
}

// ─── Nonce helper ─────────────────────────────────────────────────────────────

function generateNonce(): string {
  const arr = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Public API ───────────────────────────────────────────────────────────────

const TOKEN_TTL_SECONDS = 300 // 5 minutes

// TODO (Phase 3): replace with CloudFunctionLaunchTokenProvider
const tokenProvider: LaunchTokenProvider = new DevLaunchTokenProvider()

export async function buildExternalProductLaunchUrl(input: ExternalProductLaunchInput): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const payload: LaunchTokenPayload = {
    uid:             input.uid,
    email:           input.email,
    role:            input.role,
    partnerId:       input.partnerId,
    organisationId:  input.organisationId,
    productKey:      input.productKey,
    domain:          input.targetDomain,
    permissions:     input.permissions,
    iat:             now,
    exp:             now + TOKEN_TTL_SECONDS,
    nonce:           generateNonce(),
  }

  const token = await tokenProvider.createLaunchToken(payload)
  return `https://${input.targetDomain}/launch?t=${token}`
}

export async function launchExternalProduct(input: ExternalProductLaunchInput): Promise<void> {
  const entry = getProductEntry(input.productKey)
  if (!entry?.isExternal) {
    throw new Error(`Product ${input.productKey} is not an external product.`)
  }

  const url = await buildExternalProductLaunchUrl(input)
  window.open(url, '_blank', 'noopener,noreferrer')
}
