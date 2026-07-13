import type { User as FirebaseUser } from 'firebase/auth'

// ─── Firestore user document schema ──────────────────────────────────────────

// 'engineer' | 'manager' are the current product roles.
// 'user' | 'admin' are legacy values kept for backward compatibility.
export type UserRole = 'user' | 'admin' | 'super_admin' | 'engineer' | 'manager'

// ─── Final role model types (Sprint 5 — additive, no breaking changes) ────────

// Platform-level roles (stored in users/{uid}.role going forward)
export type PlatformRole = 'super_admin' | 'admin' | 'developer'

// Partner-level roles (stored in partnerAdmins collection)
export type PartnerRole = 'partner_super_admin' | 'partner_admin'

// Organisation-level roles (stored in orgMemberships collection)
export type OrganisationRole =
  | 'owner'
  | 'manager'
  | 'engineer'
  | 'inspector'
  | 'auditor'
  | 'approver'
  | 'viewer'

// Union of all role strings across all tiers
export type AnyRole = PlatformRole | PartnerRole | OrganisationRole

// ─── Subscription types ───────────────────────────────────────────────────────

export type SubscriptionType = 'free' | 'trial' | 'monthly' | 'annual'
export type SubscriptionStatus = 'active' | 'expired' | 'pending_payment' | 'suspended'

// ─── Product catalogue ────────────────────────────────────────────────────────

export type ProductId =
  | 'fai_reports'
  | 'battery_trust'
  | 'motor_pm'
  | 'energy_mgmt'
  | 'clean_room'
  | 'ev_certificates'
  | 'autonomous'

// ─── Lifecycle status ─────────────────────────────────────────────────────────

export type LifecycleStatus =
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'deleted'
  | 'permanently_deleted'

export interface EVEngineerUser {
  uid: string
  displayName: string
  email: string
  photoURL: string

  // Contact
  mobileNumber: string

  // Organisation
  organizationCode: string   // slug of first word of org name, or "default"
  organizationName: string
  gstNumber: string

  // Role & state
  role: UserRole
  profileCompleted: boolean

  // Lifecycle — missing means 'active'
  lifecycleStatus?:            LifecycleStatus
  lastActivityAt?:             string
  blockedAt?:                  string
  blockedBy?:                  string
  blockedReason?:              string
  deletedAt?:                  string
  deletedBy?:                  string
  deletedReason?:              string
  permanentlyDeletedAt?:       string
  permanentlyDeletedBy?:       string
  permanentlyDeletedReason?:   string

  // Subscription
  subscriptionPlan: 'trial' | 'monthly' | 'annual'

  // Timestamps (ISO strings when read from Firestore)
  createdAt: string
  updatedAt: string
  lastLoginAt: string

  // Signup origin — set once at profile creation, read-only after
  signupDomain?:      string   // e.g. 'fai.ev.engineer'
  signupHostname?:    string   // same as signupDomain
  signupBrandingId?:  string   // brandingId active at signup
  signupPartnerCode?: string   // partner businessCode at signup
  signupPartnerName?: string   // partner businessName at signup
}

// ─── Auth context shape ───────────────────────────────────────────────────────

export interface EVEngineerAuthContextValue {
  /** Resolved EV.ENGINEER user profile from Firestore, null if not found yet */
  user: EVEngineerUser | null
  /** Raw Firebase auth user (available immediately after sign-in) */
  firebaseUser: FirebaseUser | null
  /** True while resolving auth state or loading Firestore profile */
  isLoading: boolean
  /** True when profileCompleted === true in Firestore */
  isProfileComplete: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  /** Re-fetches the Firestore profile into context (call after completeProfile) */
  refreshProfile: () => Promise<void>
}
