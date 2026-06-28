export type StoryStatus   = 'planned' | 'in_progress' | 'review' | 'done'
export type StoryPriority = 'critical' | 'high' | 'medium' | 'low'

export interface BatteryStory {
  id:                       string
  title:                    string
  status:                   StoryStatus
  priority:                 StoryPriority
  storyPoints:              number
  missionRelevance:         string
  owner:                    string
  businessGoal:             string
  problemStatement:         string
  userPersona:              string
  userStory:                string
  functionalRequirements:   string[]
  nonFunctionalRequirements: string[]
  uiRequirements:           string[]
  backendRequirements:      string[]
  dataModel:                string[]
  securityRequirements:     string[]
  useCases:                 string[]
  negativeUseCases:         string[]
  securityTestCases:        string[]
  acceptanceCriteria:       string[]
  manualVerificationSteps:  string[]
  demoEvidenceRequired:     string[]
  definitionOfDone:         string[]
}

export interface StoryCatalogueEntry {
  id:       string
  title:    string
  status:   StoryStatus
  priority: StoryPriority
  route:    string
}

import { STORY_001 } from './story-001'
import { STORY_002 } from './story-002'
import { STORY_003 } from './story-003'
import { STORY_004 } from './story-004'
import { STORY_005 } from './story-005'
import { STORY_006 } from './story-006'
import { STORY_007 } from './story-007'
import { STORY_008 } from './story-008'
import { STORY_009 } from './story-009'
import { STORY_010 } from './story-010'

export const ALL_STORIES: BatteryStory[] = [
  STORY_001, STORY_002, STORY_003, STORY_004, STORY_005,
  STORY_006, STORY_007, STORY_008, STORY_009, STORY_010,
]

export function getStory(id: string): BatteryStory | undefined {
  return ALL_STORIES.find(s => s.id === id)
}

export const STORY_ROUTE_MAP: Record<string, string> = {
  'BT-S001': '/battery-trust/wp-001/story-001',
  'BT-S002': '/battery-trust/wp-001/story-002',
  'BT-S003': '/battery-trust/wp-001/story-003',
  'BT-S004': '/battery-trust/wp-001/story-004',
  'BT-S005': '/battery-trust/wp-001/story-005',
  'BT-S006': '/battery-trust/wp-001/story-006',
  'BT-S007': '/battery-trust/wp-001/story-007',
  'BT-S008': '/battery-trust/wp-001/story-008',
  'BT-S009': '/battery-trust/wp-001/story-009',
  'BT-S010': '/battery-trust/wp-001/story-010',
}

export const STORY_SLUG_MAP: Record<string, string> = {
  'story-001': 'BT-S001',
  'story-002': 'BT-S002',
  'story-003': 'BT-S003',
  'story-004': 'BT-S004',
  'story-005': 'BT-S005',
  'story-006': 'BT-S006',
  'story-007': 'BT-S007',
  'story-008': 'BT-S008',
  'story-009': 'BT-S009',
  'story-010': 'BT-S010',
}
