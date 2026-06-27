import { useEffect, useState } from 'react'
import { subscribeStoryState } from '../services/storyLifecycle.service'
import type { EosStoryState } from '../types/eos.types'

export interface StoryStateResult {
  storyState: EosStoryState | null
  isLoading:  boolean
  error:      string | null
}

export function useStoryState(storyId: string): StoryStateResult {
  const [storyState, setStoryState] = useState<EosStoryState | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    const unsub = subscribeStoryState(
      storyId,
      state => {
        setStoryState(state)
        setIsLoading(false)
      },
      err => {
        console.warn('[EOS] useStoryState:', err.message)
        setError(err.message)
        setIsLoading(false)
      },
    )
    return unsub
  }, [storyId])

  return { storyState, isLoading, error }
}
