import type { ProductId } from '../../auth/AuthTypes'

// ─── Product Catalogue Entry ──────────────────────────────────────────────────

export interface ProductCatalogueEntry {
  productKey:    ProductId
  name:          string
  shortName:     string
  description:   string
  domainPrefix:  string
  defaultDomain: string
  routeBase:     string
  status:        'active' | 'beta' | 'future'
  isExternal:    boolean   // true = launched via secure token handoff to external domain
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

export const PRODUCT_CATALOGUE: ProductCatalogueEntry[] = [
  {
    productKey:    'fai_reports',
    name:          'FAI Reports',
    shortName:     'FAI',
    description:   'Aerospace balloon drawing and AS9102 First Article Inspection toolkit.',
    domainPrefix:  'fai',
    defaultDomain: 'fai.ev.engineer',
    routeBase:     '/projects',
    status:        'active',
    isExternal:    false,
  },
  {
    productKey:    'autonomous',
    name:          'Autonomous',
    shortName:     'AUTO',
    description:   'Autonomous vehicle software and simulation platform.',
    domainPrefix:  'autonomous',
    defaultDomain: 'autonomous.ev.engineer',
    routeBase:     '/launch',
    status:        'active',
    isExternal:    true,
  },
  {
    productKey:    'battery_pm',
    name:          'Battery Predictive Maintenance',
    shortName:     'BPM',
    description:   'Battery health monitoring and predictive failure alerts.',
    domainPrefix:  'battery',
    defaultDomain: 'battery.ev.engineer',
    routeBase:     '/battery',
    status:        'future',
    isExternal:    false,
  },
  {
    productKey:    'motor_pm',
    name:          'Motor Predictive Maintenance',
    shortName:     'MPM',
    description:   'Motor health, vibration, and thermal monitoring.',
    domainPrefix:  'motor',
    defaultDomain: 'motor.ev.engineer',
    routeBase:     '/motor',
    status:        'future',
    isExternal:    false,
  },
  {
    productKey:    'energy_mgmt',
    name:          'Energy Management',
    shortName:     'EMS',
    description:   'Fleet energy consumption monitoring and optimisation.',
    domainPrefix:  'energy',
    defaultDomain: 'energy.ev.engineer',
    routeBase:     '/energy',
    status:        'future',
    isExternal:    false,
  },
  {
    productKey:    'ev_certificates',
    name:          'EV Certificates',
    shortName:     'CERT',
    description:   'EV component and vehicle certification management.',
    domainPrefix:  'certificates',
    defaultDomain: 'certificates.ev.engineer',
    routeBase:     '/certificates',
    status:        'future',
    isExternal:    false,
  },
  {
    productKey:    'clean_room',
    name:          'Clean Room',
    shortName:     'CLR',
    description:   'Clean room environment monitoring and compliance reporting.',
    domainPrefix:  'cleanroom',
    defaultDomain: 'cleanroom.ev.engineer',
    routeBase:     '/cleanroom',
    status:        'future',
    isExternal:    false,
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getProductEntry(productKey: ProductId): ProductCatalogueEntry | undefined {
  return PRODUCT_CATALOGUE.find(p => p.productKey === productKey)
}

export function getActiveProducts(): ProductCatalogueEntry[] {
  return PRODUCT_CATALOGUE.filter(p => p.status === 'active')
}

export function getExternalProducts(): ProductCatalogueEntry[] {
  return PRODUCT_CATALOGUE.filter(p => p.isExternal)
}
