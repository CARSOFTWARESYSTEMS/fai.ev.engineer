import { createContext } from 'react'
import type { EVEngineerAuthContextValue } from './AuthTypes'

export const EVEngineerAuthContext = createContext<EVEngineerAuthContextValue | null>(null)
