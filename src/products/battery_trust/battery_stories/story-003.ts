import type { BatteryStory } from './storyCatalogue'

export const STORY_003: BatteryStory = {
  id:               'BT-S003',
  title:            'Battery Simulator with Trust Inputs',
  status:           'planned',
  priority:         'high',
  storyPoints:      8,
  missionRelevance: 'Without a realistic battery simulator, the trust score engine cannot be tested or demonstrated without live hardware. The simulator enables safe, repeatable testing of all trust scoring scenarios.',
  owner:            'Engineering Lead (TBD)',

  businessGoal:
    'Build a configurable software battery simulator that generates realistic identity, telemetry, firmware, and health data with controllable trust parameters so that the trust scoring engine can be tested, demonstrated, and validated without physical hardware.',

  problemStatement:
    'Real aerospace battery telemetry requires expensive hardware rigs. Development and demo environments have no way to generate realistic, controllable battery data streams. This blocks testing of trust score edge cases and prevents sales demonstrations.',

  userPersona:
    'Software Engineer implementing the Battery Trust Platform who needs to test the scoring engine across all readiness bands without physical battery hardware.',

  userStory:
    'As a Platform Engineer, I want a configurable battery simulator so that I can generate any combination of trust inputs — including attack scenarios and degraded states — to validate the scoring engine and create demo walkthroughs.',

  functionalRequirements: [
    'Simulate battery identity: configurable BTID, serial, manufacturer, chemistry, capacity, certificate validity',
    'Simulate firmware: configurable hash (valid/invalid/tampered), firmware version, config signature status',
    'Simulate telemetry stream: configurable SOC, SOH, voltage, current, temperature, cell imbalance',
    'Simulate telemetry anomalies: timestamp skew, sequence gap, missing MAC, duplicate packets',
    'Simulate cyber events: replay attack flag, spoofing alert, BMS intrusion attempt flag',
    'Simulate maintenance state: last service date, cycle count, certified maintenance status',
    'Support scenario presets: "Fully Trusted", "Telemetry Anomaly", "Firmware Tampered", "Cyber Attack", "Battery Degraded", "Grounded"',
    'Output simulated data to the same data model as the live system — interchangeable with real data',
  ],

  nonFunctionalRequirements: [
    'Simulator must be usable in local dev environment without Firebase connection (mock mode)',
    'Scenario preset loads must complete in < 100ms',
    'Simulated telemetry data must be statistically realistic — voltage/current within physical plausibility bounds',
    'Simulator configuration must be exportable as JSON for repeatable test runs',
    'Simulator must be clearly labelled in UI — never mistaken for real battery data in production',
  ],

  uiRequirements: [
    'Simulator control panel: collapsible sidebar with scenario preset selector and parameter sliders',
    'SIMULATOR MODE banner: prominent amber banner across all pages when simulator is active',
    'Scenario selector: dropdown with 6 named presets + Custom',
    'Parameter controls: sliders for SOC%, SOH%, temperature, voltage, cyber risk level',
    'Attack injection: toggle switches for "Inject Replay Attack", "Inject Spoofed Telemetry", "Corrupt Firmware Hash"',
    'Apply button: triggers re-computation of trust score with new parameters',
    'Reset to real data: button to exit simulator mode (if real data available)',
  ],

  backendRequirements: [
    'SimulatorService: TypeScript class with preset definitions and data generation logic',
    'generateSimulatedBattery(preset, overrides): returns BatteryTrustInput object',
    'generateSimulatedTelemetry(params): returns TelemetryPacket[]',
    'SimulatorContext: React context to share simulator state across Battery Trust pages',
    'No Firestore writes from simulator — simulator data is in-memory only',
  ],

  dataModel: [
    'SimulatorPreset: "fully_trusted" | "telemetry_anomaly" | "firmware_tampered" | "cyber_attack" | "battery_degraded" | "grounded" | "custom"',
    'SimulatorConfig: { preset, identityConfig, firmwareConfig, telemetryConfig, cyberConfig, maintenanceConfig }',
    'SimulatedTelemetryPacket: { timestamp, soc, soh, voltageV, currentA, temperatureC, cellImbalanceMv, macValid, sequenceNumber }',
    'SimulatedCyberEvent: { type, detectedAt, severity, description }',
    'SimulatorSession: { sessionId, startedAt, preset, configSnapshot }',
  ],

  securityRequirements: [
    'Simulator mode must be disabled in production by default — enabled only via developer settings or explicit partner-admin toggle',
    'Simulator sessions must be audit-logged — who activated it, which preset, for how long',
    'Simulator data must never be written to production Firestore collections',
    'SIMULATOR MODE banner must be impossible to hide via CSS — it is a safety-critical label',
  ],

  useCases: [
    'UC-001: Engineer selects "Cyber Attack" preset — system injects replay attack and spoofed telemetry flags, score drops to 0, GROUNDED',
    'UC-002: Engineer selects "Fully Trusted" preset — all dimensions score 95+, composite score 96, Mission Ready',
    'UC-003: Engineer uses custom sliders to set SOH to 60% — Safety dimension drops, overall score enters Engineering Review band',
    'UC-004: Engineer exports simulator config as JSON — test spec saved for regression testing',
    'UC-005: Demo presenter activates simulator in partner demo environment — SIMULATOR banner displayed prominently throughout',
  ],

  negativeUseCases: [
    'NC-001: Attempt to use simulator in production Firestore — system rejects; simulator is read-only in-memory',
    'NC-002: Engineer removes SIMULATOR banner via browser DevTools — banner is re-injected on next render cycle',
    'NC-003: Simulator sliders set voltage to physically impossible value (e.g. 1000V) — system clamps to chemistry max',
    'NC-004: Simulator activated by non-admin in production org — feature flag blocks activation',
  ],

  securityTestCases: [
    'SEC-001: Verify simulator mode cannot be activated in production org without explicit flag',
    'SEC-002: Verify no Firestore writes occur during simulator session',
    'SEC-003: Verify SIMULATOR banner cannot be suppressed via CSS override',
    'SEC-004: Verify simulator session is audit-logged with activating user email and timestamp',
    'SEC-005: Verify simulator voltage clamping prevents physically impossible values',
  ],

  acceptanceCriteria: [
    '"Fully Trusted" preset produces composite score >= 90 (Mission Ready)',
    '"Cyber Attack" preset produces composite score 0 with hard-fail gates active',
    '"Firmware Tampered" preset triggers firmware hash mismatch hard-fail',
    'SIMULATOR banner is always visible when simulator is active',
    'No Firestore writes occur during simulator session',
    'Simulator config can be exported to JSON and re-imported to reproduce the same scenario',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-003 and verify page renders',
    'Confirm simulator architecture section describes preset scenarios correctly',
    'Verify all story sections render with correct headings and content',
    'Confirm story status is "planned" and priority is "high"',
    'Check that Back to WP-001 link works',
  ],

  demoEvidenceRequired: [
    'Screenshot of simulator control panel with "Cyber Attack" preset active',
    'Screenshot showing SIMULATOR MODE amber banner',
    'Screenshot of score gauge at 0 with Grounded band and hard-fail gates shown',
    'Screenshot of "Fully Trusted" preset showing score 96, all green',
    'Screenshot of custom slider panel with SOH set to 60%',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-003 is protected',
    'Story appears in WP-001 with correct status and priority',
  ],
}
