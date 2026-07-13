import type {
  EvidencePackage, GateDecision, SimulationStepResult, TrustAssessment, TwinSnapshot,
} from './types'
import { deterministicId } from './ids'

// EvidenceAgent (POC-001): drafts evidence from deterministic tool outputs.
// Review status is always DRAFT_NOT_REVIEWED — a simulator/agent can never
// mark its own evidence approved (separation of duties, see blueprint §4.9).

interface BuildEvidenceInput {
  scenarioId:       string
  seed:             number
  runId:            string
  traceId:          string
  batteryId:        string
  stepResults:      SimulationStepResult[]
  gateDecision:     GateDecision
  trustAssessment:  TrustAssessment
  twinSummary:      TwinSnapshot
  organisationName?: string
  actorDisplayName?: string
  generatedAtIso:   string
}

export const ENGINE_VERSION = 'battery-trust-poc-001.1.0.0'
export const SCHEMA_VERSION = '1.0.0'

export function buildEvidencePackage(input: BuildEvidenceInput): EvidencePackage {
  const packageId = deterministicId('EVID', input.scenarioId, input.seed, 'evidence-package')

  return {
    packageId,
    runId:      input.runId,
    traceId:    input.traceId,
    scenarioId: input.scenarioId,
    batteryId:  input.batteryId,
    reportTitle: 'Battery Trust Platform — Mission Readiness Evidence (Synthetic POC)',
    organisationName: input.organisationName,
    actorDisplayName: input.actorDisplayName,
    policyVersion:  input.gateDecision.policyProfileId,
    engineVersion:  ENGINE_VERSION,
    schemaVersion:  SCHEMA_VERSION,
    stepResults:    input.stepResults,
    gateDecision:   input.gateDecision,
    trustAssessment: input.trustAssessment,
    twinSummary:    input.twinSummary,
    assumptions: [
      'All battery, identity, telemetry, and cyber data is synthetic (simulated=true).',
      'Trust factor scores are scenario-driven, not derived from a real BMS.',
      'Twin snapshot is a simulation twin, not a physics-calibrated digital twin.',
    ],
    limitations: [
      'Deterministic local orchestrator only — no live AI model connected in POC-001.',
      'No real MQTT/Mosquitto, FastAPI simulator, or PKI integration in POC-001.',
      'Only the Mission Ready happy-path scenario is implemented end-to-end.',
    ],
    generatedAt:   input.generatedAtIso,
    reviewStatus:  'DRAFT_NOT_REVIEWED',
    classification: 'SYNTHETIC_POC',
    simulated:      true,
  }
}
