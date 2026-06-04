import { createContext } from 'react'
import type { ProductConfigContextValue } from './productConfig.types'

export const ProductConfigContext = createContext<ProductConfigContextValue | null>(null)
