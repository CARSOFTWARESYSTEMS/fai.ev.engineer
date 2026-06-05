import type { FAIProject } from './project.types'
import { normalisePriority, type ProjectPriority } from './projectPriority'
import { toDate, isOverdue, isDueToday, isDueThisWeek, isDueThisMonth } from './projectDueDate'

export type DueDateFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'this_month'

export function getProjectDueDate(project: FAIProject): Date | null {
  const d = toDate(project.dueDate)
  if (d) return d
  // Fallback: createdAt + defaultDueDaysApplied (or 7)
  const created = toDate(project.createdAt)
  if (!created) return null
  const days = project.defaultDueDaysApplied ?? 7
  return new Date(created.getTime() + days * 24 * 60 * 60 * 1000)
}

export function filterProjects(
  projects: FAIProject[],
  opts: {
    status?:  string        // 'all' or a ProjectStatus value
    priority?: string       // 'all' or a ProjectPriority value
    dueDate?: DueDateFilter
    search?:  string
  }
): FAIProject[] {
  return projects.filter((p) => {
    // Status
    if (opts.status && opts.status !== 'all') {
      if (p.status !== opts.status) return false
    }

    // Priority
    if (opts.priority && opts.priority !== 'all') {
      if (normalisePriority(p.priority) !== opts.priority) return false
    }

    // Due date
    if (opts.dueDate && opts.dueDate !== 'all') {
      const due = getProjectDueDate(p)
      if (!due) return false
      if (opts.dueDate === 'overdue'    && !isOverdue(due))     return false
      if (opts.dueDate === 'today'      && !isDueToday(due))    return false
      if (opts.dueDate === 'this_week'  && !isDueThisWeek(due)) return false
      if (opts.dueDate === 'this_month' && !isDueThisMonth(due)) return false
    }

    // Search
    if (opts.search) {
      const q = opts.search.toLowerCase()
      const hit =
        p.projectName.toLowerCase().includes(q)   ||
        p.partNumber.toLowerCase().includes(q)     ||
        p.drawingNumber.toLowerCase().includes(q)  ||
        (p.customerName ?? '').toLowerCase().includes(q)
      if (!hit) return false
    }

    return true
  })
}

export function sortProjectsByUpdatedAt(projects: FAIProject[]): FAIProject[] {
  return [...projects].sort((a, b) => {
    const ta = toDate(a.updatedAt)?.getTime() ?? 0
    const tb = toDate(b.updatedAt)?.getTime() ?? 0
    return tb - ta
  })
}

export function countByPriority(projects: FAIProject[], priority: ProjectPriority): number {
  return projects.filter((p) => normalisePriority(p.priority) === priority).length
}

export function countDueThisWeek(projects: FAIProject[]): number {
  return projects.filter((p) => {
    const d = getProjectDueDate(p)
    return d ? isDueThisWeek(d) : false
  }).length
}
