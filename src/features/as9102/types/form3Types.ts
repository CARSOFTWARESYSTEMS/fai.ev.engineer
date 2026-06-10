export type Form3Status = 'pending' | 'pass' | 'fail'

export interface Form3Result {
  id: string          // = featureId (used as Firestore doc ID for 1:1 mapping)
  projectId: string
  featureId: string
  balloonId: string
  characteristicNumber: number
  result: string
  status: Form3Status
  designedTooling: string
  nonConformanceNumber: string
  inspectorNotes: string
  createdAt: unknown  // Firestore Timestamp
  updatedAt: unknown  // Firestore Timestamp
  createdBy: string
}

export type Form3ResultInput = Omit<Form3Result, 'id' | 'createdAt' | 'updatedAt'>

export type Form3ResultFields = Pick<
  Form3Result,
  'result' | 'status' | 'designedTooling' | 'nonConformanceNumber' | 'inspectorNotes'
>

// Computed display row — merges Feature + Balloon data with saved Form3Result
export interface Form3Row {
  featureId: string
  balloonId: string
  characteristicNumber: number
  balloonNumber: number
  pageNumber: number
  isLinked: boolean
  characteristicType: string
  characteristicDesignRequirement: string
  nominal: string
  tolerance: string
  min: string
  max: string
  units: string
  featureComments: string
  result: string
  status: Form3Status
  designedTooling: string
  nonConformanceNumber: string
  inspectorNotes: string
  isSaved: boolean
}
