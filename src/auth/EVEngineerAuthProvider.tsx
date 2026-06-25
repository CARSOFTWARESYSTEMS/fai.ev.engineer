import { ReactNode, useState, useEffect, useCallback, useRef } from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { firebaseAuth } from '../firebase/auth'
import { EVEngineerAuthContext } from './EVEngineerAuthContext'
import type { EVEngineerUser } from './AuthTypes'
import {
  signInWithGoogle as googleSignIn,
  signOutUser,
  getUserProfile,
  touchLastLogin,
} from './EVEngineerAuthService'
import { clearGoogleDriveSession } from '../lib/googleDrive'
import { activateUserOnLogin } from '../services/lifecycleService'
import { logAuthLogin, logAuthLogout } from '../services/userActivityLogService'
import { claimPendingOrgMemberships } from '../services/organisationService'

interface Props {
  children: ReactNode
}

export function EVEngineerAuthProvider({ children }: Props) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<EVEngineerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Tracks the previously seen Firebase UID so we can detect user switches
  const prevUidRef = useRef<string | null>(null)

  const isProfileComplete = user?.profileCompleted === true

  // Re-load Firestore profile (called after completeProfile() to refresh context)
  const refreshProfile = useCallback(async () => {
    const fbUser = firebaseAuth.currentUser
    if (!fbUser) return
    const profile = await getUserProfile(fbUser.uid)
    setUser(profile)
  }, [])

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setIsLoading(true)

      // Clear Drive session whenever the signed-in user changes or logs out
      const prevUid = prevUidRef.current
      const nextUid = fbUser?.uid ?? null
      if (prevUid !== nextUid) {
        console.log('[DRIVE] User changed, clearing Drive session')
        clearGoogleDriveSession()
      }
      prevUidRef.current = nextUid

      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          let profile = await getUserProfile(fbUser.uid)
          // Returning login reactivates an inactive user
          if (profile && profile.lifecycleStatus === 'inactive') {
            activateUserOnLogin(fbUser.uid).catch(() => {})
            profile = { ...profile, lifecycleStatus: 'active' }
          }
          setUser(profile)
          // Update last login for returning users
          if (profile) {
            touchLastLogin(fbUser.uid).catch(() => {})
            logAuthLogin(fbUser.uid, fbUser.email ?? '').catch(() => {})
            claimPendingOrgMemberships({ uid: fbUser.uid, email: fbUser.email ?? '' }).catch(() => {})
          }
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    // signInWithPopup triggers onAuthStateChanged automatically
    await googleSignIn()
  }

  const signOut = async () => {
    if (firebaseUser) {
      logAuthLogout(firebaseUser.uid, firebaseUser.email ?? '').catch(() => {})
    }
    await signOutUser()
  }

  return (
    <EVEngineerAuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        isProfileComplete,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </EVEngineerAuthContext.Provider>
  )
}
