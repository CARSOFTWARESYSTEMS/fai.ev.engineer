import { Undo2, X } from 'lucide-react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div className="flex items-center gap-3 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-white/10 min-w-[260px] max-w-[360px]">
      <span className="flex-1 text-gray-200">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="flex items-center gap-1.5 text-blue-300 font-semibold hover:text-white transition-colors shrink-0"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        title="Dismiss"
        className="text-gray-600 hover:text-gray-300 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
