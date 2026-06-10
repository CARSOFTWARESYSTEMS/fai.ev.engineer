import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Form3Status } from '../../as9102/types/form3Types'
import { BALLOON_VISUALS, getBalloonStatusColor } from '../../ballooning/utils/balloonVisuals.ts'

function pdfColor(hex: string) {
  const value = hex.replace('#', '')
  return rgb(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  )
}

function balloonedFileName(sourceName: string): string {
  const baseName = sourceName.replace(/\.pdf$/i, '') || 'drawing'
  return `${baseName}_ballooned.pdf`
}

export async function exportBalloonedPdf(
  sourcePdfUrl: string,
  sourceName: string,
  balloons: Balloon[],
  statusByBalloonId: ReadonlyMap<string, Form3Status>,
): Promise<void> {
  const response = await fetch(sourcePdfUrl)
  if (!response.ok) throw new Error(`PDF download failed (${response.status})`)

  const pdfBytes = await createBalloonedPdf(
    await response.arrayBuffer(),
    balloons,
    statusByBalloonId,
  )
  const pdfBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
  const downloadUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = balloonedFileName(sourceName)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
}

export async function createBalloonedPdf(
  sourcePdf: ArrayBuffer | Uint8Array,
  balloons: Balloon[],
  statusByBalloonId: ReadonlyMap<string, Form3Status> = new Map(),
): Promise<Uint8Array> {
  const pdfDocument = await PDFDocument.load(sourcePdf)
  const font = await pdfDocument.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDocument.getPages()

  balloons.forEach(balloon => {
    const page = pages[balloon.pageNumber - 1]
    if (!page) return

    const { width, height } = page.getSize()
    const x = balloon.xPercent * width
    const y = (1 - balloon.yPercent) * height
    const label = String(balloon.balloonNumber)
    const status = statusByBalloonId.get(balloon.id) ?? 'pending'
    const textWidth = font.widthOfTextAtSize(label, BALLOON_VISUALS.pdf.fontSize)

    page.drawCircle({
      x,
      y,
      size: BALLOON_VISUALS.pdf.outerRadius,
      color: pdfColor(getBalloonStatusColor(status)),
    })
    page.drawCircle({
      x,
      y,
      size: BALLOON_VISUALS.pdf.gapRadius,
      color: pdfColor(BALLOON_VISUALS.gap),
    })
    page.drawCircle({
      x,
      y,
      size: BALLOON_VISUALS.pdf.innerRadius,
      color: pdfColor(BALLOON_VISUALS.fill),
    })
    page.drawText(label, {
      x: x - textWidth / 2,
      y: y - BALLOON_VISUALS.pdf.fontSize * 0.34,
      size: BALLOON_VISUALS.pdf.fontSize,
      font,
      color: pdfColor(BALLOON_VISUALS.text),
    })
  })

  return pdfDocument.save()
}
