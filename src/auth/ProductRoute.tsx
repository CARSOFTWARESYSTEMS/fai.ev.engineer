import { Navigate, useLocation } from 'react-router-dom'
import { Lock, Building2 } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useUserOrg } from '../hooks/useUserOrg'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { isAvailableWithoutOrg } from '../modules/platform/productCatalogue'
import type { ProductId } from './AuthTypes'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Loading…</p>
      </div>
    </div>
  )
}

function NoOrganisationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white border border-border rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-3">No Organisation Assigned</h1>
        <p className="text-sm text-text-secondary mb-6">
          Your account is not yet assigned to an organisation. Contact your Partner Administrator to be added to an organisation before accessing this product.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white
            text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

function ProductNotAvailablePage({ product }: { product: ProductId }) {
  const labels: Record<ProductId, string> = {
    fai_reports:     'FAI Reports',
    battery_pm:      'Battery Intelligence & Cybersecurity',
    battery_trust:   'Battery Trust Platform',
    motor_pm:        'Motor Predictive Maintenance',
    energy_mgmt:     'Energy Management',
    clean_room:      'Clean Room',
    ev_certificates: 'EV Certificates',
    autonomous:      'Autonomous',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white border border-border rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-3">Product not available</h1>
        <p className="text-sm text-text-secondary mb-2">
          <span className="font-semibold text-text-primary">{labels[product]}</span> is not enabled for your organisation.
        </p>
        <p className="text-sm text-text-secondary mb-6">
          Contact your Partner Admin to enable this product for your organisation.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white
            text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

interface Props {
  product:  ProductId
  children: React.ReactNode
}

/**
 * Route guard that enforces product entitlements.
 * Developers bypass the check — they always have access.
 * Users with no org membership see NoOrganisationPage.
 * Users whose org does NOT include the product see ProductNotAvailablePage.
 */
export function ProductRoute({ product, children }: Props) {
  const { firebaseUser, isLoading: authLoading, isProfileComplete } = useAuth()
  const { isDeveloper, isLoading: devLoading }                      = useDeveloperAccess()
  const { org, isLoading: orgLoading }                              = useUserOrg()
  const location = useLocation()

  const isLoading = authLoading || devLoading || orgLoading

  if (isLoading) return <Spinner />

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isProfileComplete) {
    return <Navigate to="/complete-profile" replace />
  }

  // Developers always have access
  if (isDeveloper) return <>{children}</>

  // Beta users with no org membership yet still get the products that are
  // available pre-assignment (e.g. FAI Reports) — mirrors the Dashboard's
  // resolveEffectiveProducts policy so the card and the route agree.
  if (!org) {
    if (isAvailableWithoutOrg(product)) return <>{children}</>
    return <NoOrganisationPage />
  }

  // Check product entitlement
  if (!org.enabledProducts.includes(product)) {
    return <ProductNotAvailablePage product={product} />
  }

  return <>{children}</>
}
