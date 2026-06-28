import type { BatteryStory } from './storyCatalogue'

export const STORY_002: BatteryStory = {
  id:               'BT-S002',
  title:            'Mission Battery Trust Score Formula',
  status:           'planned',
  priority:         'critical',
  storyPoints:      13,
  missionRelevance: 'The composite trust score is the single authoritative signal that determines whether a battery is GO or NO-GO for a mission. Every trust dimension must be weighted and combined correctly.',
  owner:            'Engineering Lead (TBD)',

  businessGoal:
    'Define and implement the composite trust score formula that combines seven trust dimensions into a single 0–100 mission readiness number, with hard-fail gate logic that overrides the score when safety or security is compromised.',

  problemStatement:
    'Battery mission readiness is currently assessed manually by engineers using checklists and subjective judgement. There is no standardised, auditable formula that produces a repeatable, comparable trust score across different batteries, missions, or operators.',

  userPersona:
    'Mission Safety Officer at an aerospace operator responsible for approving batteries for flight missions.',

  userStory:
    'As a Mission Safety Officer, I want a single composite trust score with a clear pass/fail threshold and an explainable breakdown by trust dimension so that I can make a documented, defensible GO/NO-GO decision for each battery before every mission.',

  functionalRequirements: [
    'Compute Identity Trust score (0–100) — based on identity completeness, certificate validity, hash integrity',
    'Compute Ownership Trust score (0–100) — based on chain of custody completeness and transfer audit trail',
    'Compute Configuration & Firmware Trust score (0–100) — based on firmware hash match and config signature validity',
    'Compute Telemetry Integrity score (0–100) — based on telemetry freshness, sequence continuity, and MAC validity',
    'Compute Cybersecurity Risk score (0–100) — inverted risk score based on detected anomalies and incidents',
    'Compute Safety & Health score (0–100) — based on SOH, temperature, voltage, current, cell imbalance',
    'Compute Maintenance & History score (0–100) — based on maintenance currency, cycle count, and mission history',
    'Apply weighted average: Identity×0.15 + Ownership×0.10 + Firmware×0.15 + Telemetry×0.15 + Cyber×0.15 + Safety×0.20 + Maintenance×0.10',
    'Apply hard-fail gate logic: if any hard-fail condition is true, override score to 0 and set status GROUNDED',
    'Return composite score, per-dimension scores, active hard-fail gates, and readiness band label',
  ],

  nonFunctionalRequirements: [
    'Score computation must be deterministic — identical inputs always produce identical score',
    'Score must recompute in < 500ms after any input change',
    'Score history must be retained with timestamp for audit and trend analysis',
    'All hard-fail gate evaluations must be individually logged with the triggering condition',
    'Formula weights must be configurable by partner admin (stored in Firestore, validated to sum to 1.0)',
  ],

  uiRequirements: [
    'Composite score gauge: large circular dial 0–100 with colour zone overlays',
    'Readiness band label below score gauge: Mission Ready / Ready with Caution / Engineering Review / Not Ready / Grounded',
    'Per-dimension score bars: horizontal progress bar per dimension showing score and weight contribution',
    'Hard-fail gate list: red highlighted list of active hard-fail conditions',
    'Score timestamp: "Computed at HH:MM UTC on DD MMM YYYY"',
    'Score breakdown expandable card per dimension',
    'GO / NO-GO verdict chip: large green GO or red NO-GO based on score and gates',
  ],

  backendRequirements: [
    'Cloud Function: computeBatteryTrustScore(btid, missionId) — fetches all inputs and returns composite result',
    'Cloud Function: getBatteryScoreHistory(btid) — returns last N score computations',
    'Firestore collection: batteryTrustScores/{btid}/history/{timestamp}',
    'Firestore document: partnerConfig/{partnerId}/trustFormula — stores custom weights',
    'Validate custom weights sum to exactly 1.0 before saving',
  ],

  dataModel: [
    'scoreId: string',
    'btid: string',
    'missionId: string | null',
    'compositeScore: number (0–100)',
    'identityScore: number',
    'ownershipScore: number',
    'firmwareScore: number',
    'telemetryScore: number',
    'cyberScore: number',
    'safetyScore: number',
    'maintenanceScore: number',
    'activeHardFails: string[]',
    'readinessBand: "mission_ready" | "ready_with_caution" | "engineering_review" | "not_ready" | "grounded"',
    'isGrounded: boolean',
    'computedAt: Timestamp',
    'computedBy: string (uid)',
    'formulaVersion: string',
  ],

  securityRequirements: [
    'Score computation must be server-side only — client cannot supply score inputs directly',
    'Formula weights stored in Firestore must have field-level access control — only partner_admin can modify',
    'Score history must be append-only — no deletion or modification allowed',
    'Each score computation must log the exact formula version used for auditability',
    'Score read access must require active org membership for the battery\'s owner organisation',
  ],

  useCases: [
    'UC-001: Mission controller triggers score computation before battery assignment — system returns composite score and readiness band',
    'UC-002: Score drops below 75 due to telemetry anomaly — system flags "Ready with Caution" and lists affected dimension',
    'UC-003: Firmware hash mismatch detected — hard-fail gate fires, score overridden to 0, battery GROUNDED',
    'UC-004: Partner admin adjusts Safety weight to 25% — system validates weights sum to 1.0 and saves',
    'UC-005: Fleet manager reviews score history — system returns last 30 computations with timestamps and delta trends',
  ],

  negativeUseCases: [
    'NC-001: Client submits score override via API — system rejects; scores are computed server-side only',
    'NC-002: Custom formula weights sum to 1.05 — system rejects with validation error',
    'NC-003: Request to delete score history record — system returns 403; history is append-only',
    'NC-004: Score computation requested for quarantined battery — system returns GROUNDED with quarantine hard-fail active',
    'NC-005: Score requested for battery with no telemetry data — system returns partial score with Telemetry dimension at 0',
  ],

  securityTestCases: [
    'SEC-001: Attempt to POST a crafted score result to Firestore directly — verify security rule blocks it',
    'SEC-002: Attempt to modify formula weights without partner_admin role — verify 403 rejection',
    'SEC-003: Trigger score computation with tampered btid — verify identity verification catches mismatch',
    'SEC-004: Submit score history delete request — verify 403 and audit log entry',
    'SEC-005: Verify that formula version is logged correctly for every computation',
  ],

  acceptanceCriteria: [
    'Composite score formula applies correct weights and produces correct result for known test inputs',
    'Hard-fail gate logic overrides score to 0 when any gate condition is true',
    'Score is persisted to history collection after every computation',
    'Readiness band label is correct for all five score ranges',
    'Per-dimension score breakdown is returned and displayed correctly',
    'Custom formula weights are validated to sum to 1.0 before saving',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-002 and confirm page renders',
    'Verify score formula table shows all 7 dimensions with correct weights summing to 100%',
    'Verify readiness bands table shows all 5 bands with correct score ranges',
    'Confirm hard-fail gates list is complete and matches specification',
    'Check all story tabs render: Overview, Requirements, Architecture, Use Cases, Test Cases, Security Tests, Verification, Demo Evidence',
  ],

  demoEvidenceRequired: [
    'Screenshot of the composite score gauge UI with sample score of 82 (Ready with Caution)',
    'Screenshot of per-dimension score bars with weights',
    'Screenshot of hard-fail gate triggered state — score at 0, GROUNDED banner',
    'Firestore schema screenshot for batteryTrustScores collection',
    'Formula weight configuration UI screenshot',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-002 is protected and accessible only to authorised users',
    'Story appears in WP-001 story list with correct status (planned) and priority (critical)',
  ],
}
