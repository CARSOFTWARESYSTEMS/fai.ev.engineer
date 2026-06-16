import { collection, onSnapshot, doc, deleteDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import type { UserRecord } from './roleManagementService'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DirectoryUser = UserRecord

export interface ContactLinks {
  tel:      string | null
  mailto:   string
  whatsapp: string | null
}

export const LEGACY_DOMAIN = 'legacy'

// ─── Phone helpers ────────────────────────────────────────────────────────────

export function normalizePhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) return null
  // Already has country code (12+ digits starting with a country prefix)
  if (digits.length >= 11) return digits
  // 10-digit Indian mobile starting with 6–9
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`
  // Anything else — return as-is if >= 7 digits
  return digits.length >= 7 ? digits : null
}

// ─── Contact link builder ─────────────────────────────────────────────────────

export function buildContactLinks(user: DirectoryUser): ContactLinks {
  const rawPhone  = user.mobileNumber?.trim() ?? ''
  const waNumber  = rawPhone ? normalizePhoneForWhatsApp(rawPhone) : null
  const domain    = user.signupDomain || LEGACY_DOMAIN
  const name      = user.displayName || 'User'

  const waText = encodeURIComponent(
    `Hello ${name}, this is regarding your FAI Engineer account on ${domain}.`
  )

  return {
    tel:      rawPhone ? `tel:${rawPhone}` : null,
    mailto:   `mailto:${user.email}`,
    whatsapp: waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null,
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
  // Sort groups: largest first, 'legacy' always last
  return new Map(
    [...map.entries()].sort(([aKey, aUsers], [bKey, bUsers]) => {
      if (aKey === LEGACY_DOMAIN) return 1
      if (bKey === LEGACY_DOMAIN) return -1
      return bUsers.length - aUsers.length
    })
  )
}

// ─── Delete user data ─────────────────────────────────────────────────────────

export async function deleteUserData(uid: string): Promise<void> {
  await deleteDoc(doc(firestore, 'users', uid))

  // Remove partner-admin record if one exists
  const paRef  = doc(firestore, 'partnerAdmins', uid)
  const paSnap = await getDoc(paRef)
  if (paSnap.exists()) {
    await deleteDoc(paRef)
  }
}

// ─── Disable user (soft — marks status disabled, does NOT delete) ─────────────

export async function disableUserData(uid: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), {
    status: 'disabled',
    disabledAt: new Date().toISOString(),
  })
}

// ─── Delete project (Firestore document only — Drive files not touched) ──────

export async function deleteProjectData(projectId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'projects', projectId))
}

// ─── Archive project (soft — sets status:'archived', does NOT delete) ────────

export async function archiveProjectData(projectId: string): Promise<void> {
  await updateDoc(doc(firestore, 'projects', projectId), {
    status: 'archived',
  })
}

// ─── Restore user (undo disable) ─────────────────────────────────────────────

export async function restoreUserData(uid: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), {
    status: deleteField(),
    disabledAt: deleteField(),
  })
}

// ─── Restore project (set back to draft) ─────────────────────────────────────

export async function restoreProjectData(projectId: string): Promise<void> {
  await updateDoc(doc(firestore, 'projects', projectId), {
    status: 'draft',
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
