import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type {
  Form3Result,
  Form3ResultInput,
  Form3ResultFields,
  Form3Row,
} from '../types/form3Types'
import { subscribeToForm3Results, upsertForm3ResultDoc } from '../services/form3Service'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseForm3ResultsProps {
  projectId:  string
  userId:     string
  features:   Feature[]
  balloons:   Balloon[]
  isReadOnly?: boolean
}

function buildDesignRequirement(f: {
  type: string
  nominal: string
  tolerance: string
  units: string
}): string {
  return [f.type, f.nominal, f.tolerance, f.units].filter(Boolean).join(' · ')
}

interface PendingWriteEntry {
  balloonId: string
  characteristicNumber: number
  fields: Form3ResultFields
}

export function useForm3Results({
  projectId,
  userId,
  features,
  balloons,
  isReadOnly = false,
}: UseForm3ResultsProps) {
  const [results, setResults] = useState<Map<string, Form3Result>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounces = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks the latest uncommitted write per featureId so snapshot doesn't overwrite optimistic state
  const pendingWriteData = useRef<Map<string, PendingWriteEntry>>(new Map())

  useEffect(() => {
    if (!projectId) return
    setIsLoaded(false)

    const unsubscribe = subscribeToForm3Results(projectId, firestoreResults => {
      setResults(prev => {
        const next = new Map<string, Form3Result>()
        // Apply all Firestore results except those with pending local writes
        firestoreResults.forEach(r => {
          if (!pendingWriteData.current.has(r.featureId)) {
            next.set(r.featureId, r)
          }
        })
        // Keep optimistic state for pending writes
        prev.forEach((v, featureId) => {
          if (pendingWriteData.current.has(featureId)) {
            next.set(featureId, v)
          }
        })
        return next
      })
      setIsLoaded(true)
    })

    return unsubscribe
  }, [projectId])

  const rows: Form3Row[] = useMemo(() => {
    return [...features]
      .sort((a, b) => a.featureNumber - b.featureNumber)
      .map(f => {
        const balloon = balloons.find(b => b.id === f.balloonId)
        const saved = results.get(f.id)
        const isLinked = !!balloon &&
          balloon.balloonNumber === f.balloonNumber &&
          (f.pageNumber === undefined || f.pageNumber === balloon.pageNumber)
        const result = saved?.result ?? ''
        const status = saved?.status === 'pass' && !result.trim()
          ? 'pending'
          : saved?.status ?? 'pending'
        return {
          featureId: f.id,
          balloonId: f.balloonId,
          characteristicNumber: f.featureNumber,
          balloonNumber: f.balloonNumber,
          pageNumber: f.pageNumber ?? balloon?.pageNumber ?? 0,
          isLinked,
          characteristicType: f.type,
          characteristicDesignRequirement: buildDesignRequirement(f),
          nominal: f.nominal,
          tolerance: f.tolerance,
          min: f.min,
          max: f.max,
          units: f.units,
          featureComments: f.comments,
          result,
          status,
          designedTooling: saved?.designedTooling ?? '',
          measurementEquipmentUsed: saved?.measurementEquipmentUsed ?? '',
          nonConformanceNumber: saved?.nonConformanceNumber ?? '',
          inspectorNotes: saved?.inspectorNotes ?? f.comments,
          isSaved: !!saved,
        }
      })
  }, [features, balloons, results])

  const updateRow = useCallback((
    featureId: string,
    balloonId: string,
    characteristicNumber: number,
    fields: Form3ResultFields,
  ) => {
    if (isReadOnly) return
    // Optimistic update
    setResults(prev => {
      const m = new Map(prev)
      const existing = m.get(featureId)
      m.set(featureId, {
        id: featureId,
        projectId,
        featureId,
        balloonId,
        characteristicNumber,
        createdBy: existing?.createdBy ?? userId,
        createdAt: existing?.createdAt ?? null,
        updatedAt: null,
        ...fields,
      })
      return m
    })

    // Track latest pending data so visibilitychange and snapshot merge can use it
    pendingWriteData.current.set(featureId, { balloonId, characteristicNumber, fields: { ...fields } })

    // Debounced Firestore write
    const pending = debounces.current.get(featureId)
    if (pending) clearTimeout(pending)
    setSaveStatus('saving')

    debounces.current.set(
      featureId,
      setTimeout(async () => {
        const input: Form3ResultInput = {
          projectId,
          featureId,
          balloonId,
          characteristicNumber,
          createdBy: userId,
          ...fields,
        }
        try {
          await upsertForm3ResultDoc(projectId, featureId, input)
          setSaveStatus('saved')
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(
            () => setSaveStatus(s => (s === 'saved' ? 'idle' : s)),
            2500,
          )
        } catch (err) {
          console.error('[useForm3Results] save failed:', err)
          setSaveStatus('error')
        } finally {
          pendingWriteData.current.delete(featureId)
        }
      }, 800),
    )
  }, [projectId, userId, isReadOnly])

  // Flush pending writes immediately when the tab becomes hidden
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      const pending = Array.from(pendingWriteData.current.entries())
      if (pending.length === 0) return

      pending.forEach(([fId]) => {
        const timer = debounces.current.get(fId)
        if (timer) {
          clearTimeout(timer)
          debounces.current.delete(fId)
        }
      })
      pendingWriteData.current.clear()

      Promise.allSettled(
        pending.map(([featureId, entry]) =>
          upsertForm3ResultDoc(projectId, featureId, {
            projectId,
            featureId,
            balloonId: entry.balloonId,
            characteristicNumber: entry.characteristicNumber,
            createdBy: userId,
            ...entry.fields,
          }),
        ),
      ).catch(() => {/* best-effort */})
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [projectId, userId])

  useEffect(() => {
    const pendingDebounces = debounces.current
    return () => {
      pendingDebounces.forEach(clearTimeout)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  return { rows, isLoaded, saveStatus, updateRow }
}
