import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

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

interface Props {
  children: React.ReactNode
}

/**
 * Enforces three-state auth guard:
 *  1. Not authenticated            → /login
 *  2. Authenticated, no profile    → /complete-profile
 *  3. Authenticated + complete     → render children
 */
export function ProtectedRoute({ children }: Props) {
  const { firebaseUser, isLoading, isProfileComplete } = useAuth()
  const location = useLocation()

  if (isLoading) return <Spinner />

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isProfileComplete) {
    return <Navigate to="/complete-profile" replace />
  }

  return <>{children}</>
}
