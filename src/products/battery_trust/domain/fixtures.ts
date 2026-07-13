import type { BatteryReferenceProfile, MissionScenario, TrustFactorId } from './types'

// ─── POC-001 golden fixtures ─────────────────────────────────────────────────
//
// Deterministic, versioned, synthetic-only. Not an engineering standard —
// see BatteryReferenceProfile docs in the architecture blueprint.

export const REF_2W_LFP_51V_V1: BatteryReferenceProfile = {
  profileId:       'REF-2W-LFP-51V-V1',
  segment:         'two_wheeler',
  chemistry:       'LFP',
  seriesCount:     16,
  parallelCount:   1,
  nominalVoltageV: 51.2,
  capacityAh:      60,
  lifecycle:       'Active',
  profileVersion:  '1.0.0',
  simulated:       true,
}

export const SCN_HAPPY_001: MissionScenario = {
  scenarioId:        'SCN-HAPPY-001',
  name:              'Mission Ready — Baseline Happy Path',
  seed:              42,
  fixedClockIso:     '2026-07-13T06:00:00.000Z',
  batteryProfileId:  REF_2W_LFP_51V_V1.profileId,
  identityScenario:  'VALID',
  healthScenario:    'NORMAL',
  telemetryScenario: 'NORMAL',
  attackScenario:    'NONE',
  policyProfileId:   'POC-SAFETY-CYBER-V1',
  trustProfileId:    'POC-TRUST-V1',
  simulated:         true,
}

export const HAPPY_PATH_FACTOR_SCORES: Record<TrustFactorId, number> = {
  identity_trust:        98,
  ownership_custody:     96,
  config_firmware_trust: 97,
  telemetry_integrity:   96,
  cybersecurity_posture: 98,
  safety_health:         94,
  maintenance_history:   95,
}

export const HAPPY_PATH_EXPECTED_SCORE = 96.25
