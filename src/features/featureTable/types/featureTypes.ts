export type FeatureType =
  | 'Linear'
  | 'Diameter'
  | 'Radius'
  | 'Angle'
  | 'Thread'
  | 'GD&T'
  | 'Datum'
  | 'Surface Finish'
  | 'Note'

export const FEATURE_TYPES: FeatureType[] = [
  'Linear', 'Diameter', 'Radius', 'Angle',
  'Thread', 'GD&T', 'Datum', 'Surface Finish', 'Note',
]

export interface Feature {
  id: string
  projectId: string
  balloonId: string
  balloonNumber: number
  pageNumber?: number
  featureNumber: number
  type: FeatureType
  nominal: string
  tolerance: string
  min: string
  max: string
  units: string
  comments: string
  createdAt: unknown   // Firestore Timestamp
  updatedAt: unknown   // Firestore Timestamp
  createdBy: string    // userId
}

// Fields the user fills in the editor form (no server-managed fields)
export interface FeatureFormData {
  featureNumber: number
  type: FeatureType
  nominal: string
  tolerance: string
  min: string
  max: string
  units: string
  comments: string
}

// Full write payload sent to Firestore on create
export type FeatureInput = Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>

// Subset allowed on update
export type FeatureUpdateInput = Partial<FeatureFormData>
