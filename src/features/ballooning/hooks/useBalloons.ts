import { useState, useCallback, useEffect, useRef } from 'react'
import type { Balloon } from '../types/balloonTypes'
import {
  addBalloonDoc,
  updateBalloonPositionDoc,
  deleteBalloonDoc,
  subscribeToBalloons,
} from '../services/balloonService'

interface UseBalloonProps {
  projectId: string
  userId: string
}

const BALLOON_MODE_KEY = 'fai-balloon-placement-enabled'

export function useBalloons({ projectId, userId }: UseBalloonProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isBalloonMode, setIsBalloonMode] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Track temp IDs for optimistic balloon placement so onSnapshot doesn't remove them
  // before Firestore confirms the write
  const pendingTempIds = useRef(new Set<string>())

  useEffect(() => {
    if (!projectId) return
    const unsubscribe = subscribeToBalloons(projectId, firestoreBalloons => {
      setBalloons(prev => {
        const firestoreIds = new Set(firestoreBalloons.map(b => b.id))
        const activeTemps = prev.filter(
          b => b.id.startsWith('__temp_') &&
               pendingTempIds.current.has(b.id) &&
               !firestoreIds.has(b.id),
        )
        return [...firestoreBalloons, ...activeTemps]
      })
    })
    return unsubscribe
  }, [projectId])

  const setBalloonMode = useCallback((enabled: boolean) => {
    setIsBalloonMode(enabled)
    localStorage.setItem(BALLOON_MODE_KEY, String(enabled))
    setSelectedId(null)
  }, [])

  const toggleBalloonMode = useCallback(() => {
    setIsBalloonMode(current => {
      const next = !current
      localStorage.setItem(BALLOON_MODE_KEY, String(next))
      return next
    })
    setSelectedId(null)
  }, [])

  const addBalloon = useCallback(async (
    pageNumber: number,
    xPercent: number,
    yPercent: number,
  ) => {
    if (!projectId || !userId) return

    const nextNumber = balloons.length === 0
      ? 1
      : Math.max(...balloons.map(b => b.balloonNumber)) + 1

    const tempId = `__temp_${Date.now()}`
    pendingTempIds.current.add(tempId)
    const optimistic: Balloon = {
      id: tempId,
      projectId,
      pageNumber,
      balloonNumber: nextNumber,
      xPercent,
      yPercent,
      createdAt: null,
      updatedAt: null,
      createdBy: userId,
    }
    setBalloons(prev => [...prev, optimistic])
    setSelectedId(tempId)

    try {
      const realId = await addBalloonDoc(projectId, {
        projectId,
        pageNumber,
        balloonNumber: nextNumber,
        xPercent,
        yPercent,
        createdBy: userId,
      })
      pendingTempIds.current.delete(tempId)
      setSelectedId(realId)
      // Remove the optimistic temp; onSnapshot will have already added the real doc
      setBalloons(prev => prev.filter(b => b.id !== tempId))
    } catch (err) {
      console.error('[useBalloons] Firestore write FAILED:', err)
      pendingTempIds.current.delete(tempId)
      setBalloons(prev => prev.filter(b => b.id !== tempId))
      setSelectedId(null)
    }
  }, [balloons, projectId, userId])

  const moveBalloon = useCallback(async (id: string, xPercent: number, yPercent: number) => {
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, xPercent, yPercent } : b))
    try {
      await updateBalloonPositionDoc(projectId, id, xPercent, yPercent)
    } catch (err) {
      console.error('[Balloons] Move failed:', err)
    }
  }, [projectId])

  const deleteSelected = useCallback(async () => {
    if (!selectedId) return
    const id = selectedId
    const snapshot = balloons.find(b => b.id === id)
    if (!snapshot) return

    setDeleteError(null)
    setSelectedId(null)
    setBalloons(prev => prev.filter(b => b.id !== id))

    try {
      await deleteBalloonDoc(projectId, id)
    } catch (err) {
      console.error('[Balloons] Delete failed:', err)
      // Rollback: restore balloon in sorted order
      setBalloons(prev =>
        [...prev, snapshot].sort((a, b) => a.balloonNumber - b.balloonNumber),
      )
      setSelectedId(id)
      setDeleteError('Delete failed — balloon restored. Please try again.')
    }
  }, [selectedId, projectId, balloons])

  const clearDeleteError = useCallback(() => setDeleteError(null), [])

  return {
    balloons,
    selectedId,
    isBalloonMode,
    deleteError,
    clearDeleteError,
    setSelectedId,
    setBalloonMode,
    toggleBalloonMode,
    addBalloon,
    moveBalloon,
    deleteSelected,
  }
}
