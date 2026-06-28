import type { BatteryStory } from './storyCatalogue'

export const STORY_004: BatteryStory = {
  id:               'BT-S004',
  title:            'MQTT Telemetry Validation Rules',
  status:           'planned',
  priority:         'high',
  storyPoints:      8,
  missionRelevance: 'Telemetry integrity is 15% of the trust score. Unvalidated telemetry allows spoofed or replayed data to inflate the safety signal, creating false mission readiness.',
  owner:            'Engineering Lead (TBD)',

  businessGoal:
    'Define and implement a comprehensive set of MQTT telemetry validation rules that detect spoofed, replayed, stale, or tampered telemetry packets before they are accepted into the trust scoring pipeline.',

  problemStatement:
    'MQTT is the dominant IoT protocol for battery management systems, but it provides no built-in message authentication or freshness guarantee. Without validation rules, a compromised BMS or man-in-the-middle can inject false telemetry that makes a degraded or unsafe battery appear healthy.',

  userPersona:
    'Cybersecurity Engineer at an aerospace OEM responsible for securing the BMS telemetry pipeline.',

  userStory:
    'As a Cybersecurity Engineer, I want a set of MQTT telemetry validation rules that reject or flag any packet that fails freshness, sequence, bounds, or authentication checks so that spoofed or replayed telemetry cannot influence the mission trust score.',

  functionalRequirements: [
    'Rule R-01 — Timestamp Freshness: reject packets with timestamp older than configurable threshold (default 60s)',
    'Rule R-02 — Timestamp Future Check: reject packets with timestamp more than 5s in the future (clock skew tolerance)',
    'Rule R-03 — Sequence Number Check: reject or flag packets where sequence number is not strictly incrementing',
    'Rule R-04 — Message Authentication Code: reject packets with invalid or missing HMAC-SHA256 MAC',
    'Rule R-05 — Voltage Bounds: flag packets where cell voltage is outside configurable chemistry bounds',
    'Rule R-06 — Current Bounds: flag packets where current exceeds configurable charge/discharge limits',
    'Rule R-07 — Temperature Bounds: flag packets where temperature exceeds configurable operating range',
    'Rule R-08 — SOC Plausibility: flag packets where SOC jumps more than 20% between consecutive readings',
    'Rule R-09 — Packet Rate Check: flag if packet rate drops below minimum or exceeds maximum threshold',
    'Rule R-10 — Duplicate Detection: reject exact duplicate packets (same sequence number and payload)',
    'Log every rule violation with: packet ID, rule ID, violation type, severity, and timestamp',
  ],

  nonFunctionalRequirements: [
    'Validation pipeline must process each packet in < 10ms',
    'Validation rules must be configurable per battery chemistry without code changes',
    'Rule violations must be stored in append-only audit log — no deletion',
    'Validation service must handle 1000 packets/second sustained throughput',
    'Rule configuration changes must be versioned and audit-logged',
  ],

  uiRequirements: [
    'Telemetry Validation Dashboard: live feed of recent packets with pass/fail status per rule',
    'Violation list: scrollable list of recent violations with rule ID, battery, severity, and timestamp',
    'Rule configuration panel: form to adjust thresholds per chemistry type',
    'Violation severity badges: Critical (red), Warning (amber), Info (blue)',
    'Telemetry health score card: ratio of valid packets over last 100 received',
    'Rule status grid: one cell per rule showing last check result (Pass/Fail/Not Checked)',
  ],

  backendRequirements: [
    'Cloud Function: validateMqttPacket(packet, btid) — runs all rules and returns validation result',
    'Cloud Function: getTelemetryViolations(btid, since) — returns violation history',
    'Firestore collection: telemetryViolations/{btid}/events/{timestamp}',
    'Firestore document: telemetryRuleConfig/{btid} — per-battery rule thresholds',
    'HMAC key management: per-battery HMAC keys stored in Secret Manager',
  ],

  dataModel: [
    'MqttPacket: { packetId, btid, timestamp, sequenceNumber, mac, voltageV, currentA, temperatureC, socPct, cellVoltages: number[], rawPayload: string }',
    'ValidationResult: { packetId, btid, isValid, violations: RuleViolation[], validatedAt: Timestamp }',
    'RuleViolation: { ruleId, ruleName, severity: "critical"|"warning"|"info", description, value, threshold }',
    'TelemetryRuleConfig: { btid, chemistry, voltageMinV, voltageMaxV, currentMaxA, tempMinC, tempMaxC, freshnessThresholdSec, maxSocJumpPct }',
  ],

  securityRequirements: [
    'HMAC keys must be stored in Secret Manager — never in Firestore or environment variables',
    'HMAC key rotation must be supported without breaking in-flight packets (dual-key grace period)',
    'Packet validation must run server-side — client cannot mark packets as valid',
    'Rule violation log must be immutable — no delete or update operations',
    'Threshold configuration changes require partner_admin role and generate an audit event',
  ],

  useCases: [
    'UC-001: BMS sends valid packet with correct MAC and fresh timestamp — passes all rules, accepted',
    'UC-002: Attacker replays packet from 10 minutes ago — R-01 timestamp freshness rule rejects it',
    'UC-003: BMS sends packet with invalid HMAC (key mismatch) — R-04 MAC rule rejects it, violation logged as Critical',
    'UC-004: SOC jumps from 80% to 20% in one packet — R-08 SOC plausibility flags it as Warning',
    'UC-005: Security engineer reviews violation log — sees list of last 50 violations sorted by severity',
  ],

  negativeUseCases: [
    'NC-001: Attacker sends packet with future timestamp (2 hours ahead) — R-02 rejects it',
    'NC-002: Attacker sends same packet 1000 times — R-10 duplicate detection rejects after first',
    'NC-003: Client attempts to post pre-validated packet directly — server revalidates regardless of client claim',
    'NC-004: Rule config update sets voltage max to 0 — system rejects invalid threshold with validation error',
  ],

  securityTestCases: [
    'SEC-001: Send packet with timestamp 120s old — verify R-01 fires and rejects',
    'SEC-002: Send packet with invalid HMAC — verify R-04 fires and logs Critical violation',
    'SEC-003: Send identical packet twice — verify R-10 deduplication fires on second occurrence',
    'SEC-004: Send SOC jump from 90% to 10% in one packet — verify R-08 fires as Warning',
    'SEC-005: Attempt to delete a violation log entry — verify Firestore security rule blocks it',
  ],

  acceptanceCriteria: [
    'All 10 validation rules are implemented and individually testable',
    'Rule violations are stored in Firestore with correct fields',
    'Invalid MAC causes Critical violation and packet rejection',
    'Stale timestamp (>60s) causes packet rejection with R-01 violation',
    'Duplicate packet is rejected with R-10 violation',
    'Rule configuration is per-battery and per-chemistry',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-004 and confirm page renders',
    'Verify 10 validation rules are listed with IDs R-01 through R-10',
    'Confirm security requirements section mentions HMAC keys in Secret Manager',
    'Check negative use cases section covers replay attack and future timestamp',
    'Verify back navigation to WP-001 works',
  ],

  demoEvidenceRequired: [
    'Screenshot of telemetry validation dashboard with mixed pass/fail packet list',
    'Screenshot of Critical violation for invalid HMAC (R-04)',
    'Screenshot of violation log with severity badges',
    'Screenshot of rule configuration panel for LiPo chemistry',
    'Sequence diagram showing MQTT packet validation flow',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-004 is protected',
    'Story appears in WP-001 with correct status and priority',
  ],
}
