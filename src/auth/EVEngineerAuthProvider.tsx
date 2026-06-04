import { ReactNode, useState, useEffect, useCallback } from 'react'
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

interface Props {
  children: ReactNode
}

export function EVEngineerAuthProvider({ children }: Props) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<EVEngineerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid)
          setUser(profile)
          // Update last login for returning users
          if (profile) {
            touchLastLogin(fbUser.uid).catch(() => {
              // Non-critical — ignore failure
            })
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
    await signOutUser()
    // onAuthStateChanged fires automatically and clears state
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
