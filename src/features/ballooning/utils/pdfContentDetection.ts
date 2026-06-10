export function isPointNearPdfContent(
  canvas: HTMLCanvasElement | null,
  xPercent: number,
  yPercent: number,
): boolean {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return true

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return true

  const centerX = Math.round(xPercent * canvas.width)
  const centerY = Math.round(yPercent * canvas.height)
  const radius = Math.max(6, Math.round(Math.min(canvas.width, canvas.height) * 0.012))
  const left = Math.max(0, centerX - radius)
  const top = Math.max(0, centerY - radius)
  const width = Math.min(canvas.width - left, radius * 2 + 1)
  const height = Math.min(canvas.height - top, radius * 2 + 1)

  try {
    const { data } = context.getImageData(left, top, width, height)
    let contentPixels = 0

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3] / 255
      const red = data[index] * alpha + 255 * (1 - alpha)
      const green = data[index + 1] * alpha + 255 * (1 - alpha)
      const blue = data[index + 2] * alpha + 255 * (1 - alpha)

      if (Math.min(red, green, blue) < 235) {
        contentPixels += 1
        if (contentPixels >= 2) return true
      }
    }
  } catch {
    // A failed canvas read should never block balloon placement.
    return true
  }

  return false
}
