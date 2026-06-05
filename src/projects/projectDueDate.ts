// ─── Due date helpers ─────────────────────────────────────────────────────────

export function calculateDueDate(createdAtMs: number, defaultDueDays: number): Date {
  return new Date(createdAtMs + defaultDueDays * 24 * 60 * 60 * 1000)
}

export function toDate(firestoreTs: unknown): Date | null {
  if (!firestoreTs) return null
  if (typeof (firestoreTs as { toDate?: () => Date }).toDate === 'function') {
    return (firestoreTs as { toDate: () => Date }).toDate()
  }
  if (typeof firestoreTs === 'string') return new Date(firestoreTs)
  if (typeof firestoreTs === 'number') return new Date(firestoreTs)
  return null
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function endOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(23, 59, 59, 999)
  return c
}

export function isOverdue(dueDate: Date): boolean {
  const today = startOfDay(new Date())
  return startOfDay(dueDate) < today
}

export function isDueToday(dueDate: Date): boolean {
  const today = new Date()
  return dueDate.toDateString() === today.toDateString()
}

export function isDueThisWeek(dueDate: Date): boolean {
  const now = new Date()
  // Monday-based week
  const day  = now.getDay() || 7
  const mon  = new Date(now)
  mon.setDate(now.getDate() - day + 1)
  const sun  = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return dueDate >= startOfDay(mon) && dueDate <= endOfDay(sun)
}

export function isDueThisMonth(dueDate: Date): boolean {
  const now = new Date()
  return dueDate.getFullYear() === now.getFullYear() && dueDate.getMonth() === now.getMonth()
}

export function fmtDueDate(dueDate: Date): string {
  return dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function dueDateStatus(dueDate: Date | null): 'overdue' | 'today' | 'soon' | 'ok' | 'none' {
  if (!dueDate) return 'none'
  if (isOverdue(dueDate)) return 'overdue'
  if (isDueToday(dueDate)) return 'today'
  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  if (dueDate <= threeDays) return 'soon'
  return 'ok'
}
