import type { BatteryStory } from './storyCatalogue'

export const STORY_010: BatteryStory = {
  id:               'BT-S010',
  title:            'Manual Verification & Demo Evidence',
  status:           'planned',
  priority:         'medium',
  storyPoints:      3,
  missionRelevance: 'All Battery Trust Platform stories require manual verification evidence before they are considered Done. This story defines the verification framework and evidence standards for the entire WP-001 work package.',
  owner:            'QA Lead (TBD)',

  businessGoal:
    'Define and document the complete manual verification framework and demo evidence standards for all 10 Battery Trust Platform stories so that every story can be independently verified as Done by a reviewer without requiring the original developer.',

  problemStatement:
    'Without a structured verification framework, "Done" means different things to different engineers. Stories can be considered complete when the UI renders but before backend logic, security requirements, or negative use cases are validated. This creates undetected gaps that surface in production.',

  userPersona:
    'QA Lead or Technical Reviewer performing acceptance verification of Battery Trust Platform stories before sprint close.',

  userStory:
    'As a QA Lead, I want a complete manual verification checklist and demo evidence standard for every Battery Trust story so that I can independently verify each story as Done using repeatable, documented steps without developer assistance.',

  functionalRequirements: [
    'Define per-story manual verification steps: ordered checklist of 5+ steps per story',
    'Define demo evidence standard: what screenshots, recordings, or data exports constitute evidence',
    'Define evidence naming convention: {storyId}_{evidenceType}_{timestamp}.{ext}',
    'Define acceptance checklist: universal checklist items that apply to every story',
    'Define security verification checklist: security test cases to be verified per story',
    'Define accessibility checklist: keyboard navigation, ARIA labels, colour contrast',
    'Define performance verification: page load, animation smoothness, response times',
    'Create evidence storage location: Google Drive folder structure or Firebase Storage path',
    'Define "Ready for Review" criteria: all verification steps completed, evidence uploaded, no open defects',
    'Define "Definition of Done" for WP-001: all 10 stories Done, integration tested, demo evidence complete',
  ],

  nonFunctionalRequirements: [
    'Verification checklist must be completable in under 30 minutes per story',
    'Demo evidence screenshots must be at 1920×1080 minimum resolution',
    'Evidence archive must be accessible to all team members and the partner stakeholder',
    'Verification results must be recorded in a shared tracking document',
    'Definition of Done for WP-001 requires sign-off from: Engineering Lead, Safety Officer, QA Lead',
  ],

  uiRequirements: [
    'Verification section on story detail page: ordered numbered checklist with checkboxes',
    'Demo Evidence section: grid of evidence cards with type icon and description',
    'Story status badge: updates to "review" when verification submitted, "done" when approved',
    'Evidence upload placeholder: drag-drop zone with evidence naming convention displayed',
    'Sign-off panel: three sign-off fields for Engineering Lead, Safety Officer, QA Lead',
  ],

  backendRequirements: [
    'No new backend required for Phase 1 — static content only',
    'Future: Cloud Function: submitVerificationResult(storyId, results, submittedBy)',
    'Future: Firestore collection: storyVerifications/{storyId}/results/{timestamp}',
    'Future: Notification to QA Lead when verification submitted',
  ],

  dataModel: [
    'VerificationResult: { storyId, steps: VerificationStep[], submittedBy, submittedAt, status: "submitted"|"approved"|"rejected" }',
    'VerificationStep: { stepId, description, passed: boolean, notes: string, evidenceRef: string | null }',
    'StorySignOff: { storyId, engineeringLead: SignOff | null, safetyOfficer: SignOff | null, qaLead: SignOff | null }',
    'SignOff: { name, email, signedAt, comment }',
  ],

  securityRequirements: [
    'Verification results must be submitted by a team member with at least "engineer" role',
    'Sign-off must be performed by a team member with "manager" or "owner" role',
    'Evidence files must be stored with access control — not publicly accessible',
    'Verification history must be append-only — past results cannot be modified',
  ],

  useCases: [
    'UC-001: QA Lead opens BT-S001 story page, works through 5 verification steps, marks all passed',
    'UC-002: QA Lead uploads 5 screenshots as demo evidence, named per convention',
    'UC-003: Engineering Lead reviews submitted verification, signs off story as Done',
    'UC-004: Safety Officer reviews BT-S006 safety verification specifically, provides safety sign-off',
    'UC-005: Stakeholder reviews WP-001 completion: all 10 stories Done, all sign-offs present, evidence archive complete',
  ],

  negativeUseCases: [
    'NC-001: QA Lead submits verification with 2 of 5 steps marked as failed — story status remains "in_review", not moved to Done',
    'NC-002: Developer signs off own story — system requires a different team member for sign-off (conflict of interest check)',
    'NC-003: Verification submitted without evidence uploads — system warns that evidence is missing but allows submission',
    'NC-004: Story marked Done before all 3 sign-offs are collected — system blocks Done status until all sign-offs present',
  ],

  securityTestCases: [
    'SEC-001: Attempt to submit verification without engineer role — verify 403 rejection',
    'SEC-002: Attempt to sign off own story — verify conflict-of-interest check blocks it',
    'SEC-003: Attempt to modify past verification result — verify Firestore security rule blocks it',
    'SEC-004: Access evidence files without authentication — verify 401 rejection from Storage',
  ],

  acceptanceCriteria: [
    'All 10 stories have verification steps defined (5+ per story)',
    'All 10 stories have demo evidence requirements defined',
    'Evidence naming convention is documented and consistent across all stories',
    'Universal acceptance checklist is defined and applicable to every story',
    'WP-001 Definition of Done is documented and requires sign-offs from 3 roles',
    'Story status lifecycle: planned → in_progress → review → done is documented',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-010 and confirm page renders',
    'Verify evidence naming convention is documented in the story content',
    'Confirm WP-001 Definition of Done section lists all 3 required sign-off roles',
    'Check that all 10 story IDs (BT-S001 through BT-S010) appear in the functional requirements',
    'Verify negative use cases cover failed verification submission and conflict-of-interest sign-off',
    'Open each of the 10 story routes and verify they all render without errors',
    'Confirm all 10 stories appear in the WP-001 story list with correct IDs and titles',
    'Verify /battery-trust dashboard shows WP-001 card linking to /battery-trust/wp-001',
    'Confirm users without battery_trust access cannot reach /battery-trust',
    'Run npm run build and verify zero errors and zero warnings',
  ],

  demoEvidenceRequired: [
    'Screenshot of all 10 story cards in WP-001 page with story IDs and status badges',
    'Screenshot of story verification checklist section on BT-S010 story page',
    'Screenshot of Battery Trust Dashboard page (/battery-trust)',
    'Screenshot of WP-001 page with score model and hard-fail gates visible',
    'Screenshot of access denied page for user without battery_trust access',
    'Screenshot of npm run build terminal output showing 0 errors',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'All 10 story routes are protected and accessible only to authorised users',
    'All 10 stories appear in WP-001 with correct IDs, titles, status, and priority',
    'Battery Trust Dashboard shows WP-001 card',
    'Access denied page shown for unauthorised users',
    'npm run build: 0 errors, 0 warnings',
    'Engineering Lead, Safety Officer, and QA Lead sign-off collected',
  ],
}
