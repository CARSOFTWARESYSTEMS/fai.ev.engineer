import { useOrgContext, type OrgContextState } from '../modules/organisation/OrgContextProvider'

// Thin wrapper — all subscription logic lives in OrgContextProvider (single listener).
// Kept as a named export so existing call-sites don't need to change imports.

export type UserOrgState = OrgContextState

export function useUserOrg(): UserOrgState {
  return useOrgContext()
}
