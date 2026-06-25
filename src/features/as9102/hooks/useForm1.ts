import { useState, useEffect, useCallback, useRef } from 'react'
import type { Form1Data, Form1Input } from '../types/form1Types'
import { loadForm1, saveForm1 } from '../services/form1Service'

export type Form1SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const EMPTY_FORM: Form1Input = {
  projectId: '',
  fairIdentifier: '',
  fairType: '',
  fairScope: '',
  reasonForFair: '',
  partNumber: '',
  partName: '',
  partRevisionLevel: '',
  drawingNumber: '',
  drawingRevisionLevel: '',
  additionalChanges: '',
  manufacturingProcessReference: '',
  organizationName: '',
  supplierCode: '',
  purchaseOrderNumber: '',
  baselinePartNumber: '',
  containsNonconformance: '',
  fairVerifiedBy: '',
  verifiedDate: '',
  fairReviewedBy: '',
  reviewedDate: '',
  customerApproval: '',
  customerApprovalDate: '',
  comments: '',
}

export function useForm1({ projectId, isReadOnly = false }: { projectId: string; isReadOnly?: boolean }) {
  const [data, setData] = useState<Form1Input>({ ...EMPTY_FORM, projectId })
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<Form1SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!projectId) return
    setIsLoaded(false)
    loadForm1(projectId)
      .then(loaded => {
        if (loaded) {
          const { updatedAt: _, ...rest } = loaded as Form1Data
          setData({ ...EMPTY_FORM, ...rest, projectId })
        } else {
          setData({ ...EMPTY_FORM, projectId })
        }
        setIsLoaded(true)
      })
      .catch(err => {
        console.error('[useForm1] load failed:', err)
        setIsLoaded(true)
      })
  }, [projectId])

  const updateField = useCallback(<K extends keyof Form1Input>(key: K, value: Form1Input[K]) => {
    if (isReadOnly) return
    setData(prev => {
      const next = { ...prev, [key]: value }

      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSaveStatus('saving')

      debounceRef.current = setTimeout(async () => {
        try {
          await saveForm1(projectId, next)
          setSaveStatus('saved')
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(
            () => setSaveStatus(s => (s === 'saved' ? 'idle' : s)),
            2500,
          )
        } catch (err) {
          console.error('[useForm1] save failed:', err)
          setSaveStatus('error')
        }
      }, 800)

      return next
    })
  }, [projectId, isReadOnly])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  return { data, isLoaded, saveStatus, updateField }
}
