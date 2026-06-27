import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { collection, query, where, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { firestore } from '../../firebase/firestore'
import { useAuth } from '../../auth/hooks/useAuth'
import { toOrganisation, type Organisation, type OrganisationMember } from '../../services/organisationService'
import type { OrganisationRole } from '../../auth/AuthTypes'

// Single Firestore subscription for the current user's organisation context.
// Placed at app root so all components share one listener for the session lifetime.

export interface OrgContextState {
  org:       Organisation | null
  member:    OrganisationMember | null
  orgRole:   OrganisationRole | null
  isLoading: boolean
}

const OrgContext = createContext<OrgContextState>({
  org: null, member: null, orgRole: null, isLoading: true,
})

export function useOrgContext(): OrgContextState {
  return useContext(OrgContext)
}

export function OrgContextProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth()
  const [org,       setOrg]       = useState<Organisation | null>(null)
  const [member,    setMember]    = useState<OrganisationMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setOrg(null)
      setMember(null)
      setIsLoading(false)
      return
    }

    const uid   = firebaseUser.uid
    const email = (firebaseUser.email ?? '').toLowerCase()
    let unsubOrg: (() => void) | undefined

    // Primary: active memberships linked by UID
    const unsubActive = onSnapshot(
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
          setMember(null)
          setIsLoading(false)
          return
        }

        const memberDoc  = memberSnap.docs[0]
        const memberData = memberDoc.data()
        setMember({
          membershipId:     memberDoc.id,
          organisationId:   memberData.organisationId   as string,
          userUid:          memberData.userUid           as string,
          userEmail:        memberData.userEmail         as string,
          role:             (memberData.role as OrganisationRole) ?? 'viewer',
          membershipStatus: memberData.membershipStatus  as OrganisationMember['membershipStatus'],
          active:           (memberData.active as boolean) ?? true,
          createdAt:        memberData.createdAt         ?? null,
          createdBy:        (memberData.createdBy as string) ?? '',
        })

        unsubOrg = onSnapshot(
          doc(firestore, 'organisations', memberData.organisationId as string),
          snap => {
            setOrg(snap.exists()
              ? toOrganisation(snap.id, snap.data() as Record<string, unknown>)
              : null)
            setIsLoading(false)
          },
          () => { setOrg(null); setIsLoading(false) },
        )
      },
      () => { setOrg(null); setMember(null); setIsLoading(false) },
    )

    // Secondary: watch for pending memberships added while user is already logged in.
    // When found, self-claim by linking UID → primary listener fires and shows org.
    const unsubPending = email ? onSnapshot(
      query(
        collection(firestore, 'organisationMembers'),
        where('userEmail',        '==', email),
        where('membershipStatus', '==', 'pending'),
      ),
      async pendingSnap => {
        if (pendingSnap.empty) return
        await Promise.all(
          pendingSnap.docs
            .filter(d => (d.data().userUid ?? '') === '')
            .map(d => updateDoc(d.ref, {
              userUid:          uid,
              membershipStatus: 'active',
              active:           true,
            }).catch(() => { /* already claimed or concurrent update */ }))
        )
      },
      () => { /* ignore pending-query errors silently */ },
    ) : undefined

    return () => {
      unsubActive()
      unsubOrg?.()
      unsubPending?.()
    }
  }, [firebaseUser?.uid, firebaseUser?.email])

  return (
    <OrgContext.Provider value={{ org, member, orgRole: member?.role ?? null, isLoading }}>
      {children}
    </OrgContext.Provider>
  )
}
