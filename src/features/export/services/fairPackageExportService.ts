import JSZip from 'jszip'
import type { Form1Data } from '../../as9102/types/form1Types'
import type { Form2Row } from '../../as9102/types/form2Types'
import type { Form3Row } from '../../as9102/types/form3Types'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Form3Status } from '../../as9102/types/form3Types'
import { buildForm1WorkbookBytes } from '../../as9102/services/form1ExportService'
import { buildForm2WorkbookBytes } from '../../as9102/services/form2ExportService'
import { buildForm3WorkbookBytes } from '../../as9102/services/form3ExportService'
import { buildFeaturesWorkbookBytes } from './excelExportService'
import { createBalloonedPdf } from './balloonedPdfExportService'

export interface FairPackageInput {
  form1: Partial<Form1Data>
  form2Rows: Form2Row[]
  form3Rows: Form3Row[]
  features: Feature[]
  balloons: Balloon[]
  statusByBalloonId: ReadonlyMap<string, Form3Status>
  pdfBlobUrl: string
  sourcePdfName: string
}

function zipFileName(form1: Partial<Form1Data>): string {
  const part = (form1.partNumber || 'Part').replace(/[^\w-]/g, '_')
  const fair = (form1.fairIdentifier || 'FAIR').replace(/[^\w-]/g, '_')
  return `FAIR_Package_${part}_${fair}.zip`
}

export async function exportFairPackage(input: FairPackageInput): Promise<void> {
  const {
    form1, form2Rows, form3Rows, features, balloons,
    statusByBalloonId, pdfBlobUrl,
  } = input

  const zip = new JSZip()

  // Ballooned drawing PDF
  const pdfResponse = await fetch(pdfBlobUrl)
  if (!pdfResponse.ok) throw new Error(`PDF fetch failed (${pdfResponse.status})`)
  const pdfArrayBuffer = await pdfResponse.arrayBuffer()
  const pdfBytes = await createBalloonedPdf(pdfArrayBuffer, balloons, statusByBalloonId)
  zip.file('Ballooned_Drawing.pdf', pdfBytes)

  // XLSX workbooks
  zip.file('Form1.xlsx', buildForm1WorkbookBytes(form1))
  zip.file('Form2.xlsx', buildForm2WorkbookBytes(form2Rows))
  zip.file('Form3.xlsx', buildForm3WorkbookBytes(form3Rows))
  zip.file('Features.xlsx', buildFeaturesWorkbookBytes(features, balloons))

  // Future placeholder folders
  zip.folder('Certificates')
  zip.folder('Supplier_FAIRs')
  zip.folder('Attachments')

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = zipFileName(form1)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

}
