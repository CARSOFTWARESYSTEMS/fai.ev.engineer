import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Phone } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { completeProfile } from '../auth/EVEngineerAuthService'

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

export function CompleteProfilePage() {
  const navigate = useNavigate()
  const { firebaseUser, isLoading, isProfileComplete, refreshProfile, signOut } = useAuth()

  const [mobile, setMobile] = useState('')
  const [orgName, setOrgName] = useState('')
  const [gst, setGst] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')

  // Guard redirects
  useEffect(() => {
    if (isLoading) return
    if (!firebaseUser) { navigate('/login', { replace: true }); return }
    if (isProfileComplete) { navigate('/dashboard', { replace: true }); return }
  }, [isLoading, firebaseUser, isProfileComplete, navigate])

  if (isLoading) return <Spinner />
  if (!firebaseUser) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedMobile = mobile.trim()
    if (!trimmedMobile) {
      setError('Mobile number is required.')
      setErrorCode('')
      return
    }
    if (!/^\+?[\d\s\-().]{7,20}$/.test(trimmedMobile)) {
      setError('Enter a valid phone number (e.g. +91 98765 43210).')
      setErrorCode('')
      return
    }

    setError('')
    setErrorCode('')
    setIsSaving(true)
    try {
      await completeProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? '',
        email: firebaseUser.email ?? '',
        photoURL: firebaseUser.photoURL ?? '',
        mobileNumber: trimmedMobile,
        organizationName: orgName,
        gstNumber: gst,
      })
      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      const code = e?.code ?? 'unknown'
      const msg = e?.message ?? 'Unknown error'
      setErrorCode(code)
      if (code.includes('permission-denied') || code.includes('insufficient-permissions')) {
        setError('Permission denied — Firestore rules are blocking the write. Check Firebase Console → Firestore → Rules.')
      } else if (code.includes('unavailable') || code.includes('network')) {
        setError('Network error — check your internet connection and try again.')
      } else if (code.includes('not-found')) {
        setError('Firestore database not found. Ensure Firestore is enabled in Firebase Console.')
      } else {
        setError(`Failed to save profile: ${msg}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">F</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-text-primary text-sm">FAI Engineer</span>
            <span className="text-[10px] text-text-secondary font-medium">by{' '}<a href="https://ev.engineer" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">EV.ENGINEER</a></span>
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-success" />
            Google Sign-In
          </span>
          <span className="text-border">›</span>
          <span className="font-semibold text-primary">Complete Profile</span>
          <span className="text-border">›</span>
          <span className="text-text-secondary">Dashboard</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Google profile summary */}
          <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-5 py-4 mb-6 shadow-sm">
            {firebaseUser.photoURL ? (
              <img
                src={firebaseUser.photoURL}
                alt={firebaseUser.displayName ?? 'User'}
                className="w-11 h-11 rounded-full border-2 border-primary/20 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary-light border-2 border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-lg">
                  {(firebaseUser.displayName ?? 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-text-primary text-sm truncate">
                {firebaseUser.displayName}
              </p>
              <p className="text-xs text-text-secondary truncate">{firebaseUser.email}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-success shrink-0 ml-auto" />
          </div>

          <div className="card p-6 sm:p-8">
            <div className="mb-7">
              <h1 className="text-xl font-bold text-text-primary">Complete your profile</h1>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                One final step before you access your dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg">
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Mobile Number — required */}
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
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  We may use this mobile number for support communication, onboarding assistance, account notifications, and sharing project-related information.
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-text-secondary">Optional details</span>
                </div>
              </div>

              {/* Organization Name — optional */}
              <div>
                <label htmlFor="org" className="block text-sm font-medium text-text-primary mb-1.5">
                  Organization Name
                  <span className="text-text-secondary font-normal ml-1.5 text-xs">optional</span>
                </label>
                <input
                  id="org"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Fortius Machining Solutions"
                  className="input-field placeholder-slate-300"
                  autoComplete="organization"
                />
              </div>

              {/* GST Number — optional */}
              <div>
                <label htmlFor="gst" className="block text-sm font-medium text-text-primary mb-1.5">
                  GST Number
                  <span className="text-text-secondary font-normal ml-1.5 text-xs">optional</span>
                </label>
                <input
                  id="gst"
                  type="text"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="input-field font-mono placeholder-slate-300"
                  autoComplete="off"
                  maxLength={15}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={async () => { await signOut(); navigate('/', { replace: true }) }}
                className="btn-ghost w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-text-secondary mt-5 px-4 leading-relaxed">
            Your information is stored securely and used only to provide FAI Engineer services.
          </p>
        </div>
      </div>
    </div>
  )
}
