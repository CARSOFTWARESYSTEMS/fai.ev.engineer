import { useState } from 'react'
import { Download, FileJson, FileText, ClipboardList } from 'lucide-react'
import type { SimulationRun } from '../domain/types'
import { evidenceToHtml, evidenceToJson, downloadTextFile } from '../services/evidenceExport'

type Tab = 'summary' | 'trust' | 'twin' | 'gates' | 'evidence' | 'json'

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Mission Summary' },
  { id: 'trust',   label: 'Trust Assessment' },
  { id: 'twin',    label: 'Battery Twin' },
  { id: 'gates',   label: 'Rule / Gate Results' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'json',    label: 'JSON' },
]

function readinessTone(code?: string): string {
  if (code === 'MISSION_READY') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (code === 'CAUTION') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (code === 'GROUNDED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-background text-text-secondary border-border'
}

interface Props {
  run: SimulationRun | null
  organisationName?: string
  actorDisplayName?: string
}

export function StudioResultPanels({ run }: Props) {
  const [tab, setTab] = useState<Tab>('summary')

  if (!run) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
        <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
          <ClipboardList className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-1.5">No results yet</h3>
        <p className="text-sm text-text-secondary max-w-md">
          Switch to Builder and select <strong>Simulate</strong> to populate the mission summary, trust assessment, battery twin, gate results, and evidence here.
        </p>
      </div>
    )
  }

  const { trustAssessment: trust, twinSnapshot: twin, evidencePackage: evidence, gateDecision } = run

  const handleDownloadJson = () => {
    if (!evidence) return
    downloadTextFile(`battery-trust-evidence-${evidence.runId}.json`, evidenceToJson(evidence), 'application/json')
  }
  const handleDownloadHtml = () => {
    if (!evidence) return
    downloadTextFile(`battery-trust-evidence-${evidence.runId}.html`, evidenceToHtml(evidence), 'text/html')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-t-md ${
              tab === t.id ? 'bg-primary-light text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-1 pr-1">
          <button type="button" onClick={handleDownloadJson} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <FileJson className="w-3.5 h-3.5" /> JSON
          </button>
          <button type="button" onClick={handleDownloadHtml} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <FileText className="w-3.5 h-3.5" /> HTML
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'summary' && trust && (
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${readinessTone(trust.readinessCode)}`}>
              {trust.readinessLabel}
            </div>
            <p className="text-3xl font-extrabold text-text-primary">{trust.overallScore}<span className="text-base font-semibold text-text-secondary">/100</span></p>
            <p className="text-sm text-text-secondary">Battery {run.batteryId} · Scenario {run.scenarioId} · {run.steps.filter(s => s.status === 'PASS').length}/{run.steps.length} steps PASS</p>
          </div>
        )}

        {tab === 'trust' && trust && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase text-text-secondary border-b border-border">
                <th className="py-2">Factor</th><th className="py-2">Weight</th><th className="py-2">Score</th><th className="py-2">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {trust.factors.map(f => (
                <tr key={f.id} className="border-b border-border">
                  <td className="py-2 text-text-primary">{f.label}</td>
                  <td className="py-2 text-text-secondary">{f.weight}%</td>
                  <td className="py-2 text-text-secondary">{f.score}</td>
                  <td className="py-2 font-semibold text-text-primary">{f.contribution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'twin' && twin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-text-secondary">BPAN</p><p className="font-semibold text-text-primary">{twin.bpan}</p></div>
            <div><p className="text-xs text-text-secondary">Identity</p><p className="font-semibold text-text-primary">{twin.identityStatus}</p></div>
            <div><p className="text-xs text-text-secondary">SOH / SOC</p><p className="font-semibold text-text-primary">{twin.telemetrySummary.sohPercent}% / {twin.telemetrySummary.socPercent}%</p></div>
            <div><p className="text-xs text-text-secondary">Voltage / Current</p><p className="font-semibold text-text-primary">{twin.telemetrySummary.voltageV}V / {twin.telemetrySummary.currentA}A</p></div>
            <div><p className="text-xs text-text-secondary">Health grade</p><p className="font-semibold text-text-primary">{twin.healthGrade}</p></div>
            <div><p className="text-xs text-text-secondary">Firmware</p><p className="font-semibold text-text-primary">{twin.firmwareStatus}</p></div>
            <div><p className="text-xs text-text-secondary">Mission readiness</p><p className="font-semibold text-text-primary">{twin.missionReadiness}</p></div>
            <div><p className="text-xs text-text-secondary">Freshness</p><p className="font-semibold text-text-primary">{twin.freshnessIso}</p></div>
            <p className="col-span-full text-xs text-text-secondary italic">Simulation twin — not a validated, physics-calibrated digital twin.</p>
          </div>
        )}

        {tab === 'gates' && gateDecision && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              Policy {gateDecision.policyProfileId} · Overall: {gateDecision.hasHardFail ? 'HARD_FAIL' : 'PASS'}
            </p>
            {gateDecision.activeGates.length === 0 ? (
              <p className="text-sm text-text-secondary">No hard-fail gates active.</p>
            ) : (
              <ul className="space-y-1">
                {gateDecision.activeGates.map(g => (
                  <li key={g.gateId} className="text-sm text-red-700">{g.label} — {g.detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'evidence' && evidence && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-text-primary">{evidence.reportTitle}</p>
            <p className="text-text-secondary">Status: {evidence.reviewStatus}</p>
            <p className="text-text-secondary">Package ID: {evidence.packageId}</p>
            <p className="text-text-secondary">Policy {evidence.policyVersion} · Engine {evidence.engineVersion} · Schema {evidence.schemaVersion}</p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleDownloadJson} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90">
                <Download className="w-3.5 h-3.5" /> Download JSON
              </button>
              <button type="button" onClick={handleDownloadHtml} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary-light">
                <Download className="w-3.5 h-3.5" /> Download HTML
              </button>
            </div>
          </div>
        )}

        {tab === 'json' && (
          <pre className="text-xs bg-background border border-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(run, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
