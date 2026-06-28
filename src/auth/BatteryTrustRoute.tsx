import { Navigate, useLocation } from 'react-router-dom'
import { ShieldX, Lock, Building2 } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useUserOrg } from '../hooks/useUserOrg'
import { useDeveloperAccess } from '../services/useDeveloperAccess'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading workspace…</p>
      </div>
    </div>
  )
}

function AccessDeniedPage({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-950 border-2 border-red-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-sm text-slate-400 mb-2">{reason}</p>
        <p className="text-xs text-slate-500 mb-6">
          Contact your Partner Administrator to request access to the Battery Trust Platform.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white
            text-sm font-semibold hover:bg-blue-500 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

function NoOrganisationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-3">No Organisation Assigned</h1>
        <p className="text-sm text-slate-400 mb-6">
          Your account must be assigned to an organisation with Battery Trust Platform access before you can enter this workspace.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white
            text-sm font-semibold hover:bg-blue-500 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

function ProductNotEnabledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-950 border-2 border-amber-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-3">Product Not Enabled</h1>
        <p className="text-sm text-slate-400 mb-6">
          The Battery Trust Platform is not enabled for your organisation. Contact your Partner Admin to activate this product.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white
            text-sm font-semibold hover:bg-blue-500 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

interface Props {
  children: React.ReactNode
}

/**
 * Fine-grained route guard for the Battery Trust Platform.
 *
 * Checks (in order):
 *  1. Auth + profile (delegates to ProtectedRoute above in router)
 *  2. Developer bypass — always allowed
 *  3. Org membership required
 *  4. org.enabledProducts includes 'battery_trust'
 *  5. org.productAccess.battery_trust.enabled === true (if config present)
 *  6. user email in allowedEmails (if list present and non-empty)
 *  7. user orgRole in allowedRoles (if list present and non-empty)
 */
export function BatteryTrustRoute({ children }: Props) {
  const { firebaseUser, user, isLoading: authLoading, isProfileComplete } = useAuth()
  const { isDeveloper, isLoading: devLoading }                             = useDeveloperAccess()
  const { org, member, isLoading: orgLoading }                             = useUserOrg()
  const location = useLocation()

  const isLoading = authLoading || devLoading || orgLoading

  if (isLoading) return <Spinner />

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isProfileComplete) {
    return <Navigate to="/complete-profile" replace />
  }

  // Developers bypass all product access checks
  if (isDeveloper) return <>{children}</>

  if (!org) return <NoOrganisationPage />

  // Check org-level enabledProducts
  if (!org.enabledProducts.includes('battery_trust')) {
    return <ProductNotEnabledPage />
  }

  // Check fine-grained productAccess config if present
  const btAccess = org.productAccess?.['battery_trust']
  if (btAccess) {
    if (!btAccess.enabled) {
      return <ProductNotEnabledPage />
    }

    const userEmail = (firebaseUser.email ?? user?.email ?? '').toLowerCase()
    const userRole  = member?.role ?? null

    // Email allowlist check
    if (btAccess.allowedEmails && btAccess.allowedEmails.length > 0) {
      const allowed = btAccess.allowedEmails.map(e => e.toLowerCase())
      if (!allowed.includes(userEmail)) {
        return (
          <AccessDeniedPage reason="Your email address is not on the Battery Trust Platform access list for this organisation." />
        )
      }
    }

    // Role allowlist check
    if (btAccess.allowedRoles && btAccess.allowedRoles.length > 0) {
      if (!userRole || !btAccess.allowedRoles.includes(userRole)) {
        return (
          <AccessDeniedPage reason="Your organisation role does not have permission to access the Battery Trust Platform." />
        )
      }
    }
  }

  return <>{children}</>
}
