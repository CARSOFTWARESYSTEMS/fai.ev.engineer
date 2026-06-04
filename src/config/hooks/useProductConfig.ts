import { useContext } from 'react'
import { ProductConfigContext } from '../ProductConfigContext'
import type { ProductConfigContextValue } from '../productConfig.types'

/**
 * Access product key, feature flags, and organization config anywhere in the tree.
 * Must be used inside ProductConfigProvider.
 */
export function useProductConfig(): ProductConfigContextValue {
  const ctx = useContext(ProductConfigContext)
  if (!ctx) throw new Error('useProductConfig must be used inside <ProductConfigProvider>')
  return ctx
}
