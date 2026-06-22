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
  isReadOnly?: boolean
}

interface PendingBalloonDelete {
  id: string
  snapshot: Balloon
  timerId: ReturnType<typeof setTimeout>
}

const BALLOON_MODE_KEY = 'fai-balloon-placement-enabled'

export function useBalloons({ projectId, userId, isReadOnly = false }: UseBalloonProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isBalloonMode, setIsBalloonMode] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState<string | null>(null)

  // Track temp IDs for optimistic placement so onSnapshot doesn't remove them before Firestore confirms
  const pendingTempIds = useRef(new Set<string>())
  // Track IDs that are "logically deleted" in the UI but not yet in Firestore (undo window)
  const pendingDeleteIds = useRef(new Set<string>())
  const pendingDeleteRef = useRef<PendingBalloonDelete | null>(null)

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
        // Exclude balloons that are in the undo window (not yet deleted from Firestore)
        const filtered = firestoreBalloons.filter(b => !pendingDeleteIds.current.has(b.id))
        return [...filtered, ...activeTemps]
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
    if (isReadOnly) return
    setIsBalloonMode(current => {
      const next = !current
      localStorage.setItem(BALLOON_MODE_KEY, String(next))
      return next
    })
    setSelectedId(null)
  }, [isReadOnly])

  const addBalloon = useCallback(async (
    pageNumber: number,
    xPercent: number,
    yPercent: number,
  ) => {
    if (isReadOnly || !projectId || !userId) return

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
      setBalloons(prev => prev.filter(b => b.id !== tempId))
    } catch (err) {
      console.error('[useBalloons] Firestore write FAILED:', err)
      pendingTempIds.current.delete(tempId)
      setBalloons(prev => prev.filter(b => b.id !== tempId))
      setSelectedId(null)
    }
  }, [balloons, projectId, userId])

  const moveBalloon = useCallback(async (id: string, xPercent: number, yPercent: number) => {
    if (isReadOnly) return
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, xPercent, yPercent } : b))
    try {
      await updateBalloonPositionDoc(projectId, id, xPercent, yPercent)
    } catch (err) {
      console.error('[Balloons] Move failed:', err)
    }
  }, [isReadOnly, projectId])

  const deleteSelected = useCallback(async () => {
    if (isReadOnly || !selectedId) return
    const id = selectedId
    const snapshot = balloons.find(b => b.id === id)
    if (!snapshot) return

    // Flush any existing pending delete immediately
    if (pendingDeleteRef.current) {
      const prev = pendingDeleteRef.current
      clearTimeout(prev.timerId)
      pendingDeleteRef.current = null
      pendingDeleteIds.current.delete(prev.id)
      deleteBalloonDoc(projectId, prev.id).catch(err =>
        console.error('[useBalloons] deferred delete failed:', err),
      )
    }

    setDeleteError(null)
    setSelectedId(null)
    pendingDeleteIds.current.add(id)
    setBalloons(prev => prev.filter(b => b.id !== id))
    setPendingDeleteLabel(`Balloon #${snapshot.balloonNumber}`)

    const timerId = setTimeout(async () => {
      pendingDeleteRef.current = null
      pendingDeleteIds.current.delete(id)
      setPendingDeleteLabel(null)
      try {
        await deleteBalloonDoc(projectId, id)
      } catch (err) {
        console.error('[Balloons] Delete failed:', err)
        setBalloons(prev =>
          [...prev, snapshot].sort((a, b) => a.balloonNumber - b.balloonNumber),
        )
        setSelectedId(id)
        setDeleteError('Delete failed — balloon restored. Please try again.')
      }
    }, 5000)

    pendingDeleteRef.current = { id, snapshot, timerId }
  }, [isReadOnly, selectedId, projectId, balloons])

  const undoBalloonDelete = useCallback(() => {
    if (!pendingDeleteRef.current) return
    const { id, snapshot, timerId } = pendingDeleteRef.current
    clearTimeout(timerId)
    pendingDeleteRef.current = null
    pendingDeleteIds.current.delete(id)
    setPendingDeleteLabel(null)
    setBalloons(prev => [...prev, snapshot].sort((a, b) => a.balloonNumber - b.balloonNumber))
    setSelectedId(id)
  }, [])

  const dismissBalloonDeleteToast = useCallback(() => {
    if (!pendingDeleteRef.current) return
    const { id, snapshot, timerId } = pendingDeleteRef.current
    clearTimeout(timerId)
    pendingDeleteRef.current = null
    pendingDeleteIds.current.delete(id)
    setPendingDeleteLabel(null)
    deleteBalloonDoc(projectId, id).catch(err => {
      console.error('[useBalloons] delete failed after dismiss:', err)
      setBalloons(prev =>
        [...prev, snapshot].sort((a, b) => a.balloonNumber - b.balloonNumber),
      )
      setSelectedId(id)
      setDeleteError('Delete failed — balloon restored. Please try again.')
    })
  }, [projectId])

  const clearDeleteError = useCallback(() => setDeleteError(null), [])

  return {
    items: balloons,
    selectedId,
    isBalloonMode,
    deleteError,
    clearDeleteError,
    pendingDeleteLabel,
    setSelectedId,
    setBalloonMode,
    toggleBalloonMode,
    addBalloon,
    moveBalloon,
    deleteSelected,
    undoBalloonDelete,
    dismissBalloonDeleteToast,
  }
}
