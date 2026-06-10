import { X, ClipboardList, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { SaveStatus } from '../hooks/useForm3Results'
import type { Form3ResultFields, Form3Row } from '../types/form3Types'
import { Form3Table } from './Form3Table'

interface Form3PanelProps {
  projectName: string
  drawingNumber: string
  drawingRevision: string
  rows: Form3Row[]
  isLoaded: boolean
  saveStatus: SaveStatus
  selectedBalloonId: string | null
  onSelectBalloon: (balloonId: string) => void
  onUpdate: (
    featureId: string,
    balloonId: string,
    charNo: number,
    fields: Form3ResultFields,
  ) => void
  onClose: () => void
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full',
        status === 'saving' ? 'text-gray-500 bg-gray-100' :
        status === 'saved'  ? 'text-green-700 bg-green-50' :
        'text-red-600 bg-red-50',
      ].join(' ')}
    >
      {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'saved'  && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error'  && <AlertCircle className="w-3 h-3" />}
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save failed — retry'}
    </span>
  )
}

function StatusSummary({ rows }: { rows: Form3Row[] }) {
  const pass    = rows.filter(r => r.status === 'pass').length
  const fail    = rows.filter(r => r.status === 'fail').length
  const pending = rows.filter(r => r.status === 'pending').length
  const completion = rows.length === 0 ? 0 : Math.round(((pass + fail) / rows.length) * 100)
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
      <span className="text-text-secondary"><strong>{rows.length}</strong> total characteristics</span>
      <span className="flex items-center gap-1 text-green-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        {pass} pass
      </span>
      <span className="flex items-center gap-1 text-red-600 font-medium">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        {fail} fail
      </span>
      <span className="flex items-center gap-1 text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
        {pending} pending
      </span>
      <span className="ml-auto font-semibold text-gray-700">{completion}% complete</span>
    </div>
  )
}

export function Form3Panel({
  projectName,
  drawingNumber,
  drawingRevision,
  rows,
  isLoaded,
  saveStatus,
  selectedBalloonId,
  onSelectBalloon,
  onUpdate,
  onClose,
}: Form3PanelProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 gap-4">

          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h1 className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  AS9102 Form 3
                </h1>
                <span className="text-xs text-text-secondary hidden sm:inline">
                  First Article Inspection Report
                </span>
              </div>
              <p className="text-[11px] text-text-secondary truncate max-w-[280px]">
                {projectName}
                {drawingNumber && <span className="ml-1 font-mono text-gray-400">· {drawingNumber} Rev {drawingRevision}</span>}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            <SaveIndicator status={saveStatus} />
            <button
              onClick={onClose}
              title="Close Form 3"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {isLoaded && rows.length > 0 && (
          <div className="px-5 py-1.5 border-t border-gray-100 bg-gray-50">
            <StatusSummary rows={rows} />
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading inspection data…</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 text-text-secondary">
          <ClipboardList className="w-14 h-14 mb-4 text-gray-200" />
          <p className="text-base font-semibold text-gray-700 mb-1">No features found</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Add balloons and features to the drawing first using the PDF viewer.
            Each feature will appear here as a Form 3 characteristic row.
          </p>
        </div>
      ) : (
        <Form3Table
          rows={rows}
          selectedBalloonId={selectedBalloonId}
          onSelectBalloon={onSelectBalloon}
          onUpdate={onUpdate}
        />
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-2 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">
          AS9102D · Form 3 · Characteristic Accountability, Verification, and Compatibility Evaluation
        </p>
        <p className="text-[10px] text-gray-400 hidden sm:block">
          FAI Engineer · EV.ENGINEER
        </p>
      </div>
    </div>
  )
}
