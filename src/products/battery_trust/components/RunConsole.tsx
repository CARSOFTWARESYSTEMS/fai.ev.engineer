import { useState } from 'react'
import type { SimulationEvent, SimulationRun } from '../domain/types'

type Tab = 'events' | 'problems' | 'json' | 'verification'

const TABS: { id: Tab; label: string }[] = [
  { id: 'events',       label: 'Events' },
  { id: 'problems',     label: 'Problems' },
  { id: 'json',         label: 'JSON' },
  { id: 'verification', label: 'Verification' },
]

function levelColor(level: SimulationEvent['level']): string {
  if (level === 'error') return 'text-red-400'
  if (level === 'warn') return 'text-amber-400'
  return 'text-slate-300'
}

interface Props {
  run: SimulationRun | null
}

export function RunConsole({ run }: Props) {
  const [tab, setTab] = useState<Tab>('events')

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-800">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-md ${
              tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        {run && (
          <span className="ml-auto mb-1 text-[10px] font-mono text-slate-500 pr-2">
            run={run.runId} trace={run.traceId} schema={run.schemaVersion}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs">
        {!run && <p className="text-slate-500">No run yet. Select Simulate to execute the Mission Ready happy-path scenario.</p>}

        {run && tab === 'events' && (
          <ul className="space-y-1">
            {run.events.map(e => (
              <li key={e.eventId} className={levelColor(e.level)}>
                [{e.occurredAt}] {e.simulatorId} — {e.message}
              </li>
            ))}
          </ul>
        )}

        {run && tab === 'problems' && (
          <p className="text-slate-500">
            {run.status === 'COMPLETED' && !run.gateDecision?.hasHardFail
              ? 'No problems detected in this run.'
              : 'Review gate decision and step results for details.'}
          </p>
        )}

        {run && tab === 'json' && (
          <pre className="whitespace-pre-wrap break-words text-emerald-300">{JSON.stringify(run, null, 2)}</pre>
        )}

        {run && tab === 'verification' && (
          <ul className="space-y-1 text-slate-300">
            <li>simulated: {String(run.simulated)}</li>
            <li>classification: {run.classification}</li>
            <li>schemaVersion: {run.schemaVersion}</li>
            <li>steps: {run.steps.length} (expected 9)</li>
            <li>SIM-005 status: {run.steps.find(s => s.simulatorId === 'SIM-005')?.status}</li>
            <li>hardFail: {String(run.gateDecision?.hasHardFail)}</li>
            <li>overallScore: {run.trustAssessment?.overallScore}</li>
            <li>readiness: {run.trustAssessment?.readinessLabel}</li>
          </ul>
        )}
      </div>
    </div>
  )
}
