import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { firebaseUser, isLoading, isProfileComplete, signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState('')

  // Auto-redirect once auth state resolves
  useEffect(() => {
    if (isLoading) return
    if (!firebaseUser) return // stay on login
    // Profile complete → dashboard, otherwise ProtectedRoute handles /complete-profile
    navigate('/dashboard', { replace: true })
  }, [isLoading, firebaseUser, isProfileComplete, navigate])

  const handleGoogleSignIn = async () => {
    setError('')
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
      // onAuthStateChanged fires → useEffect above navigates
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError('')
      } else {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-white">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">F</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-text-primary text-sm">FAI Engineer</span>
            <span className="text-[10px] text-text-secondary font-medium">by EV.ENGINEER</span>
          </div>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to website</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo mark */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Welcome to FAI Engineer</h1>
            <p className="text-text-secondary text-sm mt-2 leading-relaxed">
              Sign in with your Google account to access<br className="hidden sm:block" /> your FAI drawing and inspection toolkit.
            </p>
          </div>

          <div className="card p-6 sm:p-8">
            {error && (
              <div className="flex items-start gap-2.5 mb-5 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Google Sign-In — primary action */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white border-2 border-border rounded-xl text-sm font-semibold text-text-primary hover:border-primary/40 hover:bg-primary-light transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isSigningIn ? (
                <>
                  <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>

            {/* Trust statement */}
            <p className="text-center text-xs text-text-secondary mt-5 leading-relaxed">
              We use Google Sign-In for secure, password-free access.<br />
              Your drawing files are never uploaded to our servers.
            </p>

            <div className="border-t border-border mt-5 pt-5">
              <p className="text-center text-xs text-text-secondary">
                Don&apos;t have an account?{' '}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="text-primary font-semibold hover:underline disabled:opacity-60"
                >
                  Sign up with Google
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-text-secondary mt-5 px-4">
            Built for aerospace, manufacturing, and quality teams.
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
