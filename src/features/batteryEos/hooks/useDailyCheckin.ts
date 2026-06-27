import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getTodayCheckin } from '../services/dailyCheckin.service'
import type { EosDailyCheckin } from '../types/eos.types'

export interface DailyCheckinState {
  todayCheckin:    EosDailyCheckin | null
  hasCheckedIn:    boolean
  isLoading:       boolean
  refresh:         () => void
}

export function useDailyCheckin(): DailyCheckinState {
  const { firebaseUser } = useAuth()

  const [todayCheckin, setTodayCheckin] = useState<EosDailyCheckin | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)

  const load = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const checkin = await getTodayCheckin(firebaseUser.uid)
      setTodayCheckin(checkin)
    } catch {
      setTodayCheckin(null)
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser?.uid])

  useEffect(() => { load() }, [load])

  return {
    todayCheckin,
    hasCheckedIn: todayCheckin !== null,
    isLoading,
    refresh: load,
  }
}
