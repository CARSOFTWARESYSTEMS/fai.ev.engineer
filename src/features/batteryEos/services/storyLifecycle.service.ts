// ─── Story Lifecycle Service ───────────────────────────────────────────────────
//
// Reusable Engineering Execution Engine for EV.ENGINEER EOS.
// Manages mutable story state in Firestore (engineeringStories/{storyId}).
// Static story definitions (acceptance criteria, DoD, etc.) live in seed data.

import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  query, collection, where, getDocs,
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import {
  emptyEvidence,
} from '../types/eos.types'
import type {
  EosStoryStatus,
  EosStoryState,
  EosStatusHistoryEntry,
  EosEvidence,
  EosRoleAccess,
} from '../types/eos.types'

const COLLECTION = 'engineeringStories'

// ─── Transition rules ─────────────────────────────────────────────────────────

export interface EosTransitionRule {
  toStatus:       EosStoryStatus
  label:          string
  variant:        'primary' | 'success' | 'warning' | 'danger' | 'ghost'
  requiresReason: boolean
  reasonLabel:    string
}

type EosActorCapability = 'engineer' | 'manager' | 'qa' | 'reviewer'

const TRANSITION_MAP: Record<
  EosStoryStatus,
  { rule: EosTransitionRule; roles: EosActorCapability[] }[]
> = {
  planned: [
    {
      rule: { toStatus: 'assigned',  label: 'Assign Story',  variant: 'primary', requiresReason: false, reasonLabel: '' },
      roles: ['manager'],
    },
    {
      rule: { toStatus: 'cancelled', label: 'Cancel Story',  variant: 'danger',  requiresReason: true,  reasonLabel: 'Cancellation reason' },
      roles: ['manager'],
    },
  ],
  assigned: [
    {
      rule: { toStatus: 'in_development', label: 'Start Development',  variant: 'primary', requiresReason: false, reasonLabel: '' },
      roles: ['engineer', 'manager'],
    },
    {
      rule: { toStatus: 'blocked',        label: 'Mark Blocked',        variant: 'warning', requiresReason: true,  reasonLabel: 'Blocker description' },
      roles: ['engineer', 'manager'],
    },
    {
      rule: { toStatus: 'planned',        label: 'Unassign',            variant: 'ghost',   requiresReason: false, reasonLabel: '' },
      roles: ['manager'],
    },
  ],
  in_development: [
    {
      rule: { toStatus: 'ready_for_verification', label: 'Submit for Verification', variant: 'success', requiresReason: false, reasonLabel: '' },
      roles: ['engineer', 'manager'],
    },
    {
      rule: { toStatus: 'blocked', label: 'Mark Blocked', variant: 'warning', requiresReason: true, reasonLabel: 'Blocker description' },
      roles: ['engineer', 'manager'],
    },
  ],
  ready_for_verification: [
    {
      rule: { toStatus: 'verification',   label: 'Start Verification',   variant: 'primary', requiresReason: false, reasonLabel: '' },
      roles: ['qa', 'manager'],
    },
    {
      rule: { toStatus: 'in_development', label: 'Return to Development', variant: 'ghost',   requiresReason: true,  reasonLabel: 'Return reason' },
      roles: ['qa', 'manager'],
    },
  ],
  verification: [
    {
      rule: { toStatus: 'technical_review', label: 'Pass Verification', variant: 'success', requiresReason: false, reasonLabel: '' },
      roles: ['qa', 'manager'],
    },
    {
      rule: { toStatus: 'rework_required', label: 'Fail Verification',  variant: 'danger',  requiresReason: true,  reasonLabel: 'Failure reason' },
      roles: ['qa', 'manager'],
    },
  ],
  technical_review: [
    {
      rule: { toStatus: 'approved',        label: 'Approve Story',   variant: 'success', requiresReason: false, reasonLabel: '' },
      roles: ['reviewer', 'manager'],
    },
    {
      rule: { toStatus: 'rework_required', label: 'Request Rework',  variant: 'warning', requiresReason: true,  reasonLabel: 'Rework reason' },
      roles: ['reviewer', 'manager'],
    },
  ],
  rework_required: [
    {
      rule: { toStatus: 'in_development', label: 'Begin Rework', variant: 'primary', requiresReason: false, reasonLabel: '' },
      roles: ['engineer', 'manager'],
    },
  ],
  approved: [
    {
      rule: { toStatus: 'released', label: 'Release', variant: 'success', requiresReason: false, reasonLabel: '' },
      roles: ['manager'],
    },
  ],
  released:  [],
  blocked: [
    {
      rule: { toStatus: 'in_development', label: 'Unblock', variant: 'primary', requiresReason: false, reasonLabel: '' },
      roles: ['engineer', 'manager'],
    },
  ],
  cancelled: [],
}

function capabilitiesFromAccess(access: EosRoleAccess): EosActorCapability[] {
  const caps: EosActorCapability[] = []
  if (access.isManager)  caps.push('manager')
  if (access.isEngineer) caps.push('engineer')
  if (access.isQA)       caps.push('qa')
  if (access.isReviewer) caps.push('reviewer')
  return caps
}

export function getValidTransitions(
  currentStatus: EosStoryStatus,
  access: EosRoleAccess,
): EosTransitionRule[] {
  const caps = new Set(capabilitiesFromAccess(access))
  return (TRANSITION_MAP[currentStatus] ?? [])
    .filter(({ roles }) => roles.some(r => caps.has(r)))
    .map(({ rule }) => rule)
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export interface EosTransitionActor {
  email: string
  name:  string
}

function buildInitialState(
  storyId: string,
  workPackageId: string,
  productKey: string,
  actor: EosTransitionActor,
  opts?: { organisationId?: string; partnerId?: string },
): EosStoryState {
  const now = new Date().toISOString()
  return {
    storyId,
    workPackageId,
    productKey,
    status:                'planned',
    progress:              0,
    assignedEngineerEmail: null,
    assignedEngineerName:  null,
    assignedReviewerEmail: null,
    assignedApproverEmail: null,
    startedAt:             null,
    completedAt:           null,
    blockedReason:         null,
    reworkReason:          null,
    evidence:              emptyEvidence(),
    statusHistory:         [],
    organisationId:        opts?.organisationId ?? null,
    partnerId:             opts?.partnerId      ?? null,
    createdAt:             now,
    updatedAt:             now,
    updatedBy:             actor.email,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getStoryState(storyId: string): Promise<EosStoryState | null> {
  const snap = await getDoc(doc(firestore, COLLECTION, storyId))
  return snap.exists() ? (snap.data() as EosStoryState) : null
}

export function subscribeStoryState(
  storyId: string,
  onUpdate: (state: EosStoryState | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(firestore, COLLECTION, storyId),
    snap => { onUpdate(snap.exists() ? (snap.data() as EosStoryState) : null) },
    err  => { onError ? onError(err) : console.warn('[EOS] subscribeStoryState:', err.message) },
  )
}

export function subscribeWpStoryStates(
  workPackageId: string,
  onUpdate: (states: Record<string, EosStoryState>) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(firestore, COLLECTION),
    where('workPackageId', '==', workPackageId),
  )
  return onSnapshot(
    q,
    snap => {
      const result: Record<string, EosStoryState> = {}
      snap.docs.forEach(d => {
        const s = d.data() as EosStoryState
        result[s.storyId] = s
      })
      onUpdate(result)
    },
    err => { onError ? onError(err) : console.warn('[EOS] subscribeWpStoryStates:', err.message) },
  )
}

export async function getWpStoryStates(
  workPackageId: string,
): Promise<Record<string, EosStoryState>> {
  const q    = query(collection(firestore, COLLECTION), where('workPackageId', '==', workPackageId))
  const snap = await getDocs(q)
  const result: Record<string, EosStoryState> = {}
  snap.docs.forEach(d => {
    const s = d.data() as EosStoryState
    result[s.storyId] = s
  })
  return result
}

export async function transitionStory(
  storyId: string,
  workPackageId: string,
  productKey: string,
  toStatus: EosStoryStatus,
  actor: EosTransitionActor,
  opts?: { reason?: string; organisationId?: string; partnerId?: string },
): Promise<EosStoryState> {
  const ref   = doc(firestore, COLLECTION, storyId)
  const snap  = await getDoc(ref)
  const now   = new Date().toISOString()
  const prev  = snap.exists()
    ? (snap.data() as EosStoryState)
    : buildInitialState(storyId, workPackageId, productKey, actor, opts)

  const historyEntry: EosStatusHistoryEntry = {
    fromStatus: prev.status,
    toStatus,
    changedBy:  actor.email,
    changedAt:  now,
    ...(opts?.reason ? { reason: opts.reason } : {}),
  }

  const next: EosStoryState = {
    ...prev,
    status:       toStatus,
    statusHistory: [...prev.statusHistory, historyEntry],
    updatedAt:    now,
    updatedBy:    actor.email,
    // Set startedAt on first entry to in_development
    startedAt:    toStatus === 'in_development' && !prev.startedAt ? now : prev.startedAt,
    // Set completedAt when reaching approved or released
    completedAt:  (toStatus === 'approved' || toStatus === 'released') ? now : prev.completedAt,
    // Track blocked/rework reasons; clear blocker reason when unblocking
    blockedReason: toStatus === 'blocked'
      ? (opts?.reason ?? null)
      : (toStatus === 'in_development' ? null : prev.blockedReason),
    reworkReason: toStatus === 'rework_required'
      ? (opts?.reason ?? null)
      : prev.reworkReason,
    // Preserve org/partner context
    organisationId: opts?.organisationId ?? prev.organisationId,
    partnerId:      opts?.partnerId      ?? prev.partnerId,
    // Preserve existing fields
    createdAt: prev.createdAt,
  }

  await setDoc(ref, next)
  return next
}

export async function assignStory(
  storyId: string,
  workPackageId: string,
  productKey: string,
  assignments: {
    engineerEmail?: string
    engineerName?:  string
    reviewerEmail?: string
    approverEmail?: string
  },
  actor: EosTransitionActor,
  opts?: { organisationId?: string; partnerId?: string },
): Promise<EosStoryState> {
  const ref  = doc(firestore, COLLECTION, storyId)
  const snap = await getDoc(ref)
  const now  = new Date().toISOString()
  const prev = snap.exists()
    ? (snap.data() as EosStoryState)
    : buildInitialState(storyId, workPackageId, productKey, actor, opts)

  const next: EosStoryState = {
    ...prev,
    assignedEngineerEmail: assignments.engineerEmail ?? prev.assignedEngineerEmail,
    assignedEngineerName:  assignments.engineerName  ?? prev.assignedEngineerName,
    assignedReviewerEmail: assignments.reviewerEmail ?? prev.assignedReviewerEmail,
    assignedApproverEmail: assignments.approverEmail ?? prev.assignedApproverEmail,
    updatedAt:  now,
    updatedBy:  actor.email,
    createdAt:  prev.createdAt,
  }

  await setDoc(ref, next)
  return next
}

export async function updateProgress(
  storyId: string,
  workPackageId: string,
  productKey: string,
  progress: number,
  actor: EosTransitionActor,
): Promise<void> {
  const ref  = doc(firestore, COLLECTION, storyId)
  const snap = await getDoc(ref)
  const now  = new Date().toISOString()

  if (snap.exists()) {
    await updateDoc(ref, { progress, updatedAt: now, updatedBy: actor.email })
  } else {
    const init: EosStoryState = {
      ...buildInitialState(storyId, workPackageId, productKey, actor),
      progress,
    }
    await setDoc(ref, init)
  }
}

export async function updateEvidence(
  storyId: string,
  workPackageId: string,
  productKey: string,
  evidence: Partial<EosEvidence>,
  actor: EosTransitionActor,
): Promise<void> {
  const ref  = doc(firestore, COLLECTION, storyId)
  const snap = await getDoc(ref)
  const now  = new Date().toISOString()

  if (snap.exists()) {
    const prev = snap.data() as EosStoryState
    await updateDoc(ref, {
      evidence:  { ...prev.evidence, ...evidence },
      updatedAt: now,
      updatedBy: actor.email,
    })
  } else {
    const init: EosStoryState = {
      ...buildInitialState(storyId, workPackageId, productKey, actor),
      evidence: { ...emptyEvidence(), ...evidence },
    }
    await setDoc(ref, init)
  }
}
