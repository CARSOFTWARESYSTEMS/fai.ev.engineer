import type {
  AgentActivityItem, AgentPlan, BatteryReferenceProfile, MissionScenario,
  SimulationEvent, SimulationRun, SimulationStepResult, TrustFactorId,
} from '../domain/types'
import { deterministicId, stepEventId } from '../domain/ids'
import { computeTrustFactors, getReadinessBand } from '../domain/trustEngine'
import { evaluateGates, applyGatePrecedence } from '../domain/gateEngine'
import { buildTwinSnapshot } from '../domain/twinBuilder'
import { buildEvidencePackage, SCHEMA_VERSION } from '../domain/evidenceBuilder'
import { HAPPY_PATH_FACTOR_SCORES } from '../domain/fixtures'

// ─── LocalSimulationGateway (POC-001) ───────────────────────────────────────
//
// Deterministic implementation of the `SimulationGateway` adapter boundary.
// A future `FastApiSimulationGateway` can implement the same interface
// (`runScenarioAsync`) without changing any UI or domain code.
//
// Only the Mission Ready happy-path scenario (SCN-HAPPY-001) is implemented
// end-to-end in POC-001 — see docs/reports/battery_trust_poc_001_known_limitations_report.md.

export interface RunOptions {
  organisationName?: string
  actorDisplayName?: string
}

export interface SimulationGateway {
  runScenarioAsync(scenario: MissionScenario, profile: BatteryReferenceProfile, options?: RunOptions, stepDelayMs?: number): Promise<SimulationRun>
}

function pass(stepIndex: number, simulatorId: SimulationStepResult['simulatorId'], name: string, summary: string, occurredAt: string, evidenceRef?: string): SimulationStepResult {
  return { stepIndex, simulatorId, name, status: 'PASS', summary, durationMs: 40 + stepIndex * 7, evidenceRef, occurredAt }
}

function buildAgentPlan(scenario: MissionScenario): AgentPlan {
  return {
    goal: `Assess whether ${scenario.batteryProfileId} is trusted for the "${scenario.name}" scenario.`,
    providerLabel: 'Deterministic Local Orchestrator',
    modelLabel: 'Not connected in POC-001',
    approvalRequired: false,
    assumptions: [
      'All inputs are synthetic (simulated=true, classification=SYNTHETIC_POC).',
      'Attack scenario is NONE — SIM-005 will be recorded as SKIPPED.',
    ],
    steps: [
      { simulatorId: 'SIM-001', name: 'Battery Profile',   reason: 'Establish the root synthetic battery aggregate.' },
      { simulatorId: 'SIM-002', name: 'Identity',           reason: `Verify identity under scenario ${scenario.identityScenario}.` },
      { simulatorId: 'SIM-008', name: 'Health',             reason: `Generate health snapshot under scenario ${scenario.healthScenario}.` },
      { simulatorId: 'SIM-003', name: 'Telemetry',          reason: `Generate observable telemetry under scenario ${scenario.telemetryScenario}.` },
      { simulatorId: 'SIM-005', name: 'Attack Injection',   reason: scenario.attackScenario === 'NONE' ? 'No adversarial scenario selected — will be skipped.' : `Inject ${scenario.attackScenario}.` },
      { simulatorId: 'SIM-006', name: 'Detection & Gates',  reason: 'Evaluate policy rules against observable events only.' },
      { simulatorId: 'SIM-004', name: 'Trust Assessment',   reason: 'Compute deterministic seven-factor trust score and readiness band.' },
      { simulatorId: 'SIM-007', name: 'Twin Snapshot',      reason: 'Project a source-linked, read-only twin for this run.' },
      { simulatorId: 'SIM-009', name: 'Evidence',           reason: 'Draft the evidence package for QA/Architect review.' },
    ],
  }
}

function buildHappyPathRun(scenario: MissionScenario, profile: BatteryReferenceProfile, options: RunOptions): SimulationRun {
  const runId    = deterministicId('RUN', scenario.scenarioId, scenario.seed, 'run')
  const traceId  = deterministicId('TRC', scenario.scenarioId, scenario.seed, 'trace')
  const batteryId = deterministicId('BID', scenario.scenarioId, scenario.seed, 'battery')
  const bpan     = `BPAN-${profile.chemistry}-2026-IN-${deterministicId('', scenario.scenarioId, scenario.seed, 'bpan').replace(/^-/, '').slice(0, 5)}`
  const t        = scenario.fixedClockIso

  const steps: SimulationStepResult[] = [
    pass(1, 'SIM-001', 'Battery Profile',   `Battery profile ${profile.profileId} created (${profile.chemistry}, ${profile.nominalVoltageV}V nominal).`, t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-001')),
    pass(2, 'SIM-002', 'Identity',          'Identity trusted within simulated policy — certificate VALID.', t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-002')),
    pass(3, 'SIM-008', 'Health',            'Health grade EXCELLENT — no critical anomaly detected.', t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-008')),
    pass(4, 'SIM-003', 'Telemetry',         'Normal telemetry events generated (observable stream only).', t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-003')),
    { stepIndex: 5, simulatorId: 'SIM-005', name: 'Attack Injection', status: 'SKIPPED', summary: 'SKIPPED: no adversarial scenario selected.', durationMs: 0, occurredAt: t },
    pass(6, 'SIM-006', 'Detection & Gates', 'All evaluated rules PASS — no hard-fail gate active.', t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-006')),
    pass(7, 'SIM-004', 'Trust Assessment',  'Deterministic trust assessment computed.', t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-004')),
    pass(8, 'SIM-007', 'Twin Snapshot',     'Source-linked twin snapshot created.', t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-007')),
    pass(9, 'SIM-009', 'Evidence',          'Draft evidence package created (DRAFT / NOT REVIEWED).', t, deterministicId('EVID', scenario.scenarioId, scenario.seed, 'sim-009')),
  ]

  const gateDecision = evaluateGates([], t)

  const { factors, overallScore } = computeTrustFactors(HAPPY_PATH_FACTOR_SCORES as Record<TrustFactorId, number>)
  const scoreBand = getReadinessBand(overallScore)
  const finalReadinessCode = applyGatePrecedence(gateDecision, scoreBand.code)
  const finalBandLabel = finalReadinessCode === scoreBand.code ? scoreBand.label
    : 'Grounded / Quarantine'

  const trustAssessment = {
    batteryId,
    factors,
    overallScore,
    readinessCode: finalReadinessCode,
    readinessLabel: finalBandLabel,
    gateDecision,
    policyVersion: scenario.trustProfileId,
    evaluatedAt: t,
    dataQuality: 'COMPLETE' as const,
    simulated: true as const,
  }

  const twinSnapshot = buildTwinSnapshot({
    scenarioId: scenario.scenarioId,
    seed: scenario.seed,
    runId,
    batteryId,
    bpan,
    profile,
    gateDecision,
    trustAssessment,
    occurredAtIso: t,
  })

  const evidencePackage = buildEvidencePackage({
    scenarioId: scenario.scenarioId,
    seed: scenario.seed,
    runId,
    traceId,
    batteryId,
    stepResults: steps,
    gateDecision,
    trustAssessment,
    twinSummary: twinSnapshot,
    organisationName: options.organisationName,
    actorDisplayName: options.actorDisplayName,
    generatedAtIso: t,
  })

  const events: SimulationEvent[] = steps.map((s, i) => ({
    eventId: stepEventId(scenario.scenarioId, scenario.seed, i + 1),
    runId,
    traceId,
    occurredAt: t,
    simulatorId: s.simulatorId,
    message: `${s.simulatorId} ${s.name}: ${s.status} — ${s.summary}`,
    level: 'info' as const,
  }))

  const agentPlan = buildAgentPlan(scenario)

  const agentActivity: AgentActivityItem[] = [
    { kind: 'plan',           text: agentPlan.goal, at: t },
    { kind: 'action',         text: `Executed ${steps.length} pipeline steps via LocalSimulationGateway (SIM-005 skipped).`, at: t },
    { kind: 'observation',    text: `Gate decision: ${gateDecision.hasHardFail ? 'HARD_FAIL' : 'PASS'} · Trust score: ${overallScore} · Band: ${finalBandLabel}.`, at: t },
    { kind: 'evidence',       text: `Draft evidence package ${evidencePackage.packageId} created (DRAFT / NOT REVIEWED).`, at: t },
    { kind: 'recommendation', text: finalReadinessCode === 'MISSION_READY'
        ? 'Battery meets the synthetic Mission Ready threshold. Human mission approval is still required before any real deployment.'
        : 'Review gate and trust factor evidence before proceeding.', at: t },
  ]

  return {
    runId,
    traceId,
    scenarioId: scenario.scenarioId,
    batteryId,
    status: 'COMPLETED',
    schemaVersion: SCHEMA_VERSION,
    steps,
    events,
    gateDecision,
    trustAssessment,
    twinSnapshot,
    evidencePackage,
    agentPlan,
    agentActivity,
    startedAt: t,
    completedAt: t,
    simulated: true,
    classification: 'SYNTHETIC_POC',
  }
}

export class LocalSimulationGateway implements SimulationGateway {
  private pending = false

  /**
   * Runs the scenario deterministically. `stepDelayMs` only adds a UI-facing
   * delay before returning the (already-computed) result — it never affects
   * the deterministic output, so tests can call with stepDelayMs=0.
   */
  runScenarioAsync(scenario: MissionScenario, profile: BatteryReferenceProfile, options: RunOptions = {}, stepDelayMs = 0): Promise<SimulationRun> {
    if (this.pending) {
      throw new Error('A simulation run is already in progress. Wait for it to complete before starting another.')
    }
    this.pending = true

    const run = buildHappyPathRun(scenario, profile, options)

    const finish = () => { this.pending = false; return run }

    if (stepDelayMs <= 0) {
      this.pending = false
      return Promise.resolve(run)
    }

    return new Promise<SimulationRun>(resolve => {
      setTimeout(() => resolve(finish()), stepDelayMs)
    })
  }
}

/** Pure, synchronous helper — used directly by domain tests for determinism checks. */
export { buildHappyPathRun }
