import { ReactNode, useState, useEffect, useCallback } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import { useAuth } from '../auth/hooks/useAuth'
import { useOrgContext } from '../modules/organisation/OrgContextProvider'
import { ProductConfigContext } from './ProductConfigContext'
import { readProductKey } from './productKey'
import { canAccessFeature } from './featureAccess'
import { DEFAULT_PRODUCT_CONFIG, DEFAULT_ORG_CONFIG } from './defaults'
import type {
  ProductConfig,
  OrganizationConfig,
  FeatureKey,
} from './productConfig.types'

// Product key is stable for the lifetime of the page — read once at module level
const PRODUCT_KEY = readProductKey()

async function fetchProductConfig(pk: string): Promise<ProductConfig | null> {
  try {
    const snap = await getDoc(doc(firestore, 'productConfigs', pk))
    if (!snap.exists()) {
      console.warn(`[CONFIG] productConfigs/${pk} not found — using local default`)
      return null
    }
    return snap.data() as ProductConfig
  } catch (err) {
    console.warn(`[CONFIG] Failed to fetch productConfigs/${pk}:`, err)
    return null
  }
}

async function fetchOrgConfig(orgCode: string): Promise<OrganizationConfig | null> {
  try {
    const snap = await getDoc(doc(firestore, 'organizationConfigs', orgCode))
    if (!snap.exists()) {
      console.warn(`[CONFIG] organizationConfigs/${orgCode} not found — using default org config`)
      return null
    }
    return snap.data() as OrganizationConfig
  } catch (err) {
    console.warn(`[CONFIG] Failed to fetch organizationConfigs/${orgCode}:`, err)
    return null
  }
}

export function ProductConfigProvider({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, firebaseUser } = useAuth()
  const { org, isLoading: orgLoading } = useOrgContext()

  const [productConfig, setProductConfig] = useState<ProductConfig>(DEFAULT_PRODUCT_CONFIG)
  const [organizationConfig, setOrganizationConfig] = useState<OrganizationConfig>(DEFAULT_ORG_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [usingDefaultOrgConfig, setUsingDefaultOrgConfig] = useState(false)

  const loadConfigs = useCallback(async (orgCode: string) => {
    setIsLoading(true)
    const [pc, oc] = await Promise.all([
      fetchProductConfig(PRODUCT_KEY),
      fetchOrgConfig(orgCode),
    ])
    setProductConfig(pc ?? { ...DEFAULT_PRODUCT_CONFIG, productKey: PRODUCT_KEY })
    if (oc) {
      setOrganizationConfig(oc)
      setUsingDefaultOrgConfig(false)
    } else {
      setOrganizationConfig(DEFAULT_ORG_CONFIG)
      setUsingDefaultOrgConfig(true)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Wait for both auth and org context to resolve, and ensure a user is authenticated.
    // Without the firebaseUser guard, a brief unauthenticated state during account
    // switching fires Firestore reads that return permission-denied.
    if (authLoading || orgLoading) return
    if (!firebaseUser) { setIsLoading(false); return }

    const orgCode = org?.code || 'default'
    loadConfigs(orgCode)
  }, [authLoading, orgLoading, firebaseUser, org?.code, loadConfigs])

  const canAccess = useCallback(
    (feature: FeatureKey) => canAccessFeature(feature, productConfig, organizationConfig),
    [productConfig, organizationConfig]
  )

  return (
    <ProductConfigContext.Provider
      value={{
        productKey: PRODUCT_KEY,
        productConfig,
        organizationConfig,
        isLoading,
        usingDefaultOrgConfig,
        canAccess,
      }}
    >
      {children}
    </ProductConfigContext.Provider>
  )
}
