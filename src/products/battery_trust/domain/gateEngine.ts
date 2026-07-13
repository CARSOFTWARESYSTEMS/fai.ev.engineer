import type { HardGateDefinition, HardGateEvaluation, HardGateId, GateDecision, ReadinessCode } from './types'

// ─── Deterministic policy/gate engine ───────────────────────────────────────
//
// PolicyEvaluationEngine (POC-001): the AEROSPACE_POC_V1 hard-gate profile.
// A triggered hard-fail gate must always override the numeric trust score —
// see applyGatePrecedence below. This precedence cannot be bypassed by the
// AI layer or by a high composite score.

export const HARD_GATE_CATALOG: HardGateDefinition[] = [
  { id: 'unknown_identity',       label: 'Unknown battery identity' },
  { id: 'invalid_certificate',    label: 'Invalid certificate' },
  { id: 'firmware_hash_mismatch', label: 'Firmware hash mismatch' },
  { id: 'replay_attack',          label: 'Replay attack detected' },
  { id: 'spoofed_telemetry',      label: 'Spoofed telemetry detected' },
  { id: 'critical_temperature',   label: 'Critical temperature' },
  { id: 'critical_voltage',       label: 'Critical voltage' },
  { id: 'critical_current',       label: 'Critical current' },
  { id: 'severe_cell_imbalance',  label: 'Severe cell imbalance' },
  { id: 'expired_maintenance',    label: 'Expired maintenance' },
  { id: 'open_critical_incident', label: 'Open critical cyber incident' },
]

export const POLICY_PROFILE_ID = 'AEROSPACE_POC_V1'

export function evaluateGates(
  activeGateIds: HardGateId[],
  evaluatedAtIso: string,
  detailByGate: Partial<Record<HardGateId, string>> = {},
): GateDecision {
  const activeSet = new Set(activeGateIds)
  const activeGates: HardGateEvaluation[] = HARD_GATE_CATALOG
    .filter(g => activeSet.has(g.id))
    .map(g => ({
      gateId: g.id,
      label:  g.label,
      active: true,
      detail: detailByGate[g.id] ?? `${g.label} condition triggered`,
    }))

  return {
    hasHardFail:    activeGates.length > 0,
    activeGates,
    policyProfileId: POLICY_PROFILE_ID,
    evaluatedAt:     evaluatedAtIso,
  }
}

/**
 * Hard-fail precedence: an active gate always forces GROUNDED, regardless
 * of how high the composite trust score is. This is the single most
 * important safety invariant in the pipeline — see verify() invariant tests.
 */
export function applyGatePrecedence(gateDecision: GateDecision, scoreReadinessCode: ReadinessCode): ReadinessCode {
  return gateDecision.hasHardFail ? 'GROUNDED' : scoreReadinessCode
}
