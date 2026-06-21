import { collection, onSnapshot, doc, deleteDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { UserRecord } from './roleManagementService'
import type { LifecycleStatus } from '../auth/AuthTypes'
import { buildMailtoLink, buildWhatsAppLink, type ContactMessageContext } from '../lib/contactMessage'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DirectoryUser = UserRecord

export interface ContactLinks {
  tel:      string | null
  mailto:   string
  whatsapp: string | null
}

export const LEGACY_DOMAIN = 'legacy'

// Ninety days in milliseconds — threshold for auto-derived inactivity
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

// ─── Effective lifecycle status ───────────────────────────────────────────────
// Computes the displayed lifecycle status for a user, including legacy 'disabled'
// and auto-derived inactivity (no login in 90+ days).

function tsToMs(ts: unknown): number {
  if (!ts) return 0
  if (typeof (ts as { toMillis?: () => number }).toMillis === 'function')
    return (ts as { toMillis: () => number }).toMillis()
  if (typeof ts === 'string') return new Date(ts).getTime()
  return 0
}

export function getEffectiveLifecycleStatus(user: DirectoryUser): LifecycleStatus {
  const lc = user.lifecycleStatus as LifecycleStatus | undefined
  if (lc && lc !== 'active') return lc

  // Legacy: status:'disabled' → treated as blocked, but only when no explicit lifecycleStatus is set.
  // If lifecycleStatus is explicitly 'active', the admin has restored them — don't re-block via legacy field.
  if (!lc && user.status === 'disabled') return 'blocked'

  // Auto-derived inactivity: no login in 90+ days
  const lastMs = tsToMs(user.lastLoginAt) || tsToMs(user.lastActivityAt)
  if (lastMs > 0 && lastMs < Date.now() - NINETY_DAYS_MS) return 'inactive'

  return 'active'
}

export function getEffectiveProjectLifecycleStatus(
  project: { lifecycleStatus?: string; updatedAt?: unknown; lastActivityAt?: unknown }
): LifecycleStatus {
  const lc = project.lifecycleStatus as LifecycleStatus | undefined
  if (lc && lc !== 'active') return lc

  const lastMs = tsToMs(project.lastActivityAt) || tsToMs(project.updatedAt)
  if (lastMs > 0 && lastMs < Date.now() - NINETY_DAYS_MS) return 'inactive'

  return 'active'
}

// ─── Phone helpers ────────────────────────────────────────────────────────────

export function normalizePhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) return null
  if (digits.length >= 11) return digits
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`
  return digits.length >= 7 ? digits : null
}

// ─── Contact link builder ─────────────────────────────────────────────────────

export function buildContactLinks(user: DirectoryUser): ContactLinks {
  const rawPhone  = user.mobileNumber?.trim() ?? ''
  const waNumber  = rawPhone ? normalizePhoneForWhatsApp(rawPhone) : null
  const domain    = user.signupDomain || LEGACY_DOMAIN
  const context: ContactMessageContext = {
    userName: user.displayName,
    userEmail: user.email,
    userPhone: rawPhone,
    userRole: user.role,
    userLifecycleStatus: getEffectiveLifecycleStatus(user),
    domain,
    partnerName: user.signupPartnerName,
    organizationName: user.organizationName,
    organizationCode: user.organizationCode,
    issue: 'This is regarding your FAI Engineer account.',
  }

  return {
    tel:      rawPhone ? `tel:${rawPhone}` : null,
    mailto:   buildMailtoLink(user.email, `FAI Engineer Account Support — ${user.email}`, context),
    whatsapp: waNumber ? buildWhatsAppLink(waNumber, context) : null,
  }
}

// ─── Domain display label ─────────────────────────────────────────────────────

export function domainDisplayLabel(domain: string): string {
  if (!domain || domain === LEGACY_DOMAIN) return 'Legacy / Unknown'
  if (domain === 'localhost' || domain.startsWith('127.') || domain.startsWith('192.168.'))
    return `Local Dev (${domain})`
  return domain
}

// ─── Group by signup domain ───────────────────────────────────────────────────

export function groupUsersBySignupDomain(
  users: DirectoryUser[],
): Map<string, DirectoryUser[]> {
  const map = new Map<string, DirectoryUser[]>()
  for (const u of users) {
    const key = u.signupDomain || LEGACY_DOMAIN
    const group = map.get(key) ?? []
    group.push(u)
    map.set(key, group)
  }
  return new Map(
    [...map.entries()].sort(([aKey, aUsers], [bKey, bUsers]) => {
      if (aKey === LEGACY_DOMAIN) return 1
      if (bKey === LEGACY_DOMAIN) return -1
      return bUsers.length - aUsers.length
    })
  )
}

// ─── Legacy: physical delete (kept for backward compat, not used by lifecycle UI) ──

export async function deleteUserData(uid: string): Promise<void> {
  await deleteDoc(doc(firestore, 'users', uid))
  const paRef  = doc(firestore, 'partnerAdmins', uid)
  const paSnap = await getDoc(paRef)
  if (paSnap.exists()) await deleteDoc(paRef)
}

// ─── Legacy: disable (soft — superseded by lifecycleStatus:'blocked') ─────────

export async function disableUserData(uid: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), {
    status: 'disabled',
    disabledAt: new Date().toISOString(),
  })
}

// ─── Legacy: restore disable (clears old status field) ───────────────────────

export async function restoreUserData(uid: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), {
    status:    deleteField(),
    disabledAt: deleteField(),
  })
}

// ─── Legacy: project delete/archive/restore ───────────────────────────────────

export async function deleteProjectData(projectId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'projects', projectId))
}

export async function archiveProjectData(projectId: string): Promise<void> {
  await updateDoc(doc(firestore, 'projects', projectId), { status: 'archived' })
}

export async function restoreProjectData(projectId: string): Promise<void> {
  await updateDoc(doc(firestore, 'projects', projectId), {
    status:          'draft',
    lifecycleStatus: 'active',
  })
}

// ─── Real-time subscription ───────────────────────────────────────────────────

export function subscribeAllUsers(
  callback: (users: DirectoryUser[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'users'),
    snap => {
      callback(
        snap.docs.map(d => ({
          uid: d.id,
          ...(d.data() as Omit<DirectoryUser, 'uid'>),
        }))
      )
    },
    () => callback([]),
  )
}
