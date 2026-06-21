import type { ProjectStatus } from './project.types'
import type { ProjectLifecycleStatus } from './projectLifecycle'

/** Deliberately minimal document safe for an owner to read after project blocking. */
export interface ProjectAccessSummary {
  projectId: string
  ownerUid: string
  ownerEmail?: string
  lifecycleStatus: ProjectLifecycleStatus
  projectName: string
  partNumber?: string
  status?: ProjectStatus
  updatedAt?: unknown
  supportDomain?: string
  supportEmail?: string
  supportPhone?: string
  supportWhatsapp?: string
}

export interface ProjectSupportContact {
  supportDomain?: string
  supportEmail?: string
  supportPhone?: string
  supportWhatsapp?: string
}
