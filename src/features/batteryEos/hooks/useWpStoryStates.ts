import { useEffect, useState } from 'react'
import { subscribeWpStoryStates } from '../services/storyLifecycle.service'
import type { EosStoryState } from '../types/eos.types'

export interface WpStoryStatesResult {
  storyStates: Record<string, EosStoryState>
  isLoading:   boolean
  error:       string | null
}

export function useWpStoryStates(workPackageId: string): WpStoryStatesResult {
  const [storyStates, setStoryStates] = useState<Record<string, EosStoryState>>({})
  const [isLoading,   setIsLoading]   = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    const unsub = subscribeWpStoryStates(
      workPackageId,
      states => {
        setStoryStates(states)
        setIsLoading(false)
      },
      err => {
        console.warn('[EOS] useWpStoryStates:', err.message)
        setError(err.message)
        setIsLoading(false)
      },
    )
    return unsub
  }, [workPackageId])

  return { storyStates, isLoading, error }
}
