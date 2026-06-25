import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBranding } from '../hooks/useBranding'
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Phone,
  Building2,
  User,
  Shield,
  Info,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { updateUserProfile } from '../auth/EVEngineerAuthService'
import { useUserOrg } from '../hooks/useUserOrg'
import type { OrganisationRole } from '../auth/AuthTypes'

const ORG_ROLE_LABELS: Record<OrganisationRole, string> = {
  owner:    'Owner',
  manager:  'Manager',
  engineer: 'Engineer',
  inspector: 'Inspector',
  auditor:  'Auditor',
  approver: 'Approver',
  viewer:   'Viewer',
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, firebaseUser, isLoading, isProfileComplete, refreshProfile } = useAuth()
  const { branding } = useBranding()
  const { org, member, isLoading: orgLoading } = useUserOrg()

  useEffect(() => {
    if (isLoading) return
    if (!firebaseUser) { navigate('/login', { replace: true }); return }
    if (!isProfileComplete) { navigate('/complete-profile', { replace: true }); return }
  }, [isLoading, firebaseUser, isProfileComplete, navigate])

  const [mobile, setMobile] = useState(user?.mobileNumber ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')

  useEffect(() => {
    if (!user) return
    setMobile(user.mobileNumber ?? '')
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setError('')
    setErrorCode('')

    if (!mobile.trim()) {
      setError('Mobile number is required.')
      return
    }
    if (!/^\+?[\d\s\-().]{7,20}$/.test(mobile.trim())) {
      setError('Enter a valid phone number (e.g. +91 98765 43210).')
      return
    }

    setIsSaving(true)
    try {
      await updateUserProfile(firebaseUser!.uid, { mobileNumber: mobile.trim() })
      await refreshProfile()
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      const code = e?.code ?? 'unknown'
      const msg = e?.message ?? 'Unknown error'
      setErrorCode(code)
      if (code.includes('permission-denied')) {
        setError('Permission denied — check your Firestore security rules.')
      } else if (code.includes('unavailable') || code.includes('network')) {
        setError('Network error — check your connection and try again.')
      } else {
        setError(`Failed to save: ${msg}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !user || !firebaseUser) return null

  const displayName = user.displayName || firebaseUser.displayName || 'User'
  const photoURL = user.photoURL || firebaseUser.photoURL
  const platformRole = user.role === 'super_admin' ? 'Super Admin'
    : user.role === 'admin' ? 'Admin'
    : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="text-border">/</span>
              <span className="text-sm font-semibold text-text-primary">Edit Profile</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <div className="hidden sm:flex flex-col gap-1 leading-none">
                <span className="text-sm font-bold text-text-primary">{branding.businessName}</span>
                <span className="text-[10px] text-text-secondary">
                  powered by{' '}
                  <a href={branding.poweredByUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                    {branding.poweredByText.replace(/^powered by\s+/i, '') || 'EV.ENGINEER'}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 pb-28">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-text-primary">Edit Profile</h1>
          <p className="text-sm text-text-secondary mt-1">
            Update your contact details.
          </p>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-2.5 mb-6 px-4 py-3 bg-success/10 border border-success/20 text-success text-sm rounded-xl">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Profile updated successfully.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {errorCode && (
              <p className="mt-1.5 font-mono text-xs text-error/70 pl-6">
                Error code: {errorCode}
              </p>
            )}
          </div>
        )}

        {/* Google identity — read only */}
        <div className="card p-6 mb-5">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Google Account (read-only)
          </h2>
          <div className="flex items-center gap-4">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-14 h-14 rounded-full border-2 border-border shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-light border-2 border-border flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-text-primary">{displayName}</p>
              <p className="text-sm text-text-secondary mt-0.5">{user.email}</p>
              {platformRole && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  <Shield className="w-3 h-3" />
                  {platformRole}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Number — editable */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="card p-6 mb-5">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-5">
            Contact
          </h2>
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-text-primary mb-1.5">
              Mobile Number
              <span className="text-error ml-1">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                className="input-field pl-10 placeholder-slate-300"
                autoComplete="tel"
                required
              />
            </div>
          </div>
        </form>

        {/* Organisation — read-only from membership */}
        <div className="card p-6">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Organisation (read-only)
          </h2>

          {orgLoading ? (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              Loading organisation…
            </div>
          ) : org && member ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{org.name}</p>
                  <p className="text-xs font-mono text-text-secondary mt-0.5">{org.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-gray-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Role</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {ORG_ROLE_LABELS[member.role] ?? member.role}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-gray-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-semibold text-text-primary capitalize">
                    {member.membershipStatus}
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-secondary flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Organisation details and role are managed by your administrator.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-gray-50 px-4 py-4">
              <Info className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">No organisation assigned</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Please contact your administrator to be added to an organisation.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky action bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border shadow-lg">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            type="submit"
            form="edit-profile-form"
            disabled={isSaving}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
          <Link to="/dashboard" className="btn-ghost text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  )
}
