import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Balloon } from '../../ballooning/types/balloonTypes'

const BALLOON_RADIUS = 10
const BALLOON_FONT_SIZE = 8

function balloonedFileName(sourceName: string): string {
  const baseName = sourceName.replace(/\.pdf$/i, '') || 'drawing'
  return `${baseName}_ballooned.pdf`
}

export async function exportBalloonedPdf(
  sourcePdfUrl: string,
  sourceName: string,
  balloons: Balloon[],
): Promise<void> {
  const response = await fetch(sourcePdfUrl)
  if (!response.ok) throw new Error(`PDF download failed (${response.status})`)

  const pdfBytes = await createBalloonedPdf(await response.arrayBuffer(), balloons)
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
    const textWidth = font.widthOfTextAtSize(label, BALLOON_FONT_SIZE)

    page.drawCircle({
      x,
      y,
      size: BALLOON_RADIUS,
      color: rgb(1, 0.78, 0.08),
      borderColor: rgb(0.72, 0.45, 0),
      borderWidth: 1.25,
    })
    page.drawText(label, {
      x: x - textWidth / 2,
      y: y - BALLOON_FONT_SIZE * 0.34,
      size: BALLOON_FONT_SIZE,
      font,
      color: rgb(0.2, 0.12, 0),
    })
  })

  return pdfDocument.save()
}
