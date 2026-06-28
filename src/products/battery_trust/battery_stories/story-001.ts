import type { BatteryStory } from './storyCatalogue'

export const STORY_001: BatteryStory = {
  id:               'BT-S001',
  title:            'Battery Trust Identity Model',
  status:           'planned',
  priority:         'critical',
  storyPoints:      8,
  missionRelevance: 'A battery with an unknown or unverified identity cannot be trusted for any aerospace mission. Identity is the foundation of every other trust signal.',
  owner:            'Engineering Lead (TBD)',

  businessGoal:
    'Establish a unique, verifiable digital identity for every battery entering the aerospace supply chain so that identity trust can be scored, audited, and tracked across its operational lifetime.',

  problemStatement:
    'Aerospace battery fleets have no standardised digital identity layer. Batteries are identified by paper labels, spreadsheets, or proprietary BMS internal IDs. This creates spoofing risk, chain-of-custody gaps, and makes automated trust scoring impossible.',

  userPersona:
    'Battery Fleet Manager at an aerospace OEM managing 50–500 mission-critical battery packs across multiple programmes.',

  userStory:
    'As a Battery Fleet Manager, I want every battery to have a unique, cryptographically-anchored identity so that I can verify whether the battery installed in my UAV or spacecraft is the exact cell I approved for mission use.',

  functionalRequirements: [
    'Generate a UUID v4 as the canonical Battery Trust ID (BTID) on first registration',
    'Store manufacturer name, model number, chemistry type (LiPo, Li-Ion, LiFePO4, NiMH, solid-state)',
    'Store nominal voltage, capacity (Ah), cell count, and pack configuration (series/parallel)',
    'Store manufacturer serial number and batch/lot number',
    'Store manufacture date and first activation date',
    'Capture an X.509 certificate fingerprint or TPM-bound identity token if available',
    'Compute and store a SHA-256 identity hash over the core identity fields',
    'Support identity status: active, suspect, quarantined, retired',
    'Allow identity fields to be locked (read-only) after first mission use',
  ],

  nonFunctionalRequirements: [
    'Identity hash must be computed deterministically — same inputs always produce same hash',
    'BTID must be globally unique — collision probability < 1 in 10^18',
    'Identity record must be immutable after lock — no field updates except status',
    'All identity reads must be audit-logged with requester, timestamp, and purpose',
    'Identity lookup latency < 200ms at p99',
  ],

  uiRequirements: [
    'Battery Identity Card: show BTID, manufacturer, model, chemistry, serial, capacity, status badge',
    'Identity status badge: Active (green), Suspect (amber), Quarantined (red), Retired (grey)',
    'Certificate fingerprint display: truncated hex with copy-to-clipboard',
    'Identity hash display: first 16 chars + copy icon',
    'Lock indicator: padlock icon when identity is immutable',
    'Identity registration form with field validation and confirmation step',
  ],

  backendRequirements: [
    'Firestore collection: batteryIdentities/{btid}',
    'Cloud Function: registerBatteryIdentity — validates, computes hash, writes record',
    'Cloud Function: lockBatteryIdentity — transitions to immutable state',
    'Cloud Function: getBatteryIdentity — returns identity with audit log entry',
    'Firestore security rules: only authenticated partner users can read; only admins can write',
  ],

  dataModel: [
    'btid: string (UUID v4)',
    'manufacturer: string',
    'modelNumber: string',
    'chemistry: "LiPo" | "Li-Ion" | "LiFePO4" | "NiMH" | "SolidState"',
    'nominalVoltageV: number',
    'capacityAh: number',
    'cellCount: number',
    'packConfig: string (e.g. "4S2P")',
    'serialNumber: string',
    'batchLotNumber: string',
    'manufactureDate: ISO string',
    'firstActivationDate: ISO string | null',
    'certificateFingerprint: string | null',
    'identityHash: string (SHA-256 hex)',
    'identityStatus: "active" | "suspect" | "quarantined" | "retired"',
    'isLocked: boolean',
    'registeredBy: string (email)',
    'registeredAt: Timestamp',
    'updatedAt: Timestamp',
  ],

  securityRequirements: [
    'Identity hash must include a per-instance salt to prevent rainbow table attacks',
    'Certificate fingerprint must be validated against a trusted CA chain before storage',
    'Identity record writes must require partner-admin or above role',
    'Identity status changes to quarantined must trigger an immediate alert to the fleet manager',
    'All identity fields must be encrypted at rest in Firestore using field-level encryption',
  ],

  useCases: [
    'UC-001: Engineer registers a new battery pack — system generates BTID and computes identity hash',
    'UC-002: Battery reaches first mission assignment — identity is locked by fleet manager',
    'UC-003: Mission controller queries identity before mission — system returns identity card with trust status',
    'UC-004: Battery returned from mission — identity record updated with last-mission timestamp',
    'UC-005: Suspicious battery detected — fleet manager sets status to "suspect" — system generates alert',
  ],

  negativeUseCases: [
    'NC-001: Attempt to register battery with duplicate serial number — system rejects with conflict error',
    'NC-002: Attempt to modify locked identity fields — system returns 403 Forbidden',
    'NC-003: Unauthenticated request to read identity — system returns 401 Unauthorized',
    'NC-004: Identity hash computed with wrong field order — system detects mismatch and flags as suspect',
    'NC-005: Certificate fingerprint from expired CA — system rejects and flags identity as unverified',
  ],

  securityTestCases: [
    'SEC-001: Submit duplicate BTID — verify system rejects and returns conflict error',
    'SEC-002: Attempt identity write without auth token — verify 401 response',
    'SEC-003: Attempt to modify locked record via direct Firestore write — verify security rule blocks it',
    'SEC-004: Submit certificate fingerprint with invalid encoding — verify rejection and audit log entry',
    'SEC-005: Replay old identity registration request — verify idempotency check prevents duplicate',
  ],

  acceptanceCriteria: [
    'Battery identity can be registered with all required fields via the registration form',
    'BTID is unique (UUID v4) and computed server-side — cannot be supplied by client',
    'Identity hash changes if any core field changes before locking',
    'Identity cannot be modified after locking — API returns error on attempt',
    'Identity status badge renders correctly for all four states',
    'Audit log entry is created for every identity read and write',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-001 and confirm page renders without errors',
    'Verify all story sections render: Overview, Requirements, Architecture, Use Cases, Test Cases, Security Tests, Verification, Demo Evidence',
    'Confirm story ID (BT-S001), title, priority badge, and status badge are correct',
    'Confirm Back to Work Package link navigates to /battery-trust/wp-001',
    'Confirm page layout uses deep navy/dark aerospace theme',
  ],

  demoEvidenceRequired: [
    'Screenshot of the Battery Identity Card UI mockup',
    'Screenshot of the identity registration form with validation errors shown',
    'Screenshot of identity hash and certificate fingerprint display',
    'Screenshot showing "locked" identity with padlock indicator',
    'Firestore data model diagram showing batteryIdentities collection schema',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-001 is protected and accessible only to authorised users',
    'Story appears correctly in WP-001 story list with correct status and priority',
  ],
}
