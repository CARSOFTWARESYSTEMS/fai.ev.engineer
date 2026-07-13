import type { BatteryReferenceProfile, GateDecision, TrustAssessment, TwinSnapshot } from './types'
import { deterministicId } from './ids'

// TwinSnapshotBuilder (POC-001): an immutable, source-linked read model for
// one run. It never recomputes the gate decision or trust score — it only
// projects them. Referred to in the UI as "Battery Twin Snapshot" /
// "Simulation Twin" — never a validated, physics-based digital twin.

interface BuildTwinInput {
  scenarioId:   string
  seed:         number
  runId:        string
  batteryId:    string
  bpan:         string
  profile:      BatteryReferenceProfile
  gateDecision: GateDecision
  trustAssessment: TrustAssessment
  occurredAtIso: string
}

export function buildTwinSnapshot(input: BuildTwinInput): TwinSnapshot {
  const snapshotId = deterministicId('TWIN', input.scenarioId, input.seed, 'twin-snapshot')

  return {
    snapshotId,
    runId:      input.runId,
    batteryId:  input.batteryId,
    bpan:       input.bpan,
    profile:    input.profile,
    identityStatus:     'TRUSTED (simulated policy)',
    certificateStatus:  'VALID',
    telemetrySummary: {
      socPercent:   78.5,
      sohPercent:   95.2,
      temperatureC: 28.3,
      voltageV:     input.profile.nominalVoltageV,
      currentA:     12.5,
      cycleCount:   142,
    },
    healthGrade:  'EXCELLENT',
    anomalies:    [],
    firmwareStatus: 'MATCHES_BASELINE',
    cyberFindings:  [],
    gateDecision:     input.gateDecision,
    trustAssessment:  input.trustAssessment,
    missionReadiness: input.trustAssessment.readinessCode,
    freshnessIso:     input.occurredAtIso,
    simulated:        true,
  }
}
