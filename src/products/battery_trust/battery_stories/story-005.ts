import type { BatteryStory } from './storyCatalogue'

export const STORY_005: BatteryStory = {
  id:               'BT-S005',
  title:            'Cyber Attack Simulation',
  status:           'planned',
  priority:         'high',
  storyPoints:      13,
  missionRelevance: 'Cybersecurity risk is 15% of the trust score and carries two hard-fail gates: replay attack detected and spoofed telemetry detected. Understanding attack vectors is critical to building effective defences.',
  owner:            'Cybersecurity Engineer (TBD)',

  businessGoal:
    'Simulate the five most critical cyber attack vectors against aerospace battery management systems so that defenders can understand attack mechanics, validate detection logic, and demonstrate the trust score impact of a successful attack.',

  problemStatement:
    'Battery management systems in aerospace platforms are increasingly networked and exposed to cyber threats. Most OEMs have no structured way to test their BMS cybersecurity defences or understand how a successful attack would affect mission readiness decisions.',

  userPersona:
    'Penetration Tester or Red Team Engineer performing an authorised cyber assessment of an aerospace BMS installation.',

  userStory:
    'As a Penetration Tester, I want a structured set of BMS attack simulations so that I can demonstrate the trust score impact of each attack vector and validate that detection rules correctly identify and flag each attack type.',

  functionalRequirements: [
    'Attack A-01 — Replay Attack: re-transmit a captured valid MQTT packet to bypass freshness checks',
    'Attack A-02 — Telemetry Spoofing: inject fabricated telemetry with physically implausible values to mask battery degradation',
    'Attack A-03 — Certificate Forgery: substitute a self-signed certificate for the manufacturer certificate to impersonate a trusted battery',
    'Attack A-04 — Firmware Injection: replace the BMS firmware hash to simulate unauthorised firmware installation',
    'Attack A-05 — BMS Intrusion: simulate unauthorised BMS access by injecting a cyber event log entry with "intrusion_detected" type',
    'For each attack: document the attack vector, required access level, detection rule(s) triggered, trust score impact, and recommended countermeasure',
    'Attack simulations must be runnable via the simulator (Story BT-S003) without requiring real hardware',
    'Each attack must produce an observable signal in the trust score and/or violation log',
  ],

  nonFunctionalRequirements: [
    'All attack simulations must run in isolated simulator mode — no production data is affected',
    'Attack simulation activation must require developer or partner_admin role',
    'Each attack simulation must complete in < 2 seconds',
    'Simulation runs must be audit-logged with activating user and timestamp',
    'Simulation must clearly label all generated data as SIMULATED',
  ],

  uiRequirements: [
    'Attack simulation panel: list of 5 attacks with Launch button per attack',
    'Attack detail card: vector description, access level required, detection rule triggered, trust score impact',
    'Attack active banner: RED banner "ATTACK SIMULATION ACTIVE — [Attack Name]" during simulation',
    'Trust score live update: score drops in real-time as attack fires',
    'Detection event feed: list of triggered detection rules with timestamp',
    'Attack debrief panel: post-attack summary showing what was detected and what was missed',
  ],

  backendRequirements: [
    'AttackSimulator: TypeScript class with one simulate() method per attack',
    'simulateReplayAttack(btid): injects stale packet, expects R-01 rule to fire',
    'simulateTelemetrySpoofing(btid): injects out-of-bounds telemetry, expects R-05/R-08 to fire',
    'simulateCertificateForgery(btid): sets certificateValid=false on identity, expects identity score to drop',
    'simulateFirmwareInjection(btid): sets firmwareHashValid=false, expects firmware hard-fail to activate',
    'simulateBmsIntrusion(btid): injects CyberEvent with type="intrusion_detected"',
    'All simulators operate in-memory only — no Firestore writes to production collections',
  ],

  dataModel: [
    'AttackType: "replay" | "spoofing" | "certificate_forgery" | "firmware_injection" | "bms_intrusion"',
    'AttackSimulationResult: { attackType, launchedAt, detectionEvents: DetectionEvent[], scoreImpact: number, hardFailTriggered: boolean }',
    'DetectionEvent: { ruleId, ruleName, detectedAt, severity, details }',
    'CyberEvent: { btid, eventType, severity, detectedAt, source, description }',
  ],

  securityRequirements: [
    'Attack simulation feature must be completely disabled in production org environments — only available in developer and demo environments',
    'Simulation data must never be written to production Firestore batteryIdentities or telemetryViolations collections',
    'Simulation activation requires explicit developer or partner_admin role — regular engineers cannot activate',
    'All simulation events must be tagged with { simulated: true } in every data record',
    'Simulation sessions must auto-expire after 30 minutes to prevent accidental leaving-on',
  ],

  useCases: [
    'UC-001: Security engineer launches replay attack — R-01 fires within 2s, hard-fail gate "Replay attack detected" activates, score drops to 0',
    'UC-002: Security engineer launches telemetry spoofing — voltage reported as 100V on 4S pack, R-05 fires as Critical, Telemetry score drops to 0',
    'UC-003: Security engineer launches certificate forgery — identity certificate marked invalid, identity score drops 60 points, score enters "Not Ready" band',
    'UC-004: Security engineer launches firmware injection — firmware hash mismatch, hard-fail gate "Firmware hash mismatch" activates, battery GROUNDED',
    'UC-005: Security engineer launches BMS intrusion — cyber incident logged, Cybersecurity Risk score drops to 0, hard-fail "Open critical cyber incident" activates',
  ],

  negativeUseCases: [
    'NC-001: Regular engineer attempts to activate attack simulation — blocked, role check fails',
    'NC-002: Attack simulation runs longer than 30 minutes — auto-expires, system returns to normal simulator mode',
    'NC-003: Attacker attempts to use simulation endpoint in production — feature flag blocks it',
    'NC-004: Attack produces detection event but score does not drop — test fails; attack simulation is only valid if score impact is observed',
  ],

  securityTestCases: [
    'SEC-001: Verify replay attack fires R-01 and hard-fail "Replay attack detected" activates',
    'SEC-002: Verify telemetry spoofing fires R-05 and Telemetry score drops to 0',
    'SEC-003: Verify certificate forgery drops identity score and identity trust enters yellow band',
    'SEC-004: Verify firmware injection fires firmware hard-fail gate and battery is GROUNDED',
    'SEC-005: Verify BMS intrusion fires "Open critical cyber incident" hard-fail gate',
    'SEC-006: Verify non-admin cannot activate attack simulation',
    'SEC-007: Verify simulation data never appears in production Firestore collections',
  ],

  acceptanceCriteria: [
    'All 5 attacks are individually simulatable from the simulator panel',
    'Each attack triggers the expected detection rule(s)',
    'Replay and firmware attacks trigger hard-fail gates',
    'Trust score updates in real-time during simulation',
    'Simulation is blocked in production org environments',
    'Simulation data is tagged { simulated: true } in all records',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-005 and confirm page renders',
    'Verify all 5 attack types are listed with descriptions',
    'Confirm hard-fail gates for replay and firmware are listed in Security Requirements',
    'Check negative use cases cover production org blocking and role check',
    'Verify security test cases include verification that simulation data stays out of production',
  ],

  demoEvidenceRequired: [
    'Screenshot of attack simulation panel with 5 attacks listed',
    'Screenshot of score at 0 with "Replay attack detected" hard-fail gate active',
    'Screenshot of "ATTACK SIMULATION ACTIVE" red banner',
    'Screenshot of detection event feed showing fired rules',
    'Attack debrief screenshot showing what was detected vs what could have been missed',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-005 is protected',
    'Story appears in WP-001 with correct status and priority',
  ],
}
