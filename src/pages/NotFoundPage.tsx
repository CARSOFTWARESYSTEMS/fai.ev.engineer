import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary">F</span>
        </div>

        <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">
          404 — Page Not Found
        </p>
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          This page doesn't exist
        </h1>
        <p className="text-text-secondary leading-relaxed mb-8">
          The page you're looking for may have been moved, deleted, or never existed. Check the URL or return to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
