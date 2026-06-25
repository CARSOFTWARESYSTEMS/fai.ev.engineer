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
import type { EVEngineerUser } from './AuthTypes'
import { logProfileCreated, logProfileUpdated } from '../services/userActivityLogService'
import { claimPendingPartnerAdmin } from '../services/partnerAccessService'
import { claimPendingOrgMemberships } from '../services/organisationService'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    signupBrandingId,
    signupPartnerCode,
    signupPartnerName,
  } = params

  const signupDomain = typeof window !== 'undefined' ? window.location.hostname : undefined

  console.log('[AUTH] Saving profile to Firestore...')
  console.log('[AUTH] Collection: users')
  console.log('[AUTH] Document ID (uid):', uid)
  console.log('[AUTH] Email:', email)
  console.log('[AUTH] Mobile Number:', mobileNumber)

  const baseDoc: UserWriteDoc = {
    uid,
    displayName,
    email,
    photoURL,
    mobileNumber: mobileNumber.trim(),
    organizationCode: 'default',
    organizationName: '',
    gstNumber: '',
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
    // Auto-promote any pending partner admin record for this email
    claimPendingPartnerAdmin({ email, uid, displayName }).catch(err => {
      console.warn('[AUTH] Pending partner admin claim failed (non-critical):', err)
    })
    // Auto-promote any pending org memberships for this email
    claimPendingOrgMemberships({ uid, email }).catch(err => {
      console.warn('[AUTH] Pending org membership claim failed (non-critical):', err)
    })
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
}

export async function updateUserProfile(
  uid: string,
  data: UpdateProfileParams
): Promise<void> {
  console.log('[AUTH] Updating profile for uid:', uid)

  try {
    const patch: Record<string, unknown> = {
      mobileNumber: data.mobileNumber.trim(),
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(firestore, 'users', uid), patch)
    console.log('[AUTH] Profile updated successfully for uid:', uid)
    const email = firebaseAuth.currentUser?.email ?? ''
    logProfileUpdated(uid, email, ['mobileNumber']).catch(() => {})
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
