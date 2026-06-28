import type { BatteryStory } from './storyCatalogue'

export const STORY_007: BatteryStory = {
  id:               'BT-S007',
  title:            'Mission Readiness Decision Engine',
  status:           'planned',
  priority:         'critical',
  storyPoints:      13,
  missionRelevance: 'The decision engine is the final arbiter of GO/NO-GO for every battery assignment. It synthesises the trust score with hard-fail gate logic to produce a defensible, audited mission readiness verdict.',
  owner:            'Engineering Lead (TBD)',

  businessGoal:
    'Build the Mission Readiness Decision Engine that takes the composite trust score, evaluates all hard-fail gates, applies mission-specific context, and produces a final GO/NO-GO verdict with a full audit trail and justification record.',

  problemStatement:
    'Trust scoring produces a number, but mission readiness requires a decision. There is currently no standardised, auditable process to convert a composite trust score into a documented GO/NO-GO verdict with mission-specific context, responsible authority sign-off, and a permanent audit trail.',

  userPersona:
    'Mission Safety Officer with authority to approve or reject battery assignments for aerospace missions.',

  userStory:
    'As a Mission Safety Officer, I want a decision engine that produces a GO/NO-GO verdict from the composite trust score with hard-fail gate evaluation, mission context, and a signature-ready audit record so that every battery assignment decision is documented, defensible, and traceable.',

  functionalRequirements: [
    'Accept: composite trust score, per-dimension scores, active hard-fail gates, mission context (mission type, duration, criticality)',
    'Apply mission context modifiers: high-criticality missions may require minimum score of 85 instead of 75',
    'Evaluate all 11 hard-fail gates: any active gate forces NO-GO regardless of score',
    'Produce verdict: GO | GO_WITH_CONDITIONS | NO-GO | GROUNDED',
    'GO_WITH_CONDITIONS: score 75–84 with no hard-fails; conditions listed must be acknowledged by safety officer',
    'Generate verdict justification: human-readable explanation of each factor contributing to the verdict',
    'Generate verdict audit record: signed record with btid, missionId, score, verdict, gates evaluated, justification, decidedBy, decidedAt',
    'Support manual override: safety officer can override NO-GO to GO_WITH_CONDITIONS with mandatory justification text',
    'Override must require two-factor acknowledgement: confirm text entry + explicit sign-off checkbox',
    'Retain full decision history: every verdict and override for every battery permanently',
  ],

  nonFunctionalRequirements: [
    'Verdict computation must complete in < 500ms',
    'Verdict record must be immutable after creation — no modification, only new records',
    'Override decisions must be clearly marked in all displays and reports',
    'Decision history must be exportable for regulatory audit',
    'Verdicts must be consistent — same inputs always produce same verdict (deterministic)',
  ],

  uiRequirements: [
    'Mission Readiness Panel: large GO (green) or NO-GO (red) verdict chip with supporting score and band',
    'Hard-fail gate checklist: list of all 11 gates with pass (green check) or fail (red X) status',
    'Mission context card: mission type, criticality level, minimum score requirement',
    'Verdict justification accordion: expandable human-readable explanation',
    'Conditions panel (for GO_WITH_CONDITIONS): list of conditions that must be acknowledged',
    'Override panel: text input + checkbox for safety officer override with mandatory justification',
    'Decision history timeline: chronological list of past verdicts for this battery',
    'Print / Export Audit Record button: generates printable verdict PDF',
  ],

  backendRequirements: [
    'MissionReadinessEngine: TypeScript class with decide(trustScore, missionContext) method',
    'decide() returns: ReadinessVerdict { verdict, score, hardFailsActive, conditions, justification, formulaVersion }',
    'Cloud Function: recordMissionVerdict(btid, missionId, verdict, decidedBy) — persists verdict',
    'Cloud Function: overrideMissionVerdict(btid, verdictId, justification, overriddenBy) — records override',
    'Firestore collection: missionVerdicts/{btid}/history/{timestamp}',
    'Firestore security rules: verdicts are append-only; only safety officers can record; no updates or deletes',
  ],

  dataModel: [
    'MissionContext: { missionId, missionType: "test"|"training"|"operational"|"critical", durationHours, criticalityLevel: "standard"|"high"|"critical" }',
    'ReadinessVerdict: { verdictId, btid, missionId, verdict: "GO"|"GO_WITH_CONDITIONS"|"NO_GO"|"GROUNDED", compositeScore, hardFailsActive, conditions, justification, formulaVersion, decidedBy, decidedAt, isOverride, overrideJustification }',
    'VerdictThresholds: { standard: 75, high: 80, critical: 85 } — minimum score by criticality level',
  ],

  securityRequirements: [
    'Verdict records are append-only — Firestore security rules must block all updates and deletes',
    'Only users with organisationRole "owner" or "manager" can record verdicts',
    'Override verdicts must include mandatory justification text >= 50 characters',
    'Override verdicts must be distinguished from normal verdicts in all display and export contexts',
    'Verdict export must include a document hash to detect tampering post-export',
  ],

  useCases: [
    'UC-001: Battery scores 92 (Mission Ready), no hard-fails, standard mission — verdict GO',
    'UC-002: Battery scores 78 (Ready with Caution), no hard-fails, standard mission — verdict GO_WITH_CONDITIONS with listed conditions',
    'UC-003: Battery scores 85 but replay attack hard-fail is active — verdict GROUNDED regardless of score',
    'UC-004: Battery scores 82, high-criticality mission, minimum 85 required — verdict NO-GO due to mission context modifier',
    'UC-005: Safety officer overrides NO-GO with justification — OVERRIDE_GO verdict recorded alongside original NO-GO',
  ],

  negativeUseCases: [
    'NC-001: Engineer (not safety officer) attempts to record verdict — 403 rejected; role check fails',
    'NC-002: Override submitted with 10-character justification — rejected; minimum 50 characters required',
    'NC-003: Attempt to update an existing verdict record — Firestore security rule blocks modification',
    'NC-004: Verdict PDF export hash does not match recomputed hash — tampering detected, export flagged as invalid',
  ],

  securityTestCases: [
    'SEC-001: Attempt verdict record without safety officer role — verify 403 rejection',
    'SEC-002: Attempt to update existing verdict document in Firestore — verify security rule blocks it',
    'SEC-003: Submit override with justification < 50 chars — verify rejection with field validation error',
    'SEC-004: Verify override verdict is visually distinguished from normal verdict in history timeline',
    'SEC-005: Export verdict PDF and verify document hash is present and correct',
  ],

  acceptanceCriteria: [
    'Decision engine produces correct verdict for all four verdict types based on score and gates',
    'Hard-fail gate forces GROUNDED verdict regardless of composite score',
    'Mission context modifier raises minimum score for high/critical missions',
    'Verdict audit record is persisted and immutable',
    'Override verdict records mandatory justification and is distinguished from standard verdicts',
    'Decision history shows all past verdicts for a battery in chronological order',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-007 and confirm page renders',
    'Verify all 4 verdict types are documented: GO, GO_WITH_CONDITIONS, NO-GO, GROUNDED',
    'Confirm hard-fail gate table lists all 11 gates from the specification',
    'Check mission context modifiers table shows minimum scores by criticality level',
    'Verify security requirements mention append-only verdict records',
  ],

  demoEvidenceRequired: [
    'Screenshot of Mission Readiness Panel showing GO verdict (score 92)',
    'Screenshot of GO_WITH_CONDITIONS verdict with conditions list',
    'Screenshot of GROUNDED verdict with replay attack hard-fail active',
    'Screenshot of override panel with justification field',
    'Screenshot of decision history timeline showing 3 verdicts',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-007 is protected',
    'Story appears in WP-001 with correct status (planned) and priority (critical)',
  ],
}
