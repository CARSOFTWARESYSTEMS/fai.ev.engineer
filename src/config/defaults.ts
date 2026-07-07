import type { ProductConfig, OrganizationConfig } from './productConfig.types'

// Default-org (no organisation assigned yet) features — beta users get full
// FAI Reports access as an Engineer: create/edit projects, upload PDFs, run
// ballooning, and export. adminPortal stays off — that's an admin-only surface.
const BASE_FEATURES = {
  dashboard: true,
  createProject: true,
  projectList: true,
  pdfViewer: true,
  manualBallooning: true,
  featureTable: true,
  form3Export: true,
  googleDriveSave: true,
  ocrExtraction: true,
  adminPortal: false,
}

export const DEFAULT_PRODUCT_CONFIG: ProductConfig = {
  productKey: 'fai',
  productName: 'FAI Engineer',
  brandName: 'EV.ENGINEER',
  domain: 'fai.ev.engineer',
  theme: {
    primaryColor: '#0F6FFF',
    darkBlue: '#0047AB',
    lightBlue: '#EAF4FF',
    background: '#F8FAFC',
  },
  pricing: {
    trialDays: 7,
    monthlyPrice: 29,
    annualPrice: 299,
    currency: 'USD',
  },
  features: { ...BASE_FEATURES },
  isActive: true,
}

export const DEFAULT_ORG_CONFIG: OrganizationConfig = {
  organizationCode: 'default',
  organizationName: 'Default Organization',
  productKey: 'fai',
  gstNumber: '',
  plan: 'trial',
  status: 'active',
  enabledFeatures: { ...BASE_FEATURES },
  limits: {
    maxProjects: 3,
    maxUsers: 1,
    maxExportsPerMonth: 5,
  },
  settings: {
    defaultDueDays: 7,
  },
}
