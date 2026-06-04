import { useContext } from 'react'
import { EVEngineerAuthContext } from '../EVEngineerAuthContext'
import type { EVEngineerAuthContextValue } from '../AuthTypes'

/**
 * EVEngineerAuth hook — usable in any product on the EV.ENGINEER platform.
 * Must be called inside EVEngineerAuthProvider.
 */
export function useAuth(): EVEngineerAuthContextValue {
  const ctx = useContext(EVEngineerAuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <EVEngineerAuthProvider>')
  }
  return ctx
}
