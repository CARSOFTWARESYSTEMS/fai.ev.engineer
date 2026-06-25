/**
 * Autonomous Product Module
 *
 * Product:   autonomous
 * Type:      External (launched via secure token handoff to autonomous.ev.engineer)
 * Status:    Active (launcher only — features live in the external app)
 *
 * This module does NOT own pages or features in this codebase.
 * It only provides the launch handoff via:
 *   src/modules/platform/services/externalProductLauncher.ts
 *
 * The external app at autonomous.ev.engineer must:
 *   - Receive /launch?t=token
 *   - Verify the token signature (via shared Cloud Function public key)
 *   - Check token expiry and product scope
 *   - Create its own local session
 *   - Reject invalid or expired tokens
 *
 * Shared platform imports allowed:
 *   src/modules/platform/services/externalProductLauncher.ts
 *   src/auth/ — useAuth (to read uid, email, role, partnerId)
 *   src/modules/shared/ — utilities
 *
 * No circular dependencies.
 */

export const AUTONOMOUS_PRODUCT_KEY = 'autonomous' as const
