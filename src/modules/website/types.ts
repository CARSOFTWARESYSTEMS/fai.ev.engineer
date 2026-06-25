import type { ProductId } from '../../auth/AuthTypes'

// ─── Domain Mapping ───────────────────────────────────────────────────────────
// Firestore collection: domainMappings/{hostname}

export interface DomainMapping {
  hostname:        string       // doc ID — lowercase, no https://, no trailing slash
  partnerId:       string
  brandingId?:     string
  websiteConfigId?: string
  defaultProduct?: ProductId
  enabledProducts: ProductId[]
  status:          'active' | 'inactive'
}

// ─── Resolved Domain Context ──────────────────────────────────────────────────
// Returned by domainResolver after resolving hostname → mapping + fallback.

export interface ResolvedDomainContext {
  hostname:         string
  partnerId?:       string
  brandingId?:      string
  websiteConfigId?: string
  defaultProduct?:  ProductId
  enabledProducts:  ProductId[]
  status:           'active' | 'inactive' | 'unknown'
  source:           'firebase' | 'fallback'
}

// ─── Website Config ───────────────────────────────────────────────────────────
// Firestore collection: websiteConfigs/{websiteConfigId}

export type WebsiteSection = 'hero' | 'features' | 'products' | 'contact' | 'footer'

export interface ProductFeatureBlock {
  title:       string
  description: string
  features:    string[]
}

export interface WebsiteConfig {
  websiteConfigId:      string
  partnerId:            string
  domain:               string
  logoUrl:              string
  supportEmail:         string
  supportPhone:         string
  whatsappNumber:       string
  websiteUrl:           string
  heroTitle:            string
  heroSubtitle:         string
  enabledSections:      WebsiteSection[]
  productFeatureBlocks: Partial<Record<ProductId, ProductFeatureBlock>>
}
