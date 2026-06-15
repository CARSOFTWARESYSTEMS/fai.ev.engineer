import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useDeveloperAccess } from '../services/useDeveloperAccess'

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
 * Phase 1.5 guard — allows bootstrap developers through for UI validation.
 * Phase 2: replace with real partner/org membership checks from Firestore.
 *
 * Access order:
 *  1. Not authenticated → /login
 *  2. Authenticated, no profile → /complete-profile
 *  3. Authenticated + complete, not bootstrap → /dashboard
 *  4. Bootstrap developer → render children
 */
export function BootstrapRoute({ children }: Props) {
  const { firebaseUser, isLoading: authLoading, isProfileComplete } = useAuth()
  const { isBootstrap, isLoading: devLoading } = useDeveloperAccess()

  if (authLoading || devLoading) return <Spinner />

  if (!firebaseUser) return <Navigate to="/login" replace />
  if (!isProfileComplete) return <Navigate to="/complete-profile" replace />
  if (!isBootstrap) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
