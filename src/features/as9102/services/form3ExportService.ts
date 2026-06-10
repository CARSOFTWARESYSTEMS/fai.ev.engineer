import * as XLSX from 'xlsx'
import type { Form3Row } from '../types/form3Types'

const COLUMNS = [
  { key: 'characteristicNumber', label: 'Char No',             wch: 10 },
  { key: 'balloonNumber',        label: 'Balloon No',          wch: 12 },
  { key: 'pageNumber',           label: 'Page No',             wch: 10 },
  { key: 'characteristicType',   label: 'Characteristic Type', wch: 20 },
  { key: 'drawingRequirement',   label: 'Drawing Requirement', wch: 26 },
  { key: 'nominal',              label: 'Nominal',             wch: 12 },
  { key: 'tolerance',            label: 'Tolerance',           wch: 14 },
  { key: 'min',                  label: 'Min',                 wch: 12 },
  { key: 'max',                  label: 'Max',                 wch: 12 },
  { key: 'units',                label: 'Units',               wch: 10 },
  { key: 'result',               label: 'Result',              wch: 16 },
  { key: 'status',               label: 'Status',              wch: 10 },
  { key: 'inspectorNotes',       label: 'Inspector Notes',     wch: 32 },
] as const

function toRows(rows: Form3Row[]) {
  return rows.map(r =>
    Object.fromEntries(
      COLUMNS.map(c => [c.label, r[c.key] ?? ''])
    )
  )
}

function fileName(projectName: string, ext: string) {
  const date = new Date().toISOString().slice(0, 10)
  const safe = projectName.replace(/[^\w-]/g, '_')
  return `AS9102_Form3_${safe}_${date}.${ext}`
}

export function exportForm3Excel(rows: Form3Row[], projectName: string): void {
  const ws = XLSX.utils.json_to_sheet(toRows(rows))
  ws['!cols'] = COLUMNS.map(c => ({ wch: c.wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'AS9102 Form 3')
  XLSX.writeFile(wb, fileName(projectName, 'xlsx'))
}

export function exportForm3CSV(rows: Form3Row[], projectName: string): void {
  const header = COLUMNS.map(c => `"${c.label}"`).join(',')
  const body = rows.map(r =>
    COLUMNS.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [header, ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName(projectName, 'csv')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
