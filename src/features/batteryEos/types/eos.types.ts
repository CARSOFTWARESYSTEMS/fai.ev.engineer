// ─── EV.ENGINEER Engineering Operating System (EOS) — Core Types ─────────────
//
// Product:    Battery Intelligence & Cybersecurity (battery_pm)
// Standard:   EV.ENGINEER Engineering Standard v1
// Story size: 8h engineering + 2h QA + 2h technical review

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EosStoryStatus =
  | 'planned'
  | 'assigned'
  | 'in_development'
  | 'ready_for_verification'
  | 'verification'
  | 'technical_review'
  | 'approved'
  | 'released'
  | 'blocked'
  | 'rework_required'
  | 'cancelled'

export type EosPriority = 'low' | 'medium' | 'high' | 'critical'

export type EosMilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'blocked'

export type EosWorkPackageStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold'

export type EosApprovalDecision = 'approved' | 'rework_requested' | 'pending'

// ─── Work Package ─────────────────────────────────────────────────────────────

export interface EosWorkPackage {
  workPackageId:  string          // e.g. 'WP-001'
  productKey:     string          // 'battery_pm'
  missionId:      string          // e.g. 'MISSION-ALPHA'
  missionName:    string          // e.g. 'Mission Alpha — Trusted Battery Identity'
  title:          string          // e.g. 'Battery Aadhaar Platform'
  definition:     string          // one-line definition
  scope:          string[]        // list of scope items
  status:         EosWorkPackageStatus
  priority:       EosPriority
  owner?:         string          // email or uid
  progressPercent: number         // 0-100
  dueDate?:       string          // ISO date string
  milestones:     EosMilestone[]
  stories:        EosStory[]
  createdAt:      string
  updatedAt:      string
  partnerId?:     string
  organisationId?: string
}

// ─── Milestone ────────────────────────────────────────────────────────────────

export interface EosMilestone {
  milestoneId:  string            // e.g. 'WP-001-M1'
  workPackageId: string
  title:        string
  description:  string
  status:       EosMilestoneStatus
  dueDate?:     string
  storyIds:     string[]
}

// ─── Story ────────────────────────────────────────────────────────────────────

export interface EosStory {
  storyId:              string    // e.g. 'WP-001-S1'
  workPackageId:        string
  milestoneId:          string
  title:                string
  description:          string
  userStory:            string    // "As a [role], I want [goal] so that [benefit]"
  engineeringHours:     8         // always 8 per EV.ENGINEER standard
  qaHours:              2         // always 2 per EV.ENGINEER standard
  reviewHours:          2         // always 2 per EV.ENGINEER standard
  priority:             EosPriority
  status:               EosStoryStatus
  dueDate?:             string
  assignedEngineer?:    string    // email
  reviewer?:            string    // email
  approver?:            string    // email
  acceptanceCriteria:   string[]
  definitionOfDone:     string[]
  useCases:             string[]
  negativeUseCases:     string[]
  testCases:            EosTestCase[]
  securityTestCases:    EosTestCase[]
  // Evidence links (stored as metadata, not file uploads)
  googleDriveFolderLink?: string
  architectureDocLink?:   string
  presentationLink?:      string
  demoVideoLink?:         string
  youtubeLink?:           string
  testReportLink?:        string
  securityReportLink?:    string
  designDocLink?:         string
  meetingNotesLink?:      string
  // GitHub metadata
  repoUrl?:              string
  branchName?:           string
  pullRequestUrl?:       string
  commitUrl?:            string
  githubReviewStatus?:   string
  // Review
  reviewScore?:          EosReviewScore
  reviewComments?:       string
  approvalDecision?:     EosApprovalDecision
  createdAt?:            string
  updatedAt?:            string
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface EosTask {
  taskId:         string          // e.g. 'WP-001-S1-T1'
  storyId:        string
  workPackageId:  string
  title:          string
  description:    string
  status:         'todo' | 'in_progress' | 'done' | 'blocked'
  estimatedHours: number
  assignedTo?:    string
  dueDate?:       string
}

// ─── Test Case ────────────────────────────────────────────────────────────────

export interface EosTestCase {
  id:          string
  title:       string
  steps:       string[]
  expected:    string
  result?:     'pass' | 'fail' | 'pending'
}

// ─── Review Score ─────────────────────────────────────────────────────────────

export interface EosReviewScore {
  requirementsCompliance:  number   // /10
  architectureQuality:     number   // /10
  implementationQuality:   number   // /10
  testingQuality:          number   // /10
  securityQuality:         number   // /10
  documentationQuality:    number   // /10
  demoQuality:             number   // /10
  overallScore:            number   // /10 (entered or calculated)
}

// ─── Daily Check-in (Firestore: engineeringCheckins/{uid}_{date}) ─────────────

export interface EosDailyCheckin {
  checkinId:          string          // `{uid}_{YYYY-MM-DD}`
  uid:                string
  userEmail:          string
  userName:           string
  date:               string          // 'YYYY-MM-DD'
  organisationId?:    string
  partnerId?:         string
  productKey:         string          // 'battery_pm'
  workPackageId?:     string
  storyId?:           string
  yesterdayWork:      string
  todayPlan:          string
  hasBlocker:         boolean
  blockerDescription?: string
  committedStoryId?:  string
  estimatedHoursToday: number
  submittedAt:        string          // ISO timestamp
  createdAt:          string
}

// ─── Engineering Review (Firestore: engineeringReviews/{reviewId}) ────────────

export interface EosReview {
  reviewId:           string
  storyId:            string
  workPackageId:      string
  productKey:         string
  reviewerEmail:      string
  reviewerUid:        string
  organisationId?:    string
  partnerId?:         string
  score:              EosReviewScore
  comments:           string
  decision:           EosApprovalDecision
  submittedAt:        string
  createdAt:          string
  updatedAt:          string
}

// ─── EOS Role Access ─────────────────────────────────────────────────────────

export interface EosRoleAccess {
  canInfo:        boolean
  canDemo:        boolean
  canEngineering: boolean
  isEngineer:     boolean           // can start/submit stories, daily check-in
  isReviewer:     boolean           // can score + approve stories
  isManager:      boolean           // can assign stories, view team dashboard
  isQA:           boolean           // can verify stories (inspector role)
}

// ─── Engineering Evidence (metadata links only — no file storage) ─────────────

export interface EosEvidence {
  googleDriveFolder:  string
  architectureDoc:    string
  designDoc:          string
  githubRepo:         string
  githubBranch:       string
  pullRequest:        string
  verificationReport: string
  securityReport:     string
  demoVideo:          string
  presentation:       string
}

export function emptyEvidence(): EosEvidence {
  return {
    googleDriveFolder:  '',
    architectureDoc:    '',
    designDoc:          '',
    githubRepo:         '',
    githubBranch:       '',
    pullRequest:        '',
    verificationReport: '',
    securityReport:     '',
    demoVideo:          '',
    presentation:       '',
  }
}

// ─── Status History Entry (append-only audit trail) ───────────────────────────

export interface EosStatusHistoryEntry {
  fromStatus: EosStoryStatus
  toStatus:   EosStoryStatus
  changedBy:  string              // actor email
  changedAt:  string              // ISO timestamp
  reason?:    string
}

// ─── Story State (Firestore: engineeringStories/{storyId}) ───────────────────
//
// Stores mutable runtime state for a story. The seed data (EosStory) holds the
// static definition (acceptance criteria, DoD, test cases, etc.).
// These two are merged in the UI for display.

export interface EosStoryState {
  storyId:                string
  workPackageId:          string
  productKey:             string
  status:                 EosStoryStatus
  progress:               number              // 0-100
  assignedEngineerEmail:  string | null
  assignedEngineerName:   string | null
  assignedReviewerEmail:  string | null
  assignedApproverEmail:  string | null
  startedAt:              string | null
  completedAt:            string | null
  blockedReason:          string | null
  reworkReason:           string | null
  evidence:               EosEvidence
  statusHistory:          EosStatusHistoryEntry[]
  organisationId:         string | null
  partnerId:              string | null
  createdAt:              string
  updatedAt:              string
  updatedBy:              string              // actor email
}

// ─── Status Labels ────────────────────────────────────────────────────────────

export const EOS_STORY_STATUS_LABELS: Record<EosStoryStatus, string> = {
  planned:                'Planned',
  assigned:               'Assigned',
  in_development:         'In Development',
  ready_for_verification: 'Ready for Verification',
  verification:           'Verification',
  technical_review:       'Technical Review',
  approved:               'Approved',
  released:               'Released',
  blocked:                'Blocked',
  rework_required:        'Rework Required',
  cancelled:              'Cancelled',
}

export const EOS_STORY_STATUS_COLORS: Record<EosStoryStatus, string> = {
  planned:                'bg-gray-100 text-gray-600 border-gray-200',
  assigned:               'bg-blue-50 text-blue-700 border-blue-200',
  in_development:         'bg-indigo-50 text-indigo-700 border-indigo-200',
  ready_for_verification: 'bg-amber-50 text-amber-700 border-amber-200',
  verification:           'bg-orange-50 text-orange-700 border-orange-200',
  technical_review:       'bg-purple-50 text-purple-700 border-purple-200',
  approved:               'bg-green-50 text-green-700 border-green-200',
  released:               'bg-teal-50 text-teal-700 border-teal-200',
  blocked:                'bg-red-50 text-red-700 border-red-200',
  rework_required:        'bg-rose-50 text-rose-700 border-rose-200',
  cancelled:              'bg-gray-100 text-gray-400 border-gray-200',
}

export const EOS_PRIORITY_COLORS: Record<EosPriority, string> = {
  low:      'bg-gray-50 text-gray-600 border-gray-200',
  medium:   'bg-blue-50 text-blue-700 border-blue-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

export const EOS_WP_STATUS_LABELS: Record<EosWorkPackageStatus, string> = {
  planned:    'Planned',
  in_progress: 'In Progress',
  completed:  'Completed',
  on_hold:    'On Hold',
}

export const EOS_WP_STATUS_COLORS: Record<EosWorkPackageStatus, string> = {
  planned:    'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:  'bg-green-50 text-green-700 border-green-200',
  on_hold:    'bg-amber-50 text-amber-700 border-amber-200',
}
