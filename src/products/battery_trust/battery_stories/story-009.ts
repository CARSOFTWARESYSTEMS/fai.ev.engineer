import type { BatteryStory } from './storyCatalogue'

export const STORY_009: BatteryStory = {
  id:               'BT-S009',
  title:            'Battery Trust Report',
  status:           'planned',
  priority:         'medium',
  storyPoints:      5,
  missionRelevance: 'Aerospace operators and regulators require documented evidence of battery trust assessment for mission authorisation, incident investigation, and airworthiness compliance. A printable, tamper-evident report is essential.',
  owner:            'Engineering Lead (TBD)',

  businessGoal:
    'Generate a comprehensive, tamper-evident Battery Trust Report that documents the full trust assessment for a battery at a specific mission point-in-time, suitable for mission authorisation sign-off, regulatory submission, and incident investigation.',

  problemStatement:
    'Battery mission authorisation decisions are currently undocumented or captured in free-text emails. There is no standardised, machine-verifiable report format that records the complete trust assessment with score breakdown, evidence references, safety status, and cybersecurity posture at a specific timestamp.',

  userPersona:
    'Compliance Officer at an aerospace OEM preparing documentation for mission authorisation or regulatory airworthiness review.',

  userStory:
    'As a Compliance Officer, I want to generate a Battery Trust Report for a specific battery at a specific mission timestamp so that I have a complete, tamper-evident record of the trust assessment that can be submitted for mission authorisation and retained for audit.',

  functionalRequirements: [
    'Generate report for: btid + missionId + timestamp (point-in-time snapshot)',
    'Include battery identity section: BTID, manufacturer, model, serial, chemistry, certificate status',
    'Include composite score section: score, readiness band, verdict',
    'Include per-dimension section: score per dimension with weight and contributing evidence',
    'Include hard-fail gate section: status of all 11 gates at report time',
    'Include safety vitals section: temperature, voltage, current, SOH, cell imbalance at report time',
    'Include cybersecurity section: active cyber events, validation rule violations, attack detection results',
    'Include maintenance section: last service date, cycle count, certified maintenance status',
    'Include mission verdict section: GO/NO-GO verdict, deciding officer, timestamp, override flag if applicable',
    'Compute report hash (SHA-256) of full report content for tamper detection',
    'Generate report in two formats: JSON (machine-readable) and PDF (human-readable)',
    'Support report retrieval by reportId',
  ],

  nonFunctionalRequirements: [
    'PDF report must be generated server-side — no client-side PDF rendering',
    'Report generation must complete in < 10 seconds',
    'Report storage must be append-only — no modification after creation',
    'Report must be accessible to all org members with at least viewer role',
    'PDF must include page numbers, organisation logo placeholder, and document reference number',
  ],

  uiRequirements: [
    'Report generation button: "Generate Trust Report" CTA on dashboard and verdict page',
    'Report preview panel: collapsible in-page preview of report sections',
    'Report history list: table of past reports with reportId, timestamp, verdict, and download link',
    'Report integrity indicator: green checkmark if hash matches, red warning if tampered',
    'Download button: download as PDF or JSON',
    'Share button: copy shareable link (requires auth to view)',
  ],

  backendRequirements: [
    'Cloud Function: generateBatteryTrustReport(btid, missionId, timestamp) — assembles and stores report',
    'Cloud Function: getBatteryTrustReport(reportId) — returns report with integrity check',
    'Cloud Function: listBatteryTrustReports(btid) — returns report history',
    'Firestore collection: batteryTrustReports/{reportId}',
    'PDF generation: Cloud Run service using Puppeteer or WeasyPrint',
    'Storage: Firebase Storage at battery-trust-reports/{btid}/{reportId}.pdf',
  ],

  dataModel: [
    'BatteryTrustReport: { reportId, btid, missionId, generatedAt, generatedBy, identitySnapshot, scoreSnapshot, dimensionSnapshots, hardFailSnapshot, safetySnapshot, cyberSnapshot, maintenanceSnapshot, verdictSnapshot, reportHash, storageUrl }',
    'ReportMeta: { reportId, btid, missionId, generatedAt, verdict, reportHash, storageUrl }',
  ],

  securityRequirements: [
    'Report storage must use Firebase Storage security rules — only org members can read',
    'Report hash must be computed server-side and stored separately from report content to detect tampering',
    'Share links must be time-limited (24 hours) and require authentication to access',
    'Regulatory export must include digital signature field (placeholder for DocuSign or similar integration)',
    'Report generation must be audit-logged with requester email and timestamp',
  ],

  useCases: [
    'UC-001: Safety Officer clicks "Generate Trust Report" after GO verdict — report created with full snapshot and hash',
    'UC-002: Compliance Officer downloads PDF for regulatory submission — PDF includes document hash and report reference number',
    'UC-003: Investigator retrieves report after incident — hash verified against stored value; no tampering detected',
    'UC-004: Compliance Officer views report history for a battery — sees 12 past reports sorted by date',
    'UC-005: Safety Officer shares report link with external auditor — link expires after 24 hours',
  ],

  negativeUseCases: [
    'NC-001: Attempt to download report from different organisation without auth — 403 rejected',
    'NC-002: Report PDF modified after download and re-uploaded — hash mismatch detected on next integrity check',
    'NC-003: Report generation requested with future timestamp — system rejects; reports must be historical snapshots',
  ],

  securityTestCases: [
    'SEC-001: Download report, modify one field in JSON, re-upload — verify hash mismatch detected',
    'SEC-002: Access report URL without authentication — verify 401 rejection',
    'SEC-003: Share link accessed after 24 hours — verify expiry and access denied',
    'SEC-004: Verify report generation is audit-logged',
    'SEC-005: Verify report hash is computed server-side and matches re-computation on retrieval',
  ],

  acceptanceCriteria: [
    'Report includes all required sections with correct data',
    'Report hash is computed and stored on generation',
    'Hash mismatch is detected and displayed when report is tampered',
    'PDF report is generated with correct layout including report reference number',
    'Report history list shows all past reports for a battery',
    'JSON export is machine-readable and matches the PDF content',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-009 and confirm page renders',
    'Verify report sections list includes all 12 required sections',
    'Confirm security requirements mention SHA-256 hash for tamper detection',
    'Check negative use cases cover cross-org access and tamper detection',
    'Verify story priority is "medium" and status is "planned"',
  ],

  demoEvidenceRequired: [
    'Screenshot of report generation panel with "Generate Trust Report" CTA',
    'Screenshot of PDF report first page with score, identity, and verdict section',
    'Screenshot of report history list with download and integrity indicator',
    'Screenshot of tamper detection warning (red hash mismatch indicator)',
    'Screenshot of JSON export format showing key fields',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-009 is protected',
    'Story appears in WP-001 with correct status and priority',
  ],
}
