import { useState, useEffect, useCallback, useRef } from 'react'
import type { Form2Row, Form2RowInput, Form2RowUpdateInput } from '../types/form2Types'
import {
  subscribeToForm2Rows,
  addForm2RowDoc,
  updateForm2RowDoc,
  deleteForm2RowDoc,
} from '../services/form2Service'

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

  const pendingTempIds = useRef(new Set<string>())
  const debounces = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

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
        return [...firestoreRows, ...activeTemps]
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
    // Optimistic update + debounced Firestore write
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...data } : r))

    const existing = debounces.current.get(rowId)
    if (existing) clearTimeout(existing)
    debounces.current.set(rowId, setTimeout(async () => {
      try {
        await updateForm2RowDoc(projectId, rowId, data)
      } catch (err) {
        console.error('[useForm2] update row failed:', err)
      }
    }, 600))
  }, [projectId])

  const deleteRow = useCallback(async (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
    try {
      await deleteForm2RowDoc(projectId, rowId)
    } catch (err) {
      console.error('[useForm2] delete row failed:', err)
    }
  }, [projectId])

  useEffect(() => {
    const pending = debounces.current
    return () => pending.forEach(clearTimeout)
  }, [])

  return { rows, isLoaded, addRow, updateRow, deleteRow }
}
