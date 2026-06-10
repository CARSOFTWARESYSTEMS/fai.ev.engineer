import * as XLSX from 'xlsx'
import type { Form1Data } from '../types/form1Types'

const COLUMNS = [
  { key: 'fairIdentifier',               label: 'FAIR Identifier',                    wch: 22 },
  { key: 'fairType',                     label: 'FAIR Type',                          wch: 16 },
  { key: 'fairScope',                    label: 'FAIR Scope',                         wch: 16 },
  { key: 'reasonForFair',                label: 'Reason for FAIR',                    wch: 40 },
  { key: 'partNumber',                   label: 'Part Number',                        wch: 20 },
  { key: 'partName',                     label: 'Part Name',                          wch: 30 },
  { key: 'partRevisionLevel',            label: 'Part Revision Level',                wch: 18 },
  { key: 'drawingNumber',                label: 'Drawing Number',                     wch: 20 },
  { key: 'drawingRevisionLevel',         label: 'Drawing Revision Level',             wch: 22 },
  { key: 'additionalChanges',            label: 'Additional Changes',                 wch: 30 },
  { key: 'manufacturingProcessReference',label: 'Manufacturing Process Reference',    wch: 34 },
  { key: 'organizationName',             label: 'Organization Name',                  wch: 28 },
  { key: 'supplierCode',                 label: 'Supplier Code',                      wch: 18 },
  { key: 'purchaseOrderNumber',          label: 'Purchase Order Number',              wch: 24 },
  { key: 'baselinePartNumber',           label: 'Baseline Part Number',               wch: 26 },
  { key: 'containsNonconformance',       label: 'Contains Nonconformance',            wch: 24 },
  { key: 'fairVerifiedBy',               label: 'FAIR Verified By',                   wch: 24 },
  { key: 'verifiedDate',                 label: 'Verified Date',                      wch: 16 },
  { key: 'fairReviewedBy',               label: 'FAIR Reviewed / Approved By',        wch: 28 },
  { key: 'reviewedDate',                 label: 'Reviewed Date',                      wch: 16 },
  { key: 'customerApproval',             label: 'Customer Approval',                  wch: 26 },
  { key: 'customerApprovalDate',         label: 'Customer Approval Date',             wch: 22 },
  { key: 'comments',                     label: 'Comments',                           wch: 40 },
] as const

type ColKey = (typeof COLUMNS)[number]['key']

function toRow(data: Partial<Form1Data>) {
  return Object.fromEntries(
    COLUMNS.map(c => [c.label, (data[c.key as ColKey] as string | undefined) ?? ''])
  )
}

function buildWorkbook(data: Partial<Form1Data>): XLSX.WorkBook {
  const ws = XLSX.utils.json_to_sheet([toRow(data)])
  ws['!cols'] = COLUMNS.map(c => ({ wch: c.wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'AS9102 Form 1')
  return wb
}

function fileName(fairId: string, ext: string): string {
  const safe = (fairId || 'Form1').replace(/[^\w-]/g, '_')
  return `AS9102_Form1_${safe}.${ext}`
}

export function exportForm1Excel(data: Partial<Form1Data>): void {
  XLSX.writeFile(buildWorkbook(data), fileName(data.fairIdentifier ?? '', 'xlsx'))
}

export function exportForm1CSV(data: Partial<Form1Data>): void {
  const header = COLUMNS.map(c => `"${c.label}"`).join(',')
  const body = COLUMNS.map(c => `"${String((data[c.key as ColKey] as string | undefined) ?? '').replace(/"/g, '""')}"`).join(',')
  const csv = [header, body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName(data.fairIdentifier ?? '', 'csv')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildForm1WorkbookBytes(data: Partial<Form1Data>): Uint8Array {
  return XLSX.write(buildWorkbook(data), { bookType: 'xlsx', type: 'array' }) as Uint8Array
}
