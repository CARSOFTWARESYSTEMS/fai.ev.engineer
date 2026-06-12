import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrong = password.length >= 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (!passwordStrong) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setIsLoading(true)
    // Placeholder — Firebase auth wired up in next sprint
    await new Promise((r) => setTimeout(r, 800))
    setIsLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">F</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-text-primary text-sm">FAI Engineer</span>
            <span className="text-[10px] text-text-secondary font-medium">by{' '}<a href="https://ev.engineer" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">EV.ENGINEER</a></span>
          </div>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to website
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Trial badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-success/10 text-success text-sm font-semibold px-4 py-2 rounded-full">
              <CheckCircle className="w-4 h-4" />
              7-Day Free Trial — No credit card required
            </div>
          </div>

          <div className="card p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
              <p className="text-text-secondary text-sm mt-2">
                Start your free 7-day trial today
              </p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors mb-6"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-text-secondary">or create account with email</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="input-field"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="email">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input-field"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="input-field pr-12"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <p className={`text-xs mt-1.5 ${passwordStrong ? 'text-success' : 'text-error'}`}>
                    {passwordStrong ? '✓ Strong password' : 'At least 8 characters required'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-text-secondary mt-4 leading-relaxed">
              By creating an account you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>

            <p className="text-center text-sm text-text-secondary mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Trust points */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            {[
              { icon: '✓', text: 'No credit card required' },
              { icon: '✓', text: '7-day free trial' },
              { icon: '✓', text: 'Cancel anytime' },
            ].map((point) => (
              <div key={point.text} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="text-success font-bold">{point.icon}</span>
                {point.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
