import { useEffect, useState } from 'react'
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'
import { useAuth } from '../auth/hooks/useAuth'
import { toOrganisation, type Organisation } from '../services/organisationService'

// ─── Hook: current user's organisation ───────────────────────────────────────
// Subscribes to the user's active OrganisationMember records in real time.
// When membership changes, re-subscribes to the corresponding Organisation doc.
// Returns null if the user has no active org membership.

export interface UserOrgState {
  org:       Organisation | null
  isLoading: boolean
}

export function useUserOrg(): UserOrgState {
  const { firebaseUser } = useAuth()
  const [org,       setOrg]       = useState<Organisation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setOrg(null)
      setIsLoading(false)
      return
    }

    const uid = firebaseUser.uid
    let unsubOrg: (() => void) | undefined

    const unsubMembers = onSnapshot(
      query(
        collection(firestore, 'organisationMembers'),
        where('userUid', '==', uid),
        where('membershipStatus', '==', 'active'),
      ),
      memberSnap => {
        unsubOrg?.()
        unsubOrg = undefined

        if (memberSnap.empty) {
          setOrg(null)
          setIsLoading(false)
          return
        }

        const organisationId = memberSnap.docs[0].data().organisationId as string
        unsubOrg = onSnapshot(
          doc(firestore, 'organisations', organisationId),
          snap => {
            setOrg(snap.exists() ? toOrganisation(snap.id, snap.data() as Record<string, unknown>) : null)
            setIsLoading(false)
          },
          () => { setOrg(null); setIsLoading(false) },
        )
      },
      () => { setOrg(null); setIsLoading(false) },
    )

    return () => {
      unsubMembers()
      unsubOrg?.()
    }
  }, [firebaseUser?.uid])

  return { org, isLoading }
}
