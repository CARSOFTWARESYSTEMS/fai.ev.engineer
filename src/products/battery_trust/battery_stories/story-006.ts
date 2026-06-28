import type { BatteryStory } from './storyCatalogue'

export const STORY_006: BatteryStory = {
  id:               'BT-S006',
  title:            'Safety Risk Rules',
  status:           'planned',
  priority:         'critical',
  storyPoints:      8,
  missionRelevance: 'Safety & Health Condition is the highest-weighted trust dimension at 20%. Critical safety violations trigger hard-fail gates that immediately GROUND a battery regardless of other scores.',
  owner:            'Safety Systems Engineer (TBD)',

  businessGoal:
    'Define and implement a structured set of safety risk rules that evaluate battery physical condition against aerospace operating limits, producing a safety score and triggering hard-fail gates for life-threatening conditions.',

  problemStatement:
    'Aerospace battery failures — thermal runaway, cell explosion, sudden voltage collapse — are catastrophic. Current safety checks are manual, inconsistent across operators, and do not produce a quantified risk score. Hard limits are often buried in maintenance manuals with no automated enforcement.',

  userPersona:
    'Safety Systems Engineer responsible for defining and enforcing battery operating limits across an aerospace fleet.',

  userStory:
    'As a Safety Systems Engineer, I want a structured set of safety risk rules with configurable thresholds per battery chemistry so that any battery approaching a dangerous condition is automatically flagged and grounded before it is assigned to a mission.',

  functionalRequirements: [
    'Rule SR-01 — Critical Temperature: trigger hard-fail if temperature exceeds configurable critical limit (default 60°C)',
    'Rule SR-02 — High Temperature Warning: flag warning if temperature exceeds warning limit (default 45°C)',
    'Rule SR-03 — Low Temperature Warning: flag warning if temperature below cold limit (default -10°C)',
    'Rule SR-04 — Critical Voltage: trigger hard-fail if any cell voltage outside critical bounds (default <2.5V or >4.3V per cell)',
    'Rule SR-05 — Voltage Warning: flag warning if any cell voltage outside operating bounds (default <3.0V or >4.2V)',
    'Rule SR-06 — Critical Current: trigger hard-fail if current exceeds configured critical discharge limit',
    'Rule SR-07 — Current Warning: flag warning if current exceeds operating discharge limit',
    'Rule SR-08 — Severe Cell Imbalance: trigger hard-fail if cell voltage spread exceeds configurable limit (default 200mV)',
    'Rule SR-09 — Cell Imbalance Warning: flag warning if cell spread exceeds warning threshold (default 100mV)',
    'Rule SR-10 — Low SOH: flag warning if SOH < configurable minimum (default 70%)',
    'Rule SR-11 — Critical SOH: trigger hard-fail if SOH < critical minimum (default 50%)',
    'Rule SR-12 — Overtemperature History: flag warning if battery has triggered temperature limits more than N times in history',
    'Compute safety score (0–100) as inverse risk: 100 − weighted sum of rule violations by severity',
  ],

  nonFunctionalRequirements: [
    'Safety rules must be evaluable in < 50ms per packet',
    'Safety thresholds must be configurable per chemistry type without code changes',
    'Hard-fail safety rules must produce an immediate alert — no queuing or batching',
    'Safety score history must be retained for trend analysis',
    'Safety rule configuration changes must require partner_admin role and generate an audit event',
  ],

  uiRequirements: [
    'Safety Status Card: current temperature, voltage range, current, SOH, cell imbalance — all with colour-coded status',
    'Safety score meter: 0–100 with green (80+), amber (60–79), red (< 60) zones',
    'Active violations list: list of currently firing safety rules with severity badges',
    'History chart: temperature, voltage, current trend over last 24 hours (static in Phase 1)',
    'Chemistry thresholds table: display configured limits per rule per chemistry',
    'Hard-fail alert: full-width red banner "SAFETY HARD-FAIL — [Rule Name] — BATTERY GROUNDED"',
  ],

  backendRequirements: [
    'SafetyRulesEngine: TypeScript class with evaluate(packet, config) method',
    'evaluate() returns: SafetyAssessment { score, violations, hardFailsActive, assessedAt }',
    'SafetyThresholdConfig: per-chemistry configurable limits document in Firestore',
    'Cloud Function: evaluateSafetyRules(btid, packet) — persists result to batteryTrustScores',
    'Alert trigger: if any SR hard-fail fires, push notification to fleet manager email/webhook',
  ],

  dataModel: [
    'SafetyAssessment: { btid, score, violations: SafetyViolation[], hardFailsActive: string[], assessedAt: Timestamp }',
    'SafetyViolation: { ruleId, ruleName, severity: "hard_fail"|"warning"|"info", value, threshold, unit, description }',
    'SafetyThresholdConfig: { chemistry, tempCriticalC, tempWarningC, tempColdC, voltMinCriticalV, voltMinWarningV, voltMaxCriticalV, voltMaxWarningV, currentCriticalA, currentWarningA, imbalanceCriticalMv, imbalanceWarningMv, sohCriticalPct, sohWarningPct }',
  ],

  securityRequirements: [
    'Safety threshold configuration must require partner_admin role — regular engineers can view but not modify',
    'Hard-fail alerts must be delivered via signed webhook or authenticated email — no unauthenticated channels',
    'Safety assessment results must be immutable after storage — no post-hoc modification',
    'Critical temperature and critical voltage hard-fails must not be configurable to values outside physical safety bounds (e.g., cannot set critical temperature to 200°C)',
  ],

  useCases: [
    'UC-001: Battery operating at 62°C in flight — SR-01 fires, hard-fail activated, battery GROUNDED immediately',
    'UC-002: Cell voltage spread reaches 250mV — SR-08 fires, hard-fail activated, battery GROUNDED',
    'UC-003: SOH degrades to 48% on ageing pack — SR-11 fires, hard-fail, battery GROUNDED',
    'UC-004: Temperature at 47°C (above warning, below critical) — SR-02 fires as warning, safety score drops to 65, band enters Engineering Review',
    'UC-005: Safety Engineer reviews threshold config for LiPo vs LiFePO4 — sees different voltage bounds per chemistry',
  ],

  negativeUseCases: [
    'NC-001: Attempt to set critical temperature threshold to 0°C — system rejects value below physical operating range',
    'NC-002: Safety assessment record modified via direct Firestore write — security rule blocks it',
    'NC-003: Hard-fail alert webhook fails delivery — system retries up to 3 times with exponential backoff',
    'NC-004: Engineer attempts to override GROUNDED status without clearing the hard-fail condition — system blocks override',
  ],

  securityTestCases: [
    'SEC-001: Inject temperature of 65°C — verify SR-01 fires, hard-fail activates, battery grounded',
    'SEC-002: Inject cell imbalance of 300mV — verify SR-08 fires',
    'SEC-003: Set SOH to 40% — verify SR-11 fires as hard-fail',
    'SEC-004: Attempt to modify critical temperature threshold without partner_admin role — verify 403',
    'SEC-005: Attempt to delete safety assessment record — verify Firestore security rule blocks it',
  ],

  acceptanceCriteria: [
    'All 12 safety rules are implemented and individually evaluable',
    'SR-01, SR-04, SR-06, SR-08, SR-11 trigger hard-fail gate and GROUND the battery',
    'Safety score drops correctly based on active violations and severities',
    'Safety thresholds are per-chemistry and configurable',
    'Hard-fail alert is sent when critical safety condition is detected',
    'Safety assessment is immutable after storage',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-006 and confirm page renders',
    'Verify 12 safety rules are listed with IDs SR-01 through SR-12',
    'Confirm hard-fail rules include Critical Temperature, Critical Voltage, Critical Current, Severe Cell Imbalance, Critical SOH',
    'Check that Security Requirements mention threshold configuration access control',
    'Verify story priority is "critical" and status is "planned"',
  ],

  demoEvidenceRequired: [
    'Screenshot of Safety Status Card with temperature at 62°C and hard-fail banner active',
    'Screenshot of active violations list showing SR-01 and SR-08 violations',
    'Screenshot of safety score meter at 0 (grounded state)',
    'Screenshot of chemistry threshold configuration table',
    'Screenshot of safety warning state (score ~65, amber band)',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-006 is protected',
    'Story appears in WP-001 with correct status and priority',
  ],
}
