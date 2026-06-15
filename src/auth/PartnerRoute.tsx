import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useAccessHelpers } from '../lib/accessHelpers'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

interface Props {
  children: React.ReactNode
}

/**
 * Phase 2 guard for partner routes.
 *
 * Access granted to:
 *   - Platform Developers (bootstrap or developerConfig)
 *   - Users with an active partnerAdmins/{uid} Firestore record
 *
 * Access order:
 *  1. Not authenticated → /login
 *  2. Authenticated, no profile → /complete-profile
 *  3. No partner access → /dashboard
 *  4. Has partner access → render children
 */
export function PartnerRoute({ children }: Props) {
  const { firebaseUser, isLoading: authLoading, isProfileComplete } = useAuth()
  const { canViewPartner, isLoading: accessLoading }                = useAccessHelpers()

  if (authLoading || accessLoading) return <Spinner />

  if (!firebaseUser)       return <Navigate to="/login"            replace />
  if (!isProfileComplete)  return <Navigate to="/complete-profile" replace />
  if (!canViewPartner)     return <Navigate to="/dashboard"        replace />

  return <>{children}</>
}
