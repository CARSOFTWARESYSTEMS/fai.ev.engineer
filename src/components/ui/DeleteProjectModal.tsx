import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  projectName: string
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteProjectModal({ projectName, isDeleting, onCancel, onConfirm }: Props) {
  const [confirmName, setConfirmName] = useState('')
  const isMatch = confirmName.trim() === projectName.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={!isDeleting ? onCancel : undefined}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Delete Project?</h2>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
              This will permanently delete{' '}
              <span className="font-semibold text-text-primary">"{projectName}"</span>{' '}
              and its uploaded PDF files from Google Drive. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Confirmation input */}
        <div className="mb-6">
          <label htmlFor="confirm-name" className="block text-sm font-medium text-text-primary mb-1.5">
            Type the project name to confirm
          </label>
          <input
            id="confirm-name"
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={projectName}
            disabled={isDeleting}
            autoComplete="off"
            className="w-full px-4 py-3 border rounded-lg text-sm text-text-primary placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all disabled:opacity-60"
            style={{ borderColor: confirmName && !isMatch ? '#EF4444' : '#E2E8F0' }}
          />
          {confirmName && !isMatch && (
            <p className="mt-1.5 text-xs text-red-500">
              Project name does not match.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="btn-ghost text-sm px-4 py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isMatch || isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete Project'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
