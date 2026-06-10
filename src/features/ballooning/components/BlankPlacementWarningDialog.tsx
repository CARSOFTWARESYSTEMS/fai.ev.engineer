import { AlertTriangle } from 'lucide-react'

interface BlankPlacementWarningDialogProps {
  onCancel: () => void
  onConfirm: () => void
}

export function BlankPlacementWarningDialog({
  onCancel,
  onConfirm,
}: BlankPlacementWarningDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blank-placement-title"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 id="blank-placement-title" className="font-bold text-gray-900">
              Place balloon here?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              This location appears to be outside the drawing content.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Place Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
