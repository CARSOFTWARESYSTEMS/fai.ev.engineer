import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { clearGoogleDriveSession } from '../lib/googleDrive'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type FieldValue,
} from 'firebase/firestore'
import { firebaseAuth } from '../firebase/auth'
import { firestore } from '../firebase/firestore'
import type { EVEngineerUser, UserRole } from './AuthTypes'
import { logProfileCreated, logProfileUpdated } from '../services/userActivityLogService'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toOrgCode(orgName: string): string {
  const trimmed = orgName.trim()
  if (!trimmed) return 'default'
  return trimmed.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'default'
}

function extractFirebaseError(err: unknown): { code: string; message: string } {
  const e = err as { code?: string; message?: string }
  return {
    code: e?.code ?? 'unknown',
    message: e?.message ?? 'An unknown error occurred.',
  }
}

// ─── Google sign-in ───────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(firebaseAuth, googleProvider)
}

// ─── Firestore reads ──────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<EVEngineerUser | null> {
  const snap = await getDoc(doc(firestore, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as EVEngineerUser
}

// ─── Profile creation ─────────────────────────────────────────────────────────

export interface CompleteProfileParams {
  uid: string
  displayName: string
  email: string
  photoURL: string
  mobileNumber: string
  organizationName?: string
  gstNumber?: string
  signupBrandingId?:  string
  signupPartnerCode?: string
  signupPartnerName?: string
}

// Separate write type uses FieldValue for server timestamps
type UserWriteDoc = Omit<EVEngineerUser, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
  createdAt: FieldValue
  updatedAt: FieldValue
  lastLoginAt: FieldValue
}

export async function completeProfile(params: CompleteProfileParams): Promise<void> {
  const {
    uid,
    displayName,
    email,
    photoURL,
    mobileNumber,
    organizationName = '',
    gstNumber = '',
    signupBrandingId,
    signupPartnerCode,
    signupPartnerName,
  } = params

  const signupDomain = typeof window !== 'undefined' ? window.location.hostname : undefined
  const orgName = organizationName.trim()

  console.log('[AUTH] Saving profile to Firestore...')
  console.log('[AUTH] Collection: users')
  console.log('[AUTH] Document ID (uid):', uid)
  console.log('[AUTH] Email:', email)
  console.log('[AUTH] Mobile Number:', mobileNumber)
  console.log('[AUTH] Organization Name:', orgName || '(none)')
  console.log('[AUTH] GST Number:', gstNumber || '(none)')

  const baseDoc: UserWriteDoc = {
    uid,
    displayName,
    email,
    photoURL,
    mobileNumber: mobileNumber.trim(),
    organizationCode: toOrgCode(orgName),
    organizationName: orgName,
    gstNumber: gstNumber.trim(),
    role: 'engineer',
    profileCompleted: true,
    subscriptionPlan: 'trial',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }

  if (signupDomain)    { baseDoc.signupDomain = signupDomain; baseDoc.signupHostname = signupDomain }
  if (signupBrandingId)  baseDoc.signupBrandingId  = signupBrandingId
  if (signupPartnerCode) baseDoc.signupPartnerCode = signupPartnerCode
  if (signupPartnerName) baseDoc.signupPartnerName = signupPartnerName

  const writeDoc = baseDoc

  try {
    await setDoc(doc(firestore, 'users', uid), writeDoc)
    console.log('[AUTH] Profile saved successfully for uid:', uid)
    logProfileCreated(uid, email).catch(() => {})
  } catch (err: unknown) {
    const { code, message } = extractFirebaseError(err)
    console.error('[AUTH] Profile save failed:')
    console.error('[AUTH]   code   :', code)
    console.error('[AUTH]   message:', message)
    // Re-throw so the UI layer can display the real error
    throw err
  }
}

// ─── Profile update ───────────────────────────────────────────────────────────

export interface UpdateProfileParams {
  mobileNumber: string
  organizationName: string
  organizationCode: string
  gstNumber: string
  role?: Exclude<UserRole, 'super_admin'>
}

export async function updateUserProfile(
  uid: string,
  data: UpdateProfileParams
): Promise<void> {
  console.log('[AUTH] Updating profile for uid:', uid)
  console.log('[AUTH] Fields:', JSON.stringify(data, null, 2))

  try {
    const patch: Record<string, unknown> = {
      mobileNumber: data.mobileNumber.trim(),
      organizationName: data.organizationName.trim(),
      organizationCode: data.organizationCode.trim(),
      gstNumber: data.gstNumber.trim(),
      updatedAt: serverTimestamp(),
    }
    if (data.role) {
      const currentProfile = await getDoc(doc(firestore, 'users', uid))
      if (currentProfile.data()?.role !== 'super_admin') patch.role = data.role
    }

    await updateDoc(doc(firestore, 'users', uid), patch)
    console.log('[AUTH] Profile updated successfully for uid:', uid)
    const email = firebaseAuth.currentUser?.email ?? ''
    const watchedFields = ['mobileNumber', 'organizationName', 'organizationCode', 'gstNumber']
    const changed = watchedFields.filter(k => k in patch)
    logProfileUpdated(uid, email, changed).catch(() => {})
  } catch (err: unknown) {
    const { code, message } = extractFirebaseError(err)
    console.error('[AUTH] Profile update failed:')
    console.error('[AUTH]   code   :', code)
    console.error('[AUTH]   message:', message)
    throw err
  }
}

// ─── Last login update ────────────────────────────────────────────────────────

export async function touchLastLogin(uid: string): Promise<void> {
  try {
    await updateDoc(doc(firestore, 'users', uid), {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch {
    // Non-critical — log only
    console.warn('[AUTH] touchLastLogin failed for uid:', uid)
  }
}

// ─── Sign-out ─────────────────────────────────────────────────────────────────

export async function signOutUser(): Promise<void> {
  console.log('[DRIVE] Clearing Drive session on sign-out')
  clearGoogleDriveSession()
  await signOut(firebaseAuth)
}
