export const BATTERY_TRUST_PRODUCT = {
  productKey:        'battery_trust' as const,
  productName:       'Battery Trust Platform',
  workPackageId:     'WP-001',
  workPackageTitle:  'Mission Battery Trust Score Engine',
  routeBase:         '/battery-trust',
  wpRoute:           '/battery-trust/wp-001',
  storyRouteBase:    '/battery-trust/wp-001',
  mission:           'Verify whether an aerospace battery can be trusted for a mission by scoring its identity, firmware integrity, telemetry trust, cybersecurity risk, safety condition, and maintenance evidence.',
} as const

export interface TrustScoreComponent {
  label:   string
  weight:  number   // percentage
}

export const TRUST_SCORE_COMPONENTS: TrustScoreComponent[] = [
  { label: 'Identity Trust',                  weight: 15 },
  { label: 'Ownership & Chain of Custody',    weight: 10 },
  { label: 'Configuration & Firmware Trust',  weight: 15 },
  { label: 'Telemetry Integrity',             weight: 15 },
  { label: 'Cybersecurity Risk',              weight: 15 },
  { label: 'Safety & Health Condition',       weight: 20 },
  { label: 'Maintenance & Mission History',   weight: 10 },
]

export interface ReadinessBand {
  min:   number
  max:   number
  label: string
  color: string
  bg:    string
  border: string
}

export const READINESS_BANDS: ReadinessBand[] = [
  { min: 90, max: 100, label: 'Mission Ready',              color: 'text-emerald-400', bg: 'bg-emerald-950',  border: 'border-emerald-700' },
  { min: 75, max: 89,  label: 'Ready with Caution',         color: 'text-yellow-400',  bg: 'bg-yellow-950',   border: 'border-yellow-700'  },
  { min: 60, max: 74,  label: 'Engineering Review Required', color: 'text-orange-400', bg: 'bg-orange-950',   border: 'border-orange-700'  },
  { min: 40, max: 59,  label: 'Not Mission Ready',           color: 'text-red-400',    bg: 'bg-red-950',      border: 'border-red-800'     },
  { min: 0,  max: 39,  label: 'Grounded / Quarantine',       color: 'text-red-300',    bg: 'bg-red-950',      border: 'border-red-900'     },
]

export const HARD_FAIL_GATES: string[] = [
  'Unknown battery identity',
  'Invalid certificate',
  'Firmware hash mismatch',
  'Replay attack detected',
  'Spoofed telemetry detected',
  'Critical temperature',
  'Critical voltage',
  'Critical current',
  'Severe cell imbalance',
  'Expired maintenance',
  'Open critical cyber incident',
]

export function getReadinessBand(score: number): ReadinessBand {
  return READINESS_BANDS.find(b => score >= b.min && score <= b.max) ?? READINESS_BANDS[READINESS_BANDS.length - 1]
}
