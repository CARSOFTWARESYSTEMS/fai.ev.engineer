// AS9102D Form 2 — Material and Process Certifications
// Stored as a subcollection: projects/{projectId}/form2Rows/{rowId}

export interface Form2Row {
  id: string
  projectId: string
  rowOrder: number
  materialOrProcessName: string
  specificationNumber: string
  code: string
  supplierName: string
  supplierAddress: string
  supplierCode: string
  customerApprovalVerification: string
  certificateOfConformanceNumber: string
  acceptanceReportNumber: string
  comments: string
  createdAt: unknown  // Firestore Timestamp
  updatedAt: unknown  // Firestore Timestamp
}

export type Form2RowInput = Omit<Form2Row, 'id' | 'createdAt' | 'updatedAt'>
export type Form2RowUpdateInput = Partial<Omit<Form2RowInput, 'projectId' | 'rowOrder'>>
