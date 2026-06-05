// ─── Feature keys ─────────────────────────────────────────────────────────────

export type FeatureKey =
  | 'dashboard'
  | 'createProject'
  | 'projectList'
  | 'pdfViewer'
  | 'manualBallooning'
  | 'featureTable'
  | 'form3Export'
  | 'googleDriveSave'
  | 'ocrExtraction'
  | 'adminPortal'

export type ProductFeatures = Record<FeatureKey, boolean>

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  dashboard: 'Dashboard',
  createProject: 'Create Project',
  projectList: 'Project List',
  pdfViewer: 'PDF Viewer',
  manualBallooning: 'Balloon Tool',
  featureTable: 'Feature Table',
  form3Export: 'Form 3 Export',
  googleDriveSave: 'Google Drive',
  ocrExtraction: 'OCR Extraction',
  adminPortal: 'Admin Portal',
}

// ─── Product config (Firestore: productConfigs/{productKey}) ──────────────────

export interface ProductTheme {
  primaryColor: string
  darkBlue: string
  lightBlue: string
  background: string
}

export interface ProductPricing {
  trialDays: number
  monthlyPrice: number
  annualPrice: number
  currency: string
}

export interface ProductConfig {
  productKey: string
  productName: string
  brandName: string
  domain: string
  theme: ProductTheme
  pricing: ProductPricing
  features: ProductFeatures
  isActive: boolean
}

// ─── Organization config (Firestore: organizationConfigs/{organizationCode}) ──

export interface OrgLimits {
  maxProjects: number
  maxUsers: number
  maxExportsPerMonth: number
}

export interface OrgSettings {
  defaultDueDays?: number
}

export interface OrganizationConfig {
  organizationCode: string
  organizationName: string
  productKey: string
  gstNumber: string
  plan: string
  status: 'active' | 'inactive' | 'suspended'
  enabledFeatures: ProductFeatures
  limits: OrgLimits
  settings?: OrgSettings
}

// ─── Context value ────────────────────────────────────────────────────────────

export interface ProductConfigContextValue {
  productKey: string
  productConfig: ProductConfig
  organizationConfig: OrganizationConfig
  isLoading: boolean
  /** True when org config came from fallback default (Firestore doc not found) */
  usingDefaultOrgConfig: boolean
  canAccess: (feature: FeatureKey) => boolean
}
