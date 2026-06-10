export interface Balloon {
  id: string
  projectId: string
  pageNumber: number
  balloonNumber: number
  // Normalized coordinates (0–1) in the page's canonical, unrotated coordinate space.
  // Viewer rotation is applied only while rendering and hit-testing.
  xPercent: number
  yPercent: number
  createdAt: unknown   // Firestore Timestamp
  updatedAt: unknown   // Firestore Timestamp
  createdBy: string    // userId
}
