import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '../../firebase/firestore'
import type { WebsiteConfig } from './types'

// ─── Default config ───────────────────────────────────────────────────────────

const DEFAULT_WEBSITE_CONFIG: Omit<WebsiteConfig, 'websiteConfigId' | 'partnerId' | 'domain'> = {
  logoUrl:         '',
  supportEmail:    'info@ev.engineer',
  supportPhone:    '',
  whatsappNumber:  '',
  websiteUrl:      'https://ev.engineer',
  heroTitle:       'EV.ENGINEER',
  heroSubtitle:    'Multi-product platform for the EV and aerospace industry.',
  enabledSections: ['hero', 'features', 'contact', 'footer'],
  productFeatureBlocks: {
    fai_reports: {
      title:       'FAI Reports',
      description: 'Balloon drawings and AS9102 First Article Inspection reporting.',
      features:    ['PDF ballooning', 'AS9102 Form 1/2/3', 'FAIR package export'],
    },
  },
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getWebsiteConfig(websiteConfigId: string): Promise<WebsiteConfig | null> {
  if (!websiteConfigId) return null
  try {
    const snap = await getDoc(doc(firestore, 'websiteConfigs', websiteConfigId))
    if (!snap.exists()) return null
    return { websiteConfigId, ...(snap.data() as Omit<WebsiteConfig, 'websiteConfigId'>) }
  } catch {
    return null
  }
}

/**
 * Resolves website config for a hostname via the domainMappings collection.
 * Returns a sensible default if no config is found.
 */
export async function getWebsiteConfigForDomain(
  hostname: string,
  websiteConfigId?: string,
): Promise<WebsiteConfig> {
  if (websiteConfigId) {
    const config = await getWebsiteConfig(websiteConfigId)
    if (config) return config
  }

  return {
    websiteConfigId: 'default',
    partnerId:       '',
    domain:          hostname,
    ...DEFAULT_WEBSITE_CONFIG,
  }
}
