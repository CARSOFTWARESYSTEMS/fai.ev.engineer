import type {
  TrustFactorDefinition, TrustFactorId, TrustFactorResult,
  ReadinessBandDefinition, ReadinessCode,
} from './types'

// ─── Deterministic trust engine ─────────────────────────────────────────────
//
// TrustDecisionEngine (POC-001): pure functions only. The AI layer may
// explain these results but never computes an alternative score — see
// AGENT_PLAN in agentPlanner.ts.

export const TRUST_FACTOR_DEFINITIONS: TrustFactorDefinition[] = [
  { id: 'identity_trust',         label: 'Identity Trust',                    weight: 15 },
  { id: 'ownership_custody',      label: 'Ownership & Chain of Custody',      weight: 10 },
  { id: 'config_firmware_trust',  label: 'Configuration & Firmware Trust',    weight: 15 },
  { id: 'telemetry_integrity',    label: 'Telemetry Integrity',               weight: 15 },
  { id: 'cybersecurity_posture',  label: 'Cybersecurity Posture',             weight: 15 },
  { id: 'safety_health',          label: 'Safety & Health Condition',         weight: 20 },
  { id: 'maintenance_history',    label: 'Maintenance & Mission History',     weight: 10 },
]

export const READINESS_BAND_DEFINITIONS: ReadinessBandDefinition[] = [
  { code: 'MISSION_READY',    label: 'Mission Ready',               min: 90, max: 100 },
  { code: 'CAUTION',          label: 'Ready with Caution',          min: 75, max: 89.999999 },
  { code: 'REVIEW_REQUIRED',  label: 'Engineering Review Required', min: 60, max: 74.999999 },
  { code: 'NOT_READY',        label: 'Not Mission Ready',           min: 40, max: 59.999999 },
  { code: 'GROUNDED',         label: 'Grounded / Quarantine',       min: 0,  max: 39.999999 },
]

function roundTo2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function validateWeights(weights: TrustFactorDefinition[]): void {
  const sum = roundTo2(weights.reduce((s, w) => s + w.weight, 0))
  if (sum !== 100) {
    throw new Error(`Trust factor weights must sum to 100, got ${sum}`)
  }
}

export function validateFactorScore(score: number): void {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`Trust factor score must be between 0 and 100, got ${score}`)
  }
}

/**
 * Computes weighted per-factor contributions and the overall trust score.
 * Throws on invalid weights or out-of-range factor scores — callers must
 * validate scenario input before invoking the engine.
 */
export function computeTrustFactors(
  scores: Record<TrustFactorId, number>,
  weights: TrustFactorDefinition[] = TRUST_FACTOR_DEFINITIONS,
): { factors: TrustFactorResult[]; overallScore: number } {
  validateWeights(weights)

  const factors: TrustFactorResult[] = weights.map(def => {
    const score = scores[def.id]
    validateFactorScore(score)
    const contribution = roundTo2((score * def.weight) / 100)
    return { id: def.id, label: def.label, weight: def.weight, score, contribution }
  })

  const overallScore = roundTo2(factors.reduce((s, f) => s + f.contribution, 0))

  return { factors, overallScore }
}

export function getReadinessBand(score: number): ReadinessBandDefinition {
  const band = READINESS_BAND_DEFINITIONS.find(b => score >= b.min && score <= b.max)
  return band ?? READINESS_BAND_DEFINITIONS[READINESS_BAND_DEFINITIONS.length - 1]
}

export function readinessCodeForScore(score: number): ReadinessCode {
  return getReadinessBand(score).code
}
