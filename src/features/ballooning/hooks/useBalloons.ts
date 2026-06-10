import { useState, useCallback, useEffect } from 'react'
import type { Balloon } from '../types/balloonTypes'
import {
  loadBalloons,
  addBalloonDoc,
  updateBalloonPositionDoc,
  deleteBalloonDoc,
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

  useEffect(() => {
    if (!projectId) return
    console.log('[useBalloons] loading balloons for project:', projectId)
    loadBalloons(projectId)
      .then(loaded => {
        console.log('[useBalloons] loaded', loaded.length, 'balloons')
        setBalloons(loaded)
      })
      .catch(err => console.error('[useBalloons] load failed:', err))
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
    console.log('[useBalloons] addBalloon called — projectId:', projectId, '| userId:', userId, '| page:', pageNumber, '| x:', xPercent.toFixed(4), 'y:', yPercent.toFixed(4))
    if (!projectId || !userId) {
      console.warn('[useBalloons] addBalloon BLOCKED — missing projectId or userId')
      return
    }

    const nextNumber = balloons.length === 0
      ? 1
      : Math.max(...balloons.map(b => b.balloonNumber)) + 1

    // Use a stable temp ID for optimistic update; replaced with Firestore ID on success
    const tempId = `__temp_${Date.now()}`
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

    console.log('[useBalloons] optimistic balloon created — tempId:', tempId, '| balloonNumber:', nextNumber)
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
      console.log('[useBalloons] Firestore write SUCCESS — realId:', realId)
      setBalloons(prev => prev.map(b => b.id === tempId ? { ...b, id: realId } : b))
      setSelectedId(realId)
    } catch (err) {
      console.error('[useBalloons] Firestore write FAILED:', err)
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
    setSelectedId(null)
    setBalloons(prev => prev.filter(b => b.id !== id))
    try {
      await deleteBalloonDoc(projectId, id)
    } catch (err) {
      console.error('[Balloons] Delete failed:', err)
    }
  }, [selectedId, projectId])

  return {
    balloons,
    selectedId,
    isBalloonMode,
    setSelectedId,
    setBalloonMode,
    toggleBalloonMode,
    addBalloon,
    moveBalloon,
    deleteSelected,
  }
}
