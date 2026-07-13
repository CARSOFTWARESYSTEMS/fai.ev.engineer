import type { SimulationRun } from '../domain/types'

// Lightweight session-scoped summary cache so Battery Trust Home can show
// "current/last local run" values without a full state-management layer.
// POC-001 limitation: session-only, not persisted to Firestore — see
// docs/reports/battery_trust_poc_001_known_limitations_report.md.

const KEY = 'bt_last_run_summary'

export interface LastRunSummary {
  runId:                      string
  scenarioId:                 string
  batteryId:                  string
  missionStatus:              string
  trustScore:                 number
  hardFailActive:             boolean
  simulatorsCompleted:        number
  simulatorsTotal:            number
  evidenceCompletionPercent:  number
  activeProfileId:            string
  completedAt:                string
}

export function saveLastRunSummary(run: SimulationRun, profileId: string): void {
  if (!run.trustAssessment || !run.gateDecision) return

  const summary: LastRunSummary = {
    runId:               run.runId,
    scenarioId:          run.scenarioId,
    batteryId:           run.batteryId,
    missionStatus:       run.trustAssessment.readinessLabel,
    trustScore:          run.trustAssessment.overallScore,
    hardFailActive:      run.gateDecision.hasHardFail,
    simulatorsCompleted: run.steps.filter(s => s.status === 'PASS' || s.status === 'SKIPPED').length,
    simulatorsTotal:     run.steps.length,
    evidenceCompletionPercent: run.evidencePackage ? 100 : 0,
    activeProfileId:     profileId,
    completedAt:         run.completedAt ?? run.startedAt,
  }

  try { sessionStorage.setItem(KEY, JSON.stringify(summary)) } catch { /* storage unavailable — non-critical */ }
}

export function loadLastRunSummary(): LastRunSummary | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LastRunSummary) : null
  } catch {
    return null
  }
}
