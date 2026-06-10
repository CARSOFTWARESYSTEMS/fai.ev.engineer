import { useState, useEffect, useCallback, useRef } from 'react'
import type { Form2Row, Form2RowInput, Form2RowUpdateInput } from '../types/form2Types'
import {
  subscribeToForm2Rows,
  addForm2RowDoc,
  updateForm2RowDoc,
  deleteForm2RowDoc,
} from '../services/form2Service'

export type Form2SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface PendingDelete {
  id: string
  snapshot: Form2Row
  label: string
  timerId: ReturnType<typeof setTimeout>
}

const EMPTY_ROW_FIELDS: Omit<Form2RowInput, 'projectId' | 'rowOrder'> = {
  materialOrProcessName: '',
  specificationNumber: '',
  code: '',
  supplierName: '',
  supplierAddress: '',
  supplierCode: '',
  customerApprovalVerification: '',
  certificateOfConformanceNumber: '',
  acceptanceReportNumber: '',
  comments: '',
}

export function useForm2({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<Form2Row[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<Form2SaveStatus>('idle')
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState<string | null>(null)

  const pendingTempIds = useRef(new Set<string>())
  const pendingDeleteIds = useRef(new Set<string>())
  const pendingDeleteRef = useRef<PendingDelete | null>(null)
  const debounces = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingWriteCount = useRef(0)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!projectId) return
    setIsLoaded(false)
    const unsubscribe = subscribeToForm2Rows(projectId, firestoreRows => {
      setRows(prev => {
        const firestoreIds = new Set(firestoreRows.map(r => r.id))
        const activeTemps = prev.filter(
          r => r.id.startsWith('__temp_') &&
               pendingTempIds.current.has(r.id) &&
               !firestoreIds.has(r.id),
        )
        const filtered = firestoreRows.filter(r => !pendingDeleteIds.current.has(r.id))
        return [...filtered, ...activeTemps]
      })
      setIsLoaded(true)
    })
    return unsubscribe
  }, [projectId])

  const addRow = useCallback(async () => {
    if (!projectId) return
    const nextOrder = rows.length === 0
      ? 1
      : Math.max(...rows.map(r => r.rowOrder)) + 1
    const tempId = `__temp_${Date.now()}`
    pendingTempIds.current.add(tempId)
    const optimistic: Form2Row = {
      id: tempId,
      projectId,
      rowOrder: nextOrder,
      ...EMPTY_ROW_FIELDS,
      createdAt: null,
      updatedAt: null,
    }
    setRows(prev => [...prev, optimistic])
    try {
      await addForm2RowDoc(projectId, { projectId, rowOrder: nextOrder, ...EMPTY_ROW_FIELDS })
      pendingTempIds.current.delete(tempId)
      setRows(prev => prev.filter(r => r.id !== tempId))
    } catch (err) {
      console.error('[useForm2] add row failed:', err)
      pendingTempIds.current.delete(tempId)
      setRows(prev => prev.filter(r => r.id !== tempId))
    }
  }, [projectId, rows])

  const updateRow = useCallback((rowId: string, data: Form2RowUpdateInput) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...data } : r))
    setSaveStatus('saving')

    const existing = debounces.current.get(rowId)
    if (existing) clearTimeout(existing)
    debounces.current.set(rowId, setTimeout(async () => {
      pendingWriteCount.current++
      try {
        await updateForm2RowDoc(projectId, rowId, data)
      } catch (err) {
        console.error('[useForm2] update row failed:', err)
        setSaveStatus('error')
      } finally {
        pendingWriteCount.current--
        if (pendingWriteCount.current === 0) {
          setSaveStatus('saved')
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
        }
      }
    }, 600))
  }, [projectId])

  const deleteRow = useCallback((rowId: string) => {
    const snapshot = rows.find(r => r.id === rowId)
    if (!snapshot) return

    // Cancel any existing pending delete
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timerId)
      const prev = pendingDeleteRef.current
      pendingDeleteIds.current.delete(prev.id)
      deleteForm2RowDoc(projectId, prev.id).catch(err =>
        console.error('[useForm2] deferred delete failed:', err)
      )
    }

    const label = snapshot.materialOrProcessName?.trim() || `Row #${snapshot.rowOrder}`
    pendingDeleteIds.current.add(rowId)
    setRows(prev => prev.filter(r => r.id !== rowId))
    setPendingDeleteLabel(label)

    const timerId = setTimeout(async () => {
      pendingDeleteRef.current = null
      pendingDeleteIds.current.delete(rowId)
      setPendingDeleteLabel(null)
      try {
        await deleteForm2RowDoc(projectId, rowId)
      } catch (err) {
        console.error('[useForm2] deferred delete failed:', err)
        setRows(prev => {
          const sorted = [...prev, snapshot].sort((a, b) => a.rowOrder - b.rowOrder)
          return sorted
        })
      }
    }, 5000)

    pendingDeleteRef.current = { id: rowId, snapshot, label, timerId }
  }, [projectId, rows])

  const undoRowDelete = useCallback(() => {
    const pending = pendingDeleteRef.current
    if (!pending) return
    clearTimeout(pending.timerId)
    pendingDeleteRef.current = null
    pendingDeleteIds.current.delete(pending.id)
    setPendingDeleteLabel(null)
    // onSnapshot will restore the row automatically
  }, [])

  const dismissRowDeleteToast = useCallback(() => {
    const pending = pendingDeleteRef.current
    if (!pending) return
    clearTimeout(pending.timerId)
    pendingDeleteRef.current = null
    pendingDeleteIds.current.delete(pending.id)
    setPendingDeleteLabel(null)
    deleteForm2RowDoc(projectId, pending.id).catch(err =>
      console.error('[useForm2] dismiss delete failed:', err)
    )
  }, [projectId])

  useEffect(() => {
    const pending = debounces.current
    return () => pending.forEach(clearTimeout)
  }, [])

  return {
    rows,
    isLoaded,
    saveStatus,
    pendingDeleteLabel,
    addRow,
    updateRow,
    deleteRow,
    undoRowDelete,
    dismissRowDeleteToast,
  }
}
