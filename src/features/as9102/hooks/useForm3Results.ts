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

function buildDrawingRequirement(f: { nominal: string; tolerance: string; units: string }): string {
  return [f.nominal, f.tolerance, f.units].filter(Boolean).join(' ')
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
        return {
          featureId: f.id,
          balloonId: f.balloonId,
          characteristicNumber: f.featureNumber,
          balloonNumber: f.balloonNumber,
          pageNumber: balloon?.pageNumber ?? 0,
          characteristicType: f.type,
          drawingRequirement: buildDrawingRequirement(f),
          nominal: f.nominal,
          tolerance: f.tolerance,
          min: f.min,
          max: f.max,
          units: f.units,
          featureComments: f.comments,
          result: saved?.result ?? '',
          status: saved?.status ?? 'pending',
          inspectorNotes: saved?.inspectorNotes ?? '',
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
        }
      }, 800),
    )
  }, [projectId, userId])

  return { rows, isLoaded, saveStatus, updateRow }
}
