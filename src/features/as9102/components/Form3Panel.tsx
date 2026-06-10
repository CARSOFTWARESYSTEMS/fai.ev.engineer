import { useState, useEffect } from 'react'
import { X, ClipboardList, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'
import type { SaveStatus } from '../hooks/useForm3Results'
import type { Form3ResultFields, Form3Row } from '../types/form3Types'
import { Form3Table } from './Form3Table'

const KEYBOARD_HINT_KEY = 'fai-form3-keyboard-hint-shown'

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
    <span className={[
      'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full',
      status === 'saving' ? 'text-gray-500 bg-gray-100' :
      status === 'saved'  ? 'text-green-700 bg-green-50' :
      'text-red-600 bg-red-50',
    ].join(' ')}>
      {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'saved'  && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error'  && <AlertCircle className="w-3 h-3" />}
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save failed — retry'}
    </span>
  )
}

function StatusSummary({ rows, pageFilter }: { rows: Form3Row[]; pageFilter: number | null }) {
  const filtered = pageFilter !== null ? rows.filter(r => r.pageNumber === pageFilter) : rows
  const pass    = filtered.filter(r => r.status === 'pass').length
  const fail    = filtered.filter(r => r.status === 'fail').length
  const pending = filtered.filter(r => r.status === 'pending').length
  const completion = filtered.length === 0 ? 0 : Math.round(((pass + fail) / filtered.length) * 100)
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
      {pageFilter !== null && (
        <span className="text-text-secondary font-medium">Page {pageFilter} ·</span>
      )}
      <span className="text-text-secondary"><strong>{filtered.length}</strong> characteristics</span>
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
  const [pageFilter, setPageFilter] = useState<number | null>(null)
  const [showKeyboardHint, setShowKeyboardHint] = useState(false)

  // Show keyboard shortcut hint on first open
  useEffect(() => {
    if (!localStorage.getItem(KEYBOARD_HINT_KEY)) {
      setShowKeyboardHint(true)
    }
  }, [])

  const dismissHint = () => {
    localStorage.setItem(KEYBOARD_HINT_KEY, '1')
    setShowKeyboardHint(false)
  }

  // Derive unique pages for the filter bar
  const pages = Array.from(new Set(rows.map(r => r.pageNumber).filter(p => p > 0))).sort((a, b) => a - b)

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
                <h1 className="text-sm font-bold text-gray-900 whitespace-nowrap">AS9102 Form 3</h1>
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
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close Form 3</span>
            </button>
          </div>
        </div>

        {/* Stats + page filter bar */}
        {isLoaded && rows.length > 0 && (
          <div className="px-5 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center gap-4 flex-wrap">
            <StatusSummary rows={rows} pageFilter={pageFilter} />
            {pages.length > 1 && (
              <div className="flex items-center gap-1 ml-auto flex-wrap shrink-0">
                <span className="text-[10px] text-gray-400 mr-1">Page:</span>
                <button
                  onClick={() => setPageFilter(null)}
                  className={[
                    'px-2 py-0.5 rounded text-[10px] font-medium border transition-all',
                    pageFilter === null
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary',
                  ].join(' ')}
                >
                  All
                </button>
                {pages.map(p => (
                  <button
                    key={p}
                    onClick={() => setPageFilter(p === pageFilter ? null : p)}
                    className={[
                      'px-2 py-0.5 rounded text-[10px] font-medium border transition-all',
                      pageFilter === p
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary',
                    ].join(' ')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── First-time keyboard hint ─────────────────────────────────────── */}
      {showKeyboardHint && (
        <div className="shrink-0 bg-blue-50 border-b border-blue-100 px-5 py-2 flex items-center gap-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-xs text-blue-700 flex-1">
            <strong>Keyboard shortcuts:</strong>
            {' '}<kbd className="font-mono bg-blue-100 text-blue-700 rounded px-1">↑↓</kbd> navigate rows,{' '}
            <kbd className="font-mono bg-blue-100 text-blue-700 rounded px-1">P</kbd> Pass,{' '}
            <kbd className="font-mono bg-blue-100 text-blue-700 rounded px-1">F</kbd> Fail,{' '}
            <kbd className="font-mono bg-blue-100 text-blue-700 rounded px-1">N</kbd> Pending
            <span className="ml-1 text-blue-500">(P requires a Result value first)</span>
          </p>
          <button
            type="button"
            onClick={dismissHint}
            className="text-blue-400 hover:text-blue-600 transition-colors text-xs shrink-0"
          >
            Got it
          </button>
        </div>
      )}

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
          pageFilter={pageFilter}
          onSelectBalloon={onSelectBalloon}
          onUpdate={onUpdate}
        />
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-2 flex items-center justify-between gap-4">
        <p className="text-[10px] text-gray-400 hidden md:block">
          AS9102D · Form 3 · Characteristic Accountability, Verification, and Compatibility Evaluation
        </p>
        <p className="text-[10px] text-gray-400 shrink-0 ml-auto">
          <span className="hidden sm:inline">Shortcuts: </span>
          <kbd className="font-mono bg-gray-200 text-gray-600 rounded px-1">P</kbd> Pass ·{' '}
          <kbd className="font-mono bg-gray-200 text-gray-600 rounded px-1">F</kbd> Fail ·{' '}
          <kbd className="font-mono bg-gray-200 text-gray-600 rounded px-1">N</kbd> Pending ·{' '}
          <kbd className="font-mono bg-gray-200 text-gray-600 rounded px-1">↑↓</kbd> Navigate
        </p>
      </div>
    </div>
  )
}
