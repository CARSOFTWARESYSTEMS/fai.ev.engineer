import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Phone,
  Building2,
  Hash,
  FileText,
  User,
  Shield,
} from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { updateUserProfile } from '../auth/EVEngineerAuthService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function suggestOrgCode(orgName: string): string {
  const trimmed = orgName.trim()
  if (!trimmed) return 'default'
  return (
    trimmed.split(/\s+/)[0]
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '') || 'default'
  )
}

function validateOrgCode(code: string): string | null {
  if (!code.trim()) return 'Organization Code is required.'
  if (!/^[a-z0-9\-_]+$/.test(code.trim()))
    return 'Only lowercase letters, numbers, hyphens, and underscores are allowed.'
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, firebaseUser, isLoading, isProfileComplete, refreshProfile } = useAuth()

  // Guard
  useEffect(() => {
    if (isLoading) return
    if (!firebaseUser) { navigate('/login', { replace: true }); return }
    if (!isProfileComplete) { navigate('/complete-profile', { replace: true }); return }
  }, [isLoading, firebaseUser, isProfileComplete, navigate])

  // Editable fields — initialised from Firestore profile
  const [mobile, setMobile] = useState(user?.mobileNumber ?? '')
  const [orgName, setOrgName] = useState(user?.organizationName ?? '')
  const [orgCode, setOrgCode] = useState(user?.organizationCode ?? 'default')
  const [gst, setGst] = useState(user?.gstNumber ?? '')
  const [adminEnabled, setAdminEnabled] = useState(user?.role === 'admin')

  // Track whether user manually edited orgCode
  const [orgCodeCustomized, setOrgCodeCustomized] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')

  // Sync fields when user profile loads (e.g. on first render)
  useEffect(() => {
    if (!user) return
    setMobile(user.mobileNumber ?? '')
    setOrgName(user.organizationName ?? '')
    setOrgCode(user.organizationCode ?? 'default')
    setGst(user.gstNumber ?? '')
    setAdminEnabled(user.role === 'admin')
  }, [user])

  // Auto-update orgCode when orgName changes (unless manually customized)
  const handleOrgNameChange = (value: string) => {
    setOrgName(value)
    if (!orgCodeCustomized) {
      setOrgCode(suggestOrgCode(value))
    }
  }

  const handleOrgCodeChange = (value: string) => {
    // Allow only valid chars while typing
    const sanitized = value.toLowerCase().replace(/[^a-z0-9\-_]/g, '')
    setOrgCode(sanitized)
    setOrgCodeCustomized(true)
  }

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

    const orgCodeErr = validateOrgCode(orgCode)
    if (orgCodeErr) {
      setError(orgCodeErr)
      return
    }

    setIsSaving(true)
    try {
      await updateUserProfile(firebaseUser!.uid, {
        mobileNumber: mobile.trim(),
        organizationName: orgName.trim(),
        organizationCode: orgCode.trim() || 'default',
        gstNumber: gst.trim(),
        ...(user?.role === 'super_admin' ? {} : { role: adminEnabled ? 'admin' : 'user' }),
      })
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
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-sm font-bold text-text-primary">FAI Engineer</span>
                <span className="text-[10px] text-text-secondary">by EV.ENGINEER</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 pb-28">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-text-primary">Edit Profile</h1>
          <p className="text-sm text-text-secondary mt-1">
            Update your contact details and organization information.
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
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-xs text-text-secondary font-mono bg-gray-50 px-2 py-0.5 rounded">
                  {user.subscriptionPlan} plan
                </span>
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    <Shield className="w-3 h-3" />
                    {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="card p-6">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-5">
            Contact &amp; Organization
          </h2>

          <div className="flex flex-col gap-5">
            {/* Mobile Number */}
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

            {/* Organization Name */}
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-text-primary mb-1.5">
                Organization Name
                <span className="text-text-secondary font-normal ml-1.5 text-xs">optional</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  placeholder="e.g. Fortius Machining Solutions"
                  className="input-field pl-10 placeholder-slate-300"
                  autoComplete="organization"
                />
              </div>
            </div>

            {/* Organization Code */}
            <div>
              <label htmlFor="orgCode" className="block text-sm font-medium text-text-primary mb-1.5">
                Organization Code
                <span className="text-error ml-1">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="orgCode"
                  type="text"
                  value={orgCode}
                  onChange={(e) => handleOrgCodeChange(e.target.value)}
                  placeholder="e.g. fortius"
                  className="input-field pl-10 font-mono placeholder-slate-300"
                  autoComplete="off"
                  required
                />
              </div>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                Auto-generated from organization name. You can override it.
                Only <span className="font-mono">a–z</span>, <span className="font-mono">0–9</span>,{' '}
                <span className="font-mono">-</span>, <span className="font-mono">_</span> are allowed.
              </p>
              {orgCode && orgCode !== 'default' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-text-secondary">Preview:</span>
                  <span className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-mono font-semibold">
                    {orgCode}
                  </span>
                </div>
              )}
            </div>

            {/* GST Number */}
            <div>
              <label htmlFor="gst" className="block text-sm font-medium text-text-primary mb-1.5">
                GST Number
                <span className="text-text-secondary font-normal ml-1.5 text-xs">optional</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="gst"
                  type="text"
                  value={gst}
                  onChange={(e) => setGst(e.target.value.toUpperCase())}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="input-field pl-10 font-mono placeholder-slate-300"
                  autoComplete="off"
                  maxLength={15}
                />
              </div>
            </div>

            {/* Temporary admin toggle */}
            <div className="pt-5 border-t border-border">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-purple-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Admin Mode</p>
                  {user.role === 'super_admin' ? (
                    <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5">
                      <p className="text-sm font-semibold text-purple-700">Super Admin access enabled</p>
                    </div>
                  ) : (
                    <label className="mt-2 flex items-center justify-between gap-4 cursor-pointer">
                      <div>
                        <span className="block text-sm font-medium text-text-primary">Enable Admin Access</span>
                        <span className="block text-xs text-text-secondary mt-1 leading-relaxed">
                          Temporary internal testing option. Later this will be controlled by organization roles.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={adminEnabled}
                        onChange={(e) => setAdminEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <span className="relative w-11 h-6 rounded-full bg-gray-200 peer-checked:bg-primary transition-colors shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  )}
                </div>
              </div>
            </div>

          </div>
        </form>
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
