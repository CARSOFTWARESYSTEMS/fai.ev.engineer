import * as XLSX from 'xlsx'
import type { Form2Row } from '../types/form2Types'

const COLUMNS = [
  { key: 'rowOrder',                      label: '#',                                  wch: 6  },
  { key: 'materialOrProcessName',         label: 'Material / Process Name',            wch: 30 },
  { key: 'specificationNumber',           label: 'Specification Number',               wch: 24 },
  { key: 'code',                          label: 'Code',                               wch: 12 },
  { key: 'supplierName',                  label: 'Supplier Name',                      wch: 26 },
  { key: 'supplierAddress',               label: 'Supplier Address',                   wch: 30 },
  { key: 'supplierCode',                  label: 'Supplier Code',                      wch: 18 },
  { key: 'customerApprovalVerification',  label: 'Customer Approval Verification',     wch: 30 },
  { key: 'certificateOfConformanceNumber',label: 'CoC Number',                         wch: 22 },
  { key: 'acceptanceReportNumber',        label: 'Acceptance Report Number',           wch: 26 },
  { key: 'comments',                      label: 'Comments',                           wch: 36 },
] as const

type ColKey = (typeof COLUMNS)[number]['key']

function toRows(rows: Form2Row[]) {
  const sorted = [...rows].sort((a, b) => a.rowOrder - b.rowOrder)
  return sorted.map(r =>
    Object.fromEntries(
      COLUMNS.map(c => [c.label, r[c.key as ColKey] ?? ''])
    )
  )
}

function buildWorkbook(rows: Form2Row[]): XLSX.WorkBook {
  const ws = XLSX.utils.json_to_sheet(toRows(rows))
  ws['!cols'] = COLUMNS.map(c => ({ wch: c.wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'AS9102 Form 2')
  return wb
}

function fileName(fairId: string, ext: string): string {
  const safe = (fairId || 'Form2').replace(/[^\w-]/g, '_')
  return `AS9102_Form2_${safe}.${ext}`
}

export function exportForm2Excel(rows: Form2Row[], fairIdentifier: string): void {
  XLSX.writeFile(buildWorkbook(rows), fileName(fairIdentifier, 'xlsx'))
}

export function exportForm2CSV(rows: Form2Row[], fairIdentifier: string): void {
  const sorted = [...rows].sort((a, b) => a.rowOrder - b.rowOrder)
  const header = COLUMNS.map(c => `"${c.label}"`).join(',')
  const body = sorted.map(r =>
    COLUMNS.map(c => `"${String(r[c.key as ColKey] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [header, ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName(fairIdentifier, 'csv')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildForm2WorkbookBytes(rows: Form2Row[]): Uint8Array {
  return XLSX.write(buildWorkbook(rows), { bookType: 'xlsx', type: 'array' }) as Uint8Array
}
