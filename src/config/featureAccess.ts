import type { FeatureKey, ProductConfig, OrganizationConfig } from './productConfig.types'

/**
 * A feature is accessible only when BOTH the product config AND the organization
 * config have it enabled. Either side can gate a feature independently.
 *
 * Future admin dashboard will manage these flags in Firestore.
 */
export function canAccessFeature(
  featureKey: FeatureKey,
  productConfig: ProductConfig,
  organizationConfig: OrganizationConfig
): boolean {
  const productEnabled = productConfig.features[featureKey] ?? false
  const orgEnabled = organizationConfig.enabledFeatures[featureKey] ?? false
  return productEnabled && orgEnabled
}
