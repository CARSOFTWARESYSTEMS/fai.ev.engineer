export interface Balloon {
  id: string
  projectId: string
  pageNumber: number
  balloonNumber: number
  // Normalized coordinates (0–1) relative to the rendered page at click time.
  // This keeps balloons in the correct position across zoom, fit-width, fit-page,
  // and rotation changes, because the overlay div is always the same size as the page.
  xPercent: number
  yPercent: number
  createdAt: unknown   // Firestore Timestamp
  updatedAt: unknown   // Firestore Timestamp
  createdBy: string    // userId
}
