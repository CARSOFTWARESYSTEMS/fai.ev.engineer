import { useState, useCallback, useEffect, useRef } from 'react'
import type { Feature, FeatureInput, FeatureUpdateInput } from '../types/featureTypes'
import {
  subscribeToFeatures,
  addFeatureDoc,
  updateFeatureDoc,
  deleteFeatureDoc,
} from '../services/featureService'

interface UseFeaturesProps {
  projectId: string
  userId: string
}

interface PendingFeatureDelete {
  id: string
  snapshot: Feature
  timerId: ReturnType<typeof setTimeout>
}

export function useFeatures({ projectId, userId }: UseFeaturesProps) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState<string | null>(null)

  const pendingTempIds = useRef(new Set<string>())
  const pendingDeleteIds = useRef(new Set<string>())
  const pendingDeleteRef = useRef<PendingFeatureDelete | null>(null)

  useEffect(() => {
    if (!projectId) return
    setSubscriptionError(null)

    const unsubscribe = subscribeToFeatures(projectId, firestoreFeatures => {
      setSubscriptionError(null)
      setFeatures(prev => {
        const firestoreIds = new Set(firestoreFeatures.map(f => f.id))
        const activeTemps = prev.filter(
          f => f.id.startsWith('__temp_') &&
               pendingTempIds.current.has(f.id) &&
               !firestoreIds.has(f.id),
        )
        const filtered = firestoreFeatures.filter(f => !pendingDeleteIds.current.has(f.id))
        return [...filtered, ...activeTemps]
      })
    })

    return unsubscribe
  }, [projectId])

  const addFeature = useCallback(async (input: FeatureInput) => {
    if (!projectId || !userId) return
    const tempId = `__temp_${Date.now()}`
    pendingTempIds.current.add(tempId)
    const optimistic: Feature = { id: tempId, ...input, createdAt: null, updatedAt: null }
    setFeatures(prev => [...prev, optimistic])
    try {
      await addFeatureDoc(projectId, input)
      pendingTempIds.current.delete(tempId)
      setFeatures(prev => prev.filter(f => f.id !== tempId))
    } catch (err) {
      console.error('[useFeatures] add failed:', err)
      pendingTempIds.current.delete(tempId)
      setFeatures(prev => prev.filter(f => f.id !== tempId))
    }
  }, [projectId, userId])

  const updateFeature = useCallback(async (featureId: string, data: FeatureUpdateInput) => {
    setFeatures(prev => prev.map(f => f.id === featureId ? { ...f, ...data } : f))
    try {
      await updateFeatureDoc(projectId, featureId, data)
    } catch (err) {
      console.error('[useFeatures] update failed:', err)
    }
  }, [projectId])

  const deleteFeature = useCallback(async (featureId: string) => {
    const snapshot = features.find(f => f.id === featureId)
    if (!snapshot) return

    // Flush any existing pending delete immediately before starting a new one
    if (pendingDeleteRef.current) {
      const prev = pendingDeleteRef.current
      clearTimeout(prev.timerId)
      pendingDeleteRef.current = null
      pendingDeleteIds.current.delete(prev.id)
      deleteFeatureDoc(projectId, prev.id).catch(err =>
        console.error('[useFeatures] deferred delete failed:', err),
      )
    }

    pendingDeleteIds.current.add(featureId)
    setFeatures(prev => prev.filter(f => f.id !== featureId))
    setPendingDeleteLabel(`Feature #${snapshot.featureNumber}`)

    const timerId = setTimeout(async () => {
      pendingDeleteRef.current = null
      pendingDeleteIds.current.delete(featureId)
      setPendingDeleteLabel(null)
      try {
        await deleteFeatureDoc(projectId, featureId)
      } catch (err) {
        console.error('[useFeatures] delete failed:', err)
        setFeatures(prev =>
          [...prev, snapshot].sort((a, b) => a.featureNumber - b.featureNumber),
        )
      }
    }, 5000)

    pendingDeleteRef.current = { id: featureId, snapshot, timerId }
  }, [projectId, features])

  const undoFeatureDelete = useCallback(() => {
    if (!pendingDeleteRef.current) return
    const { id, snapshot, timerId } = pendingDeleteRef.current
    clearTimeout(timerId)
    pendingDeleteRef.current = null
    pendingDeleteIds.current.delete(id)
    setPendingDeleteLabel(null)
    setFeatures(prev => [...prev, snapshot].sort((a, b) => a.featureNumber - b.featureNumber))
  }, [])

  const dismissFeatureDeleteToast = useCallback(() => {
    if (!pendingDeleteRef.current) return
    const { id, snapshot, timerId } = pendingDeleteRef.current
    clearTimeout(timerId)
    pendingDeleteRef.current = null
    pendingDeleteIds.current.delete(id)
    setPendingDeleteLabel(null)
    deleteFeatureDoc(projectId, id).catch(err => {
      console.error('[useFeatures] delete failed after dismiss:', err)
      setFeatures(prev => [...prev, snapshot].sort((a, b) => a.featureNumber - b.featureNumber))
    })
  }, [projectId])

  return {
    features,
    subscriptionError,
    pendingDeleteLabel,
    addFeature,
    updateFeature,
    deleteFeature,
    undoFeatureDelete,
    dismissFeatureDeleteToast,
  }
}
