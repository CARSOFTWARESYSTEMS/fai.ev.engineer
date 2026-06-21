import { Navigate, useLocation } from 'react-router-dom'
import { Mail, Phone, MessageCircle, ShieldX, LogOut } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useBranding } from '../hooks/useBranding'
import { isLifecycleAccessBlocked } from '../services/lifecycleService'
import type { LifecycleStatus } from './AuthTypes'

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

// ─── Full-page access restriction ─────────────────────────────────────────────

const ACCESS_BLOCKED_CONTENT: Record<
  LifecycleStatus,
  { title: string; message: string; actionVerb: string }
> = {
  active:   { title: '', message: '', actionVerb: '' },
  inactive: { title: '', message: '', actionVerb: '' },
  blocked: {
    title:      'Your account is blocked.',
    message:    'Please contact the Admin team to unblock your account.',
    actionVerb: 'blocked',
  },
  deleted: {
    title:      'Your account is marked as deleted.',
    message:    'Please contact the Admin team if this is a mistake.',
    actionVerb: 'deleted',
  },
  permanently_deleted: {
    title:      'This account is permanently deleted in FAI Engineer records.',
    message:    'Please contact the Admin team.',
    actionVerb: 'permanently deleted',
  },
}

interface BlockedPageProps {
  status:   LifecycleStatus
  email:    string
  onSignOut: () => Promise<void>
}

function AccessBlockedPage({ status, email, onSignOut }: BlockedPageProps) {
  const { branding } = useBranding()
  const content = ACCESS_BLOCKED_CONTENT[status] ?? ACCESS_BLOCKED_CONTENT.blocked

  const waText = encodeURIComponent(
    [
      `Hello Admin Team, my FAI Engineer account is ${content.actionVerb}.`,
      `Signed-in email: ${email}`,
      `Please review and reactivate my account.`,
    ].join('\n')
  )

  async function handleSignOut() {
    try { await onSignOut() } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white border border-border rounded-2xl shadow-xl p-8 text-center">

        {/* Icon */}
        <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-text-primary mb-3">{content.title}</h1>

        {/* Signed-in email — prominent so user can screenshot and share */}
        <div className="bg-slate-50 border border-border rounded-xl px-4 py-3 mb-4 text-left">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Signed-in email
          </p>
          <p className="text-sm font-medium text-text-primary break-all">{email}</p>
        </div>

        {/* Message */}
        <p className="text-sm text-text-secondary mb-6">{content.message}</p>

        {/* Support contacts */}
        <div className="border-t border-border pt-5 space-y-2">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-3">
            Contact Support
          </p>

          {branding.supportEmail && (
            <a
              href={`mailto:${branding.supportEmail}?subject=Account%20${content.actionVerb}&body=Hello%20Admin%2C%20my%20account%20(${encodeURIComponent(email)})%20is%20${content.actionVerb}.%20Please%20review.`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-500 shrink-0" />
              {branding.supportEmail}
            </a>
          )}

          {branding.supportPhone && (
            <a
              href={`tel:${branding.supportPhone}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              {branding.supportPhone}
            </a>
          )}

          {branding.whatsappNumber && (
            <a
              href={`https://wa.me/${branding.whatsappNumber}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              WhatsApp Support
            </a>
          )}
        </div>

        {/* Sign out — let user try another Google account */}
        <div className="mt-5 pt-5 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out and use another account
          </button>
        </div>

        <p className="text-xs text-text-secondary/40 mt-5">{branding.businessName}</p>
      </div>
    </div>
  )
}

interface Props {
  children: React.ReactNode
}

/**
 * Enforces four-state auth guard:
 *  1. Not authenticated                    → /login
 *  2. Authenticated, no profile            → /complete-profile
 *  3. Lifecycle blocked/deleted            → AccessBlockedPage (shows email + logout)
 *  4. Authenticated + complete + active    → render children
 */
export function ProtectedRoute({ children }: Props) {
  const { firebaseUser, user, isLoading, isProfileComplete, signOut } = useAuth()
  const location = useLocation()

  if (isLoading) return <Spinner />

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isProfileComplete) {
    return <Navigate to="/complete-profile" replace />
  }

  const lifecycleStatus = user?.lifecycleStatus
  if (lifecycleStatus && isLifecycleAccessBlocked(lifecycleStatus)) {
    return (
      <AccessBlockedPage
        status={lifecycleStatus as LifecycleStatus}
        email={firebaseUser.email ?? user?.email ?? ''}
        onSignOut={signOut}
      />
    )
  }

  return <>{children}</>
}
