import type { PdfRotation } from '../../pdfViewer/types/pdfViewerTypes'

export interface NormalizedPoint {
  x: number
  y: number
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function rotateBalloonPoint(
  point: NormalizedPoint,
  rotation: PdfRotation,
): NormalizedPoint {
  switch (rotation) {
    case 90:
      return { x: 1 - point.y, y: point.x }
    case 180:
      return { x: 1 - point.x, y: 1 - point.y }
    case 270:
      return { x: point.y, y: 1 - point.x }
    default:
      return point
  }
}

export function unrotateBalloonPoint(
  point: NormalizedPoint,
  rotation: PdfRotation,
): NormalizedPoint {
  const inverseRotation = ((360 - rotation) % 360) as PdfRotation
  const unrotated = rotateBalloonPoint(point, inverseRotation)
  return { x: clamp(unrotated.x), y: clamp(unrotated.y) }
}
