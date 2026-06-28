import type { BatteryStory } from './storyCatalogue'

export const STORY_008: BatteryStory = {
  id:               'BT-S008',
  title:            'Trust Score Dashboard',
  status:           'planned',
  priority:         'high',
  storyPoints:      8,
  missionRelevance: 'The dashboard is the primary interface for mission safety officers and fleet managers. It must surface the trust score, readiness band, and critical alerts at a glance without requiring expert interpretation.',
  owner:            'UI/UX Engineer (TBD)',

  businessGoal:
    'Build the primary Battery Trust Dashboard that presents the composite trust score, per-dimension breakdown, mission readiness verdict, and active alerts in a premium aerospace-grade engineering interface optimised for rapid, high-confidence decision making.',

  problemStatement:
    'Battery health and safety information is currently scattered across BMS logs, maintenance records, and manual checklists. Decision makers have no single unified view that combines all trust signals into an actionable dashboard. This slows down mission preparation and increases the risk of missing critical alerts.',

  userPersona:
    'Mission Safety Officer or Battery Fleet Manager who needs a single screen to assess battery trust before mission assignment.',

  userStory:
    'As a Mission Safety Officer, I want a single battery trust dashboard that shows me the composite trust score, readiness band, per-dimension breakdown, hard-fail gate status, and active alerts so that I can make a GO/NO-GO decision in under 60 seconds without navigating multiple systems.',

  functionalRequirements: [
    'Display composite trust score (0–100) with readiness band label and colour coding',
    'Display per-dimension score bars for all 7 trust dimensions',
    'Display hard-fail gate status: list of all 11 gates with pass/fail state',
    'Display mission readiness verdict: GO / GO_WITH_CONDITIONS / NO-GO / GROUNDED',
    'Display last update timestamp for score and telemetry',
    'Display active alert count badge and expandable alert panel',
    'Display battery identity summary: BTID, manufacturer, model, serial, chemistry',
    'Display safety vitals strip: live temperature, voltage range, current, SOH, cell imbalance',
    'Support refresh: manual refresh button + auto-refresh interval (configurable 30s / 60s / 5m)',
    'Display score trend: last 7 score computations as sparkline trend',
    'Support battery selector: dropdown to switch between batteries in the fleet',
  ],

  nonFunctionalRequirements: [
    'Dashboard initial load < 2 seconds',
    'Score gauge must be legible on a 1920×1080 display from 1 metre distance',
    'Dashboard must be responsive for tablet (1024px) and desktop (1440px+) viewports',
    'Auto-refresh must not cause layout shift or flicker',
    'All critical alert conditions must be visible without scrolling on a 1080p display',
  ],

  uiRequirements: [
    'Layout: dark navy aerospace theme — bg-slate-950 base, bg-slate-900 cards, blue accent (#2563EB)',
    'Engineering grid background: subtle grid overlay on hero section',
    'Score gauge: large circular gauge (200px diameter) with arc colour zones',
    'Readiness band chip: pill badge with band colour — emerald/yellow/orange/red',
    'Dimension bars: horizontal progress bars with weight percentage label right-aligned',
    'Vitals strip: top horizontal strip with icon + value + unit per vital, colour-coded by threshold',
    'Alert panel: collapsible bottom panel with alert count badge',
    'Battery selector: dropdown with BTID + manufacturer + model',
    'Print-friendly: dashboard must be printable as a clean A4 report layout',
  ],

  backendRequirements: [
    'Real-time Firestore subscription to latest score and alert documents',
    'Cloud Function: getDashboardData(btid) — returns all dashboard data in single call',
    'Firestore collection: batteryAlerts/{btid}/active — real-time active alerts',
    'Dashboard data must be cached for 30 seconds to avoid excessive Firestore reads',
    'Battery fleet list query: organisationMembers → org batteries',
  ],

  dataModel: [
    'DashboardData: { btid, identitySummary, compositeScore, dimensionScores, hardFailGates, verdict, activeAlerts, vitals, scoreTrend, lastUpdated }',
    'BatteryAlert: { alertId, btid, type, severity, message, triggeredAt, resolvedAt: null | Timestamp }',
    'ScoreTrendPoint: { score, computedAt }',
  ],

  securityRequirements: [
    'Dashboard must only show batteries belonging to the user\'s organisation',
    'Alert data must not leak battery identity or safety information to unauthorised users',
    'Dashboard print/export must include organisation name and date-time stamp for traceability',
    'Real-time subscription must terminate when user navigates away or session expires',
  ],

  useCases: [
    'UC-001: Safety officer opens dashboard, sees score 88 (Ready with Caution), one condition listed — decides GO with sign-off',
    'UC-002: Fleet manager selects different battery from selector — dashboard updates instantly with new battery data',
    'UC-003: Active replay attack fires during dashboard viewing — score drops to 0, GROUNDED banner appears without page reload',
    'UC-004: Safety officer enables auto-refresh (30s) — score updates silently every 30 seconds',
    'UC-005: Safety officer prints dashboard — A4-formatted report with score, dimensions, vitals, and verdict',
  ],

  negativeUseCases: [
    'NC-001: Battery from another organisation selected via URL manipulation — system returns 403 or empty state',
    'NC-002: Auto-refresh fires while user is filling override form — form state preserved, refresh updates background data only',
    'NC-003: All telemetry data is stale (> 5 minutes old) — dashboard shows "Stale Data" warning instead of live score',
  ],

  securityTestCases: [
    'SEC-001: Access dashboard with battery from different organisation — verify empty state or 403',
    'SEC-002: Verify real-time subscription terminates on sign-out',
    'SEC-003: Verify printed dashboard includes organisation name, timestamp, and BTID',
    'SEC-004: Stale telemetry (> 5min old) — verify stale data warning renders',
  ],

  acceptanceCriteria: [
    'Dashboard renders all required sections: score gauge, dimensions, gates, verdict, vitals, alerts',
    'Battery selector switches data context correctly',
    'Auto-refresh updates score without page reload or layout shift',
    'GROUNDED state shows full-width red banner and score 0',
    'Dashboard is printable in A4 format',
    'Score trend sparkline shows last 7 score points',
  ],

  manualVerificationSteps: [
    'Open /battery-trust/wp-001/story-008 and confirm page renders',
    'Verify dashboard UI requirements section lists dark navy aerospace theme specification',
    'Confirm score gauge specifications (200px, arc zones) are present in UI Requirements',
    'Check auto-refresh intervals are listed (30s / 60s / 5m)',
    'Verify negative use case NC-001 covers cross-organisation access attempt',
  ],

  demoEvidenceRequired: [
    'Screenshot of dashboard with score 88 (Ready with Caution), amber band',
    'Screenshot of dashboard with score 0 (Grounded), full-width red banner',
    'Screenshot of per-dimension score bars with all 7 dimensions',
    'Screenshot of vitals strip with temperature in warning range (amber)',
    'Screenshot of printed A4 layout',
  ],

  definitionOfDone: [
    'Story page renders all sections with correct static content',
    'TypeScript compiles without errors',
    'Build passes without warnings',
    'Route /battery-trust/wp-001/story-008 is protected',
    'Story appears in WP-001 with correct status and priority',
  ],
}
