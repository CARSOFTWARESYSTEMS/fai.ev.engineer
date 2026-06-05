import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

interface Props {
  projectId: string
  message: string
  onRetry?: () => void
}

export function PdfErrorState({ projectId, message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-4 text-center">
      <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-error" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Unable to Load PDF</h2>
        <p className="text-sm text-text-secondary max-w-sm leading-relaxed">{message}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button onClick={onRetry} className="btn-primary">
            Retry
          </button>
        )}
        <Link to={`/projects/${projectId}`} className="btn-secondary">
          Back to Project
        </Link>
      </div>
    </div>
  )
}
