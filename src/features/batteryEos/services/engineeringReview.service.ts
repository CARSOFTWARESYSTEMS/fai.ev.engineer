import {
  doc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import type { EosReview, EosApprovalDecision, EosReviewScore } from '../types/eos.types'

const COLLECTION = 'engineeringReviews'

function generateReviewId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function submitReview(
  review: Omit<EosReview, 'reviewId' | 'createdAt' | 'updatedAt'>,
): Promise<EosReview> {
  const now      = new Date().toISOString()
  const reviewId = generateReviewId()
  const full: EosReview = {
    ...review,
    reviewId,
    createdAt:   now,
    updatedAt:   now,
  }
  await setDoc(doc(firestore, COLLECTION, reviewId), full)
  return full
}

export async function getStoryReviews(storyId: string): Promise<EosReview[]> {
  const q    = query(
    collection(firestore, COLLECTION),
    where('storyId', '==', storyId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as EosReview)
}

export function subscribeOrgReviews(
  organisationId: string,
  onUpdate: (reviews: EosReview[]) => void,
): Unsubscribe {
  const q = query(
    collection(firestore, COLLECTION),
    where('organisationId', '==', organisationId),
    where('decision', '==', 'pending' satisfies EosApprovalDecision),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => d.data() as EosReview))
  })
}

export function calculateOverallScore(score: EosReviewScore): number {
  const fields: (keyof Omit<EosReviewScore, 'overallScore'>)[] = [
    'requirementsCompliance',
    'architectureQuality',
    'implementationQuality',
    'testingQuality',
    'securityQuality',
    'documentationQuality',
    'demoQuality',
  ]
  const sum = fields.reduce((acc, k) => acc + (score[k] ?? 0), 0)
  return Math.round((sum / fields.length) * 10) / 10
}
