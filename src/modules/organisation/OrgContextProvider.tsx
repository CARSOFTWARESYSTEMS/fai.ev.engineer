import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore'
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

    return () => {
      unsubMembers()
      unsubOrg?.()
    }
  }, [firebaseUser?.uid])

  return (
    <OrgContext.Provider value={{ org, member, orgRole: member?.role ?? null, isLoading }}>
      {children}
    </OrgContext.Provider>
  )
}
