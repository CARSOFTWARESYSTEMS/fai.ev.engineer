export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low'

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
}

export const PRIORITY_BADGE_CLASS: Record<ProjectPriority, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high:     'bg-orange-100 text-orange-700 border border-orange-200',
  medium:   'bg-blue-100 text-blue-700 border border-blue-200',
  low:      'bg-gray-100 text-gray-500 border border-gray-200',
}

export const PRIORITY_DOT_CLASS: Record<ProjectPriority, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-blue-500',
  low:      'bg-gray-400',
}

export function normalisePriority(p: string | undefined): ProjectPriority {
  if (p === 'critical' || p === 'high' || p === 'medium' || p === 'low') return p
  return 'medium'
}

export function getPriorityLabel(priority: string | undefined): string {
  return PRIORITY_LABELS[normalisePriority(priority)]
}

export function getPriorityBadgeClass(priority: string | undefined): string {
  return PRIORITY_BADGE_CLASS[normalisePriority(priority)]
}

export function getPriorityDotClass(priority: string | undefined): string {
  return PRIORITY_DOT_CLASS[normalisePriority(priority)]
}

export const PRIORITY_ORDER: Record<ProjectPriority, number> = {
  critical: 0,
  high:     1,
  medium:   2,
  low:      3,
}
