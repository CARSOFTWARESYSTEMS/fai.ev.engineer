// ─── Battery Trust Platform — POC-001 domain types ─────────────────────────
//
// SYNTHETIC POC — NOT FOR OPERATIONAL OR FLIGHT DECISIONS.
// These types model a deterministic, fully local simulation of the Battery
// Trust mission-readiness pipeline. No real battery, telemetry, PKI, or AI
// model is involved in POC-001.

export type SyntheticClassification = 'SYNTHETIC_POC'

// ─── Battery reference profile ─────────────────────────────────────────────

export type BatterySegment =
  | 'two_wheeler' | 'three_wheeler' | 'four_wheeler' | 'bus' | 'truck'
  | 'drone' | 'aerospace_evtol' | 'bess'

export type BatteryChemistry = 'LFP' | 'NMC' | 'NCA' | 'LTO' | 'SOLID_STATE'

export interface BatteryReferenceProfile {
  profileId:        string
  segment:          BatterySegment
  chemistry:        BatteryChemistry
  seriesCount:       number
  parallelCount:     number
  nominalVoltageV:   number
  capacityAh:        number
  lifecycle:         'Active' | 'Under Maintenance' | 'Decommissioned'
  profileVersion:    string
  simulated:         true
}

// ─── Mission scenario ───────────────────────────────────────────────────────

export type IdentityScenario = 'VALID' | 'INVALID' | 'EXPIRED' | 'FORGED' | 'UNKNOWN'
export type HealthScenario = 'NORMAL' | 'RAPID_DEGRADATION' | 'CELL_IMBALANCE' | 'THERMAL_STRESS' | 'LOW_SOH'
export type TelemetryScenario = 'NORMAL' | 'DELAYED' | 'DUPLICATE' | 'OUT_OF_RANGE' | 'MISSING_TIMESTAMP' | 'SPOOFED_SOURCE' | 'REPLAY'
export type AttackScenario = 'NONE' | 'REPLAY_ATTACK' | 'TELEMETRY_SPOOFING' | 'CERTIFICATE_FORGERY' | 'FIRMWARE_INJECTION' | 'BMS_INTRUSION'

export interface MissionScenario {
  scenarioId:        string
  name:              string
  seed:              number
  fixedClockIso:     string
  batteryProfileId:  string
  identityScenario:  IdentityScenario
  healthScenario:    HealthScenario
  telemetryScenario: TelemetryScenario
  attackScenario:    AttackScenario
  policyProfileId:   string
  trustProfileId:    string
  simulated:         true
}

// ─── Simulator catalog ──────────────────────────────────────────────────────

export type SimulatorId =
  | 'SIM-001' | 'SIM-002' | 'SIM-003' | 'SIM-004' | 'SIM-005'
  | 'SIM-006' | 'SIM-007' | 'SIM-008' | 'SIM-009' | 'SIM-010'

export type CapabilityPillarId =
  | 'battery_aadhaar' | 'battery_intelligence' | 'safety'
  | 'cybersecurity' | 'telemetry' | 'mission_readiness'

export interface SimulatorDescriptor {
  id:           SimulatorId
  name:         string
  description:  string
  pillar:       CapabilityPillarId
  isOrchestrator?: boolean
}

export interface CapabilityPillar {
  id:            CapabilityPillarId
  title:         string
  description:   string
  accent:        'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'pink'
  simulatorIds:  SimulatorId[]
}

// ─── Simulation run / pipeline ──────────────────────────────────────────────

export type SimulationRunStatus =
  | 'DRAFT' | 'PLANNED' | 'VALIDATED' | 'AWAITING_APPROVAL' | 'RUNNING'
  | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED'

export type SimulationStepStatus =
  | 'PENDING' | 'READY' | 'RUNNING' | 'PASS' | 'FAIL' | 'SKIPPED' | 'BLOCKED'

export interface SimulationStepResult {
  stepIndex:      number
  simulatorId:    SimulatorId
  name:           string
  status:         SimulationStepStatus
  summary:        string
  durationMs:     number
  evidenceRef?:   string
  occurredAt:     string
}

// ─── Hard-fail gates ─────────────────────────────────────────────────────────

export type HardGateId =
  | 'unknown_identity' | 'invalid_certificate' | 'firmware_hash_mismatch'
  | 'replay_attack' | 'spoofed_telemetry' | 'critical_temperature'
  | 'critical_voltage' | 'critical_current' | 'severe_cell_imbalance'
  | 'expired_maintenance' | 'open_critical_incident'

export interface HardGateDefinition {
  id:       HardGateId
  label:    string
}

export interface HardGateEvaluation {
  gateId:   HardGateId
  label:    string
  active:   boolean
  detail:   string
}

export interface GateDecision {
  hasHardFail:       boolean
  activeGates:        HardGateEvaluation[]
  policyProfileId:    string
  evaluatedAt:        string
}

// ─── Trust assessment ────────────────────────────────────────────────────────

export type TrustFactorId =
  | 'identity_trust' | 'ownership_custody' | 'config_firmware_trust'
  | 'telemetry_integrity' | 'cybersecurity_posture' | 'safety_health'
  | 'maintenance_history'

export interface TrustFactorDefinition {
  id:       TrustFactorId
  label:    string
  weight:   number   // percent, 0-100; all definitions must sum to 100
}

export interface TrustFactorResult {
  id:            TrustFactorId
  label:         string
  weight:        number
  score:         number   // 0-100
  contribution:  number   // score * weight / 100, rounded to 2dp
}

export type ReadinessCode = 'MISSION_READY' | 'CAUTION' | 'REVIEW_REQUIRED' | 'NOT_READY' | 'GROUNDED'

export interface ReadinessBandDefinition {
  code:   ReadinessCode
  label:  string
  min:    number
  max:    number   // inclusive
}

export interface TrustAssessment {
  batteryId:         string
  factors:           TrustFactorResult[]
  overallScore:      number
  readinessCode:      ReadinessCode
  readinessLabel:     string
  gateDecision:       GateDecision
  policyVersion:      string
  evaluatedAt:        string
  dataQuality:        'COMPLETE' | 'PARTIAL'
  simulated:          true
}

// ─── Twin snapshot ────────────────────────────────────────────────────────────

export interface TwinSnapshot {
  snapshotId:      string
  runId:           string
  batteryId:       string
  bpan:            string
  profile:         BatteryReferenceProfile
  identityStatus:  string
  certificateStatus: string
  telemetrySummary: {
    socPercent: number
    sohPercent: number
    temperatureC: number
    voltageV: number
    currentA: number
    cycleCount: number
  }
  healthGrade:      string
  anomalies:        string[]
  firmwareStatus:   string
  cyberFindings:    string[]
  gateDecision:     GateDecision
  trustAssessment:  TrustAssessment
  missionReadiness: ReadinessCode
  freshnessIso:     string
  simulated:        true
}

// ─── Evidence package ─────────────────────────────────────────────────────────

export interface EvidencePackage {
  packageId:       string
  runId:           string
  traceId:         string
  scenarioId:      string
  batteryId:       string
  reportTitle:      string
  organisationName?: string
  actorDisplayName?: string
  policyVersion:    string
  engineVersion:    string
  schemaVersion:    string
  stepResults:      SimulationStepResult[]
  gateDecision:     GateDecision
  trustAssessment:  TrustAssessment
  twinSummary:      TwinSnapshot
  assumptions:      string[]
  limitations:      string[]
  generatedAt:      string
  reviewStatus:     'DRAFT_NOT_REVIEWED'
  classification:   SyntheticClassification
  simulated:        true
}

// ─── Agent plan / activity ────────────────────────────────────────────────────

export interface AgentPlanStep {
  simulatorId: SimulatorId
  name:        string
  reason:      string
}

export interface AgentPlan {
  goal:              string
  steps:             AgentPlanStep[]
  assumptions:       string[]
  approvalRequired:  boolean
  providerLabel:     string
  modelLabel:        string
}

export type AgentActivityKind = 'plan' | 'action' | 'observation' | 'evidence' | 'recommendation'

export interface AgentActivityItem {
  kind:  AgentActivityKind
  text:  string
  at:    string
}

// ─── Simulation event (run/event console) ─────────────────────────────────────

export interface SimulationEvent {
  eventId:      string
  runId:        string
  traceId:      string
  occurredAt:   string
  simulatorId:  SimulatorId | 'SIM-010'
  message:      string
  level:        'info' | 'warn' | 'error'
}

// ─── Full simulation run ──────────────────────────────────────────────────────

export interface SimulationRun {
  runId:            string
  traceId:          string
  scenarioId:        string
  batteryId:         string
  status:            SimulationRunStatus
  schemaVersion:     string
  steps:             SimulationStepResult[]
  events:            SimulationEvent[]
  gateDecision?:     GateDecision
  trustAssessment?:  TrustAssessment
  twinSnapshot?:     TwinSnapshot
  evidencePackage?:  EvidencePackage
  agentPlan:         AgentPlan
  agentActivity:     AgentActivityItem[]
  startedAt:         string
  completedAt?:      string
  simulated:         true
  classification:    SyntheticClassification
}
