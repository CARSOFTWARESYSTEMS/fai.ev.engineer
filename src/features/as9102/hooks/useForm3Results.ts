import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type {
  Form3Result,
  Form3ResultInput,
  Form3ResultFields,
  Form3Row,
} from '../types/form3Types'
import { loadForm3Results, upsertForm3ResultDoc } from '../services/form3Service'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseForm3ResultsProps {
  projectId: string
  userId: string
  features: Feature[]
  balloons: Balloon[]
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
}: UseForm3ResultsProps) {
  const [results, setResults] = useState<Map<string, Form3Result>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounces = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stores the latest uncommitted write data per featureId so we can flush on tab hide
  const pendingWriteData = useRef<Map<string, PendingWriteEntry>>(new Map())

  useEffect(() => {
    if (!projectId) return
    setIsLoaded(false)
    loadForm3Results(projectId)
      .then(map => {
        setResults(map)
        setIsLoaded(true)
      })
      .catch(err => {
        console.error('[useForm3Results] load failed:', err)
        setIsLoaded(true)
      })
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

    // Track latest pending data so visibilitychange can flush it
    pendingWriteData.current.set(featureId, { balloonId, characteristicNumber, fields: { ...fields } })

    // Debounced Firestore write
    const pending = debounces.current.get(featureId)
    if (pending) clearTimeout(pending)
    setSaveStatus('saving')

    debounces.current.set(
      featureId,
      setTimeout(async () => {
        pendingWriteData.current.delete(featureId)
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
        }
      }, 800),
    )
  }, [projectId, userId])

  // Flush pending writes immediately when the tab becomes hidden (browser close, tab switch)
  // to minimise data loss from the 800ms debounce window.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      const pending = Array.from(pendingWriteData.current.entries())
      if (pending.length === 0) return

      // Cancel timers and write immediately
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
      ).catch(() => {/* best-effort; errors are non-actionable on tab hide */})
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
