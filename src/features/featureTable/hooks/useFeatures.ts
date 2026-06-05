import { useState, useCallback, useEffect } from 'react'
import type { Feature, FeatureInput, FeatureUpdateInput } from '../types/featureTypes'
import {
  loadFeatures,
  addFeatureDoc,
  updateFeatureDoc,
  deleteFeatureDoc,
} from '../services/featureService'

interface UseFeaturesProps {
  projectId: string
  userId: string
}

export function useFeatures({ projectId, userId }: UseFeaturesProps) {
  const [features, setFeatures] = useState<Feature[]>([])

  useEffect(() => {
    if (!projectId) return
    loadFeatures(projectId)
      .then(setFeatures)
      .catch(err => console.error('[useFeatures] load failed:', err))
  }, [projectId])

  const addFeature = useCallback(async (input: FeatureInput) => {
    if (!projectId || !userId) return
    const tempId = `__temp_${Date.now()}`
    const optimistic: Feature = {
      id: tempId,
      ...input,
      createdAt: null,
      updatedAt: null,
    }
    setFeatures(prev => [...prev, optimistic])
    try {
      const realId = await addFeatureDoc(projectId, input)
      setFeatures(prev => prev.map(f => f.id === tempId ? { ...f, id: realId } : f))
    } catch (err) {
      console.error('[useFeatures] add failed:', err)
      setFeatures(prev => prev.filter(f => f.id !== tempId))
    }
  }, [projectId, userId])

  const updateFeature = useCallback(async (
    featureId: string,
    data: FeatureUpdateInput,
  ) => {
    setFeatures(prev => prev.map(f => f.id === featureId ? { ...f, ...data } : f))
    try {
      await updateFeatureDoc(projectId, featureId, data)
    } catch (err) {
      console.error('[useFeatures] update failed:', err)
    }
  }, [projectId])

  const deleteFeature = useCallback(async (featureId: string) => {
    setFeatures(prev => prev.filter(f => f.id !== featureId))
    try {
      await deleteFeatureDoc(projectId, featureId)
    } catch (err) {
      console.error('[useFeatures] delete failed:', err)
    }
  }, [projectId])

  return { features, addFeature, updateFeature, deleteFeature }
}
