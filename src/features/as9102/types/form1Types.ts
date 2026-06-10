// AS9102D Form 1 — Design Characteristics Accountability
// One document per project stored at: projects/{projectId}/form1/{projectId}

export type FairType = 'Detail' | 'Assembly'
export type FairScope = 'Full' | 'Partial'

export interface Form1Data {
  projectId: string

  // FAIR Header
  fairIdentifier: string           // required
  fairType: FairType | ''
  fairScope: FairScope | ''
  reasonForFair: string

  // Part Information
  partNumber: string
  partName: string
  partRevisionLevel: string
  drawingNumber: string
  drawingRevisionLevel: string
  additionalChanges: string

  // Manufacturing
  manufacturingProcessReference: string
  organizationName: string
  supplierCode: string
  purchaseOrderNumber: string

  // Baseline
  baselinePartNumber: string

  // Nonconformance
  containsNonconformance: 'Yes' | 'No' | ''

  // Verification
  fairVerifiedBy: string
  verifiedDate: string            // ISO date string
  fairReviewedBy: string
  reviewedDate: string            // ISO date string
  customerApproval: string
  customerApprovalDate: string    // ISO date string
  comments: string

  updatedAt: unknown              // Firestore Timestamp
}

export type Form1Input = Omit<Form1Data, 'updatedAt'>
