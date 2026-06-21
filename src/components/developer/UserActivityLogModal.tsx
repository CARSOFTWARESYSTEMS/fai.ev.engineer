import { useState, useEffect, useMemo } from 'react'
import { X, ScrollText, Filter, Download, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import {
  subscribeUserActivityLogs,
  formatLogTimestamp,
  EVENT_LABEL,
  EVENT_CATEGORY,
  type UserActivityLog,
  type ActivityEventCategory,
  type UserActivityEventType,
} from '../../services/userActivityLogService'

// ─── Category filter options ──────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: ActivityEventCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'All Events' },
  { value: 'auth',      label: 'Auth' },
  { value: 'profile',   label: 'Profile' },
  { value: 'role',      label: 'Role' },
  { value: 'lifecycle', label: 'Lifecycle' },
  { value: 'project',   label: 'Project' },
  { value: 'pdf',       label: 'PDF' },
  { value: 'export',    label: 'Export' },
  { value: 'partner',   label: 'Partner' },
]

// ─── Category badge styles ────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<ActivityEventCategory, string> = {
  auth:      'bg-blue-50 text-blue-700 border-blue-200',
  profile:   'bg-teal-50 text-teal-700 border-teal-200',
  role:      'bg-purple-50 text-purple-700 border-purple-200',
  lifecycle: 'bg-orange-50 text-orange-700 border-orange-200',
  project:   'bg-primary/10 text-primary border-primary/20',
  pdf:       'bg-rose-50 text-rose-700 border-rose-200',
  export:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  partner:   'bg-amber-50 text-amber-700 border-amber-200',
}

// ─── Meta row renderer ────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex gap-1.5 text-[11px]">
      <span className="text-text-secondary/60 shrink-0">{label}:</span>
      <span className="text-text-secondary break-all">{String(value)}</span>
    </div>
  )
}

// ─── Single log entry ─────────────────────────────────────────────────────────

function LogEntry({ log }: { log: UserActivityLog }) {
  const [open, setOpen] = useState(false)
  const cat = EVENT_CATEGORY[log.eventType] ?? 'profile'
  const label = EVENT_LABEL[log.eventType] ?? log.eventType
  const hasMeta = Object.keys(log.meta ?? {}).length > 0

  return (
    <div className="border-l-2 border-border/40 pl-3 ml-1 py-1">
      <div
        className={`flex items-start gap-2 ${hasMeta ? 'cursor-pointer select-none' : ''}`}
        onClick={() => hasMeta && setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${CATEGORY_BADGE[cat]}`}>
              {cat}
            </span>
            <span className="text-xs font-medium text-text-primary">{label}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary/60">
            <span>{formatLogTimestamp(log.createdAt)}</span>
            {log.actorEmail && log.actorEmail !== log.meta?.email && (
              <span>by {log.actorEmail}</span>
            )}
          </div>
        </div>
        {hasMeta && (
          <ChevronDown className={`w-3.5 h-3.5 text-text-secondary/40 shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </div>
      {open && hasMeta && (
        <div className="mt-1.5 pl-2 border-l border-border/30 space-y-0.5">
          {Object.entries(log.meta ?? {}).map(([k, v]) => (
            <MetaRow key={k} label={k} value={v} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function buildTxt(logs: UserActivityLog[], targetEmail: string): string {
  const lines: string[] = [
    `Activity Log — ${targetEmail}`,
    `Exported: ${new Date().toLocaleString('en-IN')}`,
    '─'.repeat(60),
    '',
  ]
  for (const log of logs) {
    lines.push(`[${formatLogTimestamp(log.createdAt)}] ${EVENT_LABEL[log.eventType] ?? log.eventType}`)
    if (log.actorEmail) lines.push(`  Actor: ${log.actorEmail}`)
    for (const [k, v] of Object.entries(log.meta ?? {})) {
      if (v !== null && v !== '') lines.push(`  ${k}: ${v}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

function buildCsv(logs: UserActivityLog[]): string {
  const allMetaKeys = Array.from(
    new Set(logs.flatMap(l => Object.keys(l.meta ?? {})))
  )
  const header = ['timestamp', 'eventType', 'category', 'actorEmail', ...allMetaKeys]
  const rows = logs.map(log => {
    const cat = EVENT_CATEGORY[log.eventType as UserActivityEventType] ?? ''
    const base = [
      formatLogTimestamp(log.createdAt),
      log.eventType,
      cat,
      log.actorEmail ?? '',
    ]
    const meta = allMetaKeys.map(k => String(log.meta?.[k] ?? ''))
    return [...base, ...meta].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })
  return [header.join(','), ...rows].join('\n')
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  targetUid:   string
  targetEmail: string
  onClose:     () => void
}

export function UserActivityLogModal({ targetUid, targetEmail, onClose }: Props) {
  const [logs,      setLogs]     = useState<UserActivityLog[]>([])
  const [loading,   setLoading]  = useState(true)
  const [error,     setError]    = useState(false)
  const [catFilter, setCatFilter] = useState<ActivityEventCategory | 'all'>('all')

  useEffect(() => {
    setLoading(true)
    setError(false)
    const unsub = subscribeUserActivityLogs(targetUid, incoming => {
      setLogs(incoming)
      setLoading(false)
    })
    return unsub
  }, [targetUid])

  const filtered = useMemo(() => {
    if (catFilter === 'all') return logs
    return logs.filter(l => EVENT_CATEGORY[l.eventType] === catFilter)
  }, [logs, catFilter])

  function handleExportTxt() {
    const slug = targetEmail.replace(/[^a-z0-9]/gi, '_')
    downloadText(buildTxt(filtered, targetEmail), `activity_log_${slug}.txt`, 'text/plain')
  }

  function handleExportCsv() {
    const slug = targetEmail.replace(/[^a-z0-9]/gi, '_')
    downloadText(buildCsv(filtered), `activity_log_${slug}.csv`, 'text/csv')
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <ScrollText className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Activity Log</h2>
            <p className="text-[11px] text-gray-400 truncate">{targetEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter + Export bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 shrink-0 bg-gray-50/60">
          <Filter className="w-3.5 h-3.5 text-text-secondary/50 shrink-0" />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value as ActivityEventCategory | 'all')}
            className="text-xs border border-border rounded-lg px-2 py-1 bg-white flex-1 min-w-0"
          >
            {CATEGORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-[11px] text-text-secondary/50 shrink-0">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleExportTxt}
              disabled={filtered.length === 0}
              title="Download as TXT"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-border text-text-secondary hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-3 h-3" />TXT
            </button>
            <button
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              title="Download as CSV"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-border text-text-secondary hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-3 h-3" />CSV
            </button>
          </div>
        </div>

        {/* Log timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-10 gap-2 text-text-secondary text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading logs…
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center py-10 gap-2 text-error text-sm">
              <AlertCircle className="w-4 h-4" />
              Failed to load activity log. Check Firestore permissions.
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-secondary/60 text-xs">
              <ScrollText className="w-6 h-6 opacity-30" />
              {catFilter === 'all' ? 'No activity logged yet for this user.' : `No "${catFilter}" events found.`}
            </div>
          )}
          {!loading && !error && filtered.map(log => (
            <LogEntry key={log.logId} log={log} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <p className="text-[10px] text-text-secondary/40">
            Super Admin view · Read-only · Append-only log
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
