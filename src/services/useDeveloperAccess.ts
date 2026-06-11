import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../auth/hooks/useAuth'
import { firestore } from '../firebase/firestore'
import { isBootstrapDeveloper } from '../config/developerBootstrap'

export interface DeveloperAccessState {
  isDeveloper: boolean
  isBootstrap: boolean
  isLoading: boolean
}

export function useDeveloperAccess(): DeveloperAccessState {
  const { firebaseUser } = useAuth()
  const email      = firebaseUser?.email ?? null
  const isBootstrap = isBootstrapDeveloper(email)

  const [isDeveloper, setIsDeveloper] = useState(isBootstrap)
  const [isLoading,   setIsLoading]   = useState(!isBootstrap)

  useEffect(() => {
    if (isBootstrap) {
      setIsDeveloper(true)
      setIsLoading(false)
      return
    }
    if (!email) {
      setIsDeveloper(false)
      setIsLoading(false)
      return
    }
    // Non-bootstrap: check Firestore developerConfig/{email}
    const ref = doc(firestore, 'developerConfig', email)
    const unsub = onSnapshot(
      ref,
      snap => {
        setIsDeveloper(snap.exists() && snap.data()?.enabled === true)
        setIsLoading(false)
      },
      () => {
        // Firestore denied (not a developer) — treat as no access
        setIsDeveloper(false)
        setIsLoading(false)
      },
    )
    return unsub
  }, [email, isBootstrap])

  return { isDeveloper, isBootstrap, isLoading }
}
