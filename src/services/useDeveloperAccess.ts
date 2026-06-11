import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../auth/hooks/useAuth'
import { firestore } from '../firebase/firestore'
import { isBootstrapDeveloper } from '../config/developerBootstrap'
import type { DeveloperRole } from './developerConfigService'

export interface DeveloperAccessState {
  isDeveloper: boolean
  isBootstrap: boolean
  developerRole: DeveloperRole | null  // 'admin' for bootstrap; Firestore role for managed devs
  isDeveloperAdmin: boolean            // true if bootstrap or role === 'admin'
  isLoading: boolean
}

export function useDeveloperAccess(): DeveloperAccessState {
  const { firebaseUser } = useAuth()
  const email      = firebaseUser?.email ?? null
  const isBootstrap = isBootstrapDeveloper(email)

  const [isDeveloper,    setIsDeveloper]    = useState(isBootstrap)
  const [developerRole,  setDeveloperRole]  = useState<DeveloperRole | null>(isBootstrap ? 'admin' : null)
  const [isLoading,      setIsLoading]      = useState(!isBootstrap)

  useEffect(() => {
    if (isBootstrap) {
      setIsDeveloper(true)
      setDeveloperRole('admin')
      setIsLoading(false)
      return
    }
    if (!email) {
      setIsDeveloper(false)
      setDeveloperRole(null)
      setIsLoading(false)
      return
    }
    const ref = doc(firestore, 'developerConfig', email)
    const unsub = onSnapshot(
      ref,
      snap => {
        const data = snap.data()
        const enabled = snap.exists() && data?.enabled === true
        setIsDeveloper(enabled)
        setDeveloperRole(enabled ? ((data?.role as DeveloperRole) ?? 'developer') : null)
        setIsLoading(false)
      },
      () => {
        setIsDeveloper(false)
        setDeveloperRole(null)
        setIsLoading(false)
      },
    )
    return unsub
  }, [email, isBootstrap])

  const isDeveloperAdmin = isBootstrap || developerRole === 'admin'

  return { isDeveloper, isBootstrap, developerRole, isDeveloperAdmin, isLoading }
}
