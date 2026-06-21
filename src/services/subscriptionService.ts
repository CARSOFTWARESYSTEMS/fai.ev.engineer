import type { Timestamp } from 'firebase/firestore'
import type { OrgSubscriptionType } from './organisationService'

// ─── Duration table ────────────────────────────────────────────────────────────

const DURATION_DAYS: Record<OrgSubscriptionType, number> = {
  free:    0,   // free = no expiry (10-year sentinel)
  trial:   7,
  monthly: 31,
  annual:  366,
}

// ─── Calculations ──────────────────────────────────────────────────────────────

export function calculateExpiryDate(type: OrgSubscriptionType, startDate: Date): Date {
  const days = DURATION_DAYS[type]
  const d    = new Date(startDate)
  if (days === 0) {
    d.setFullYear(d.getFullYear() + 10)
    return d
  }
  d.setDate(d.getDate() + days)
  return d
}

export function calculateBalanceAmount(
  totalAmount:    number,
  discountAmount: number,
  paidAmount:     number,
): number {
  return Math.max(0, totalAmount - discountAmount - paidAmount)
}

// ─── Status helpers ────────────────────────────────────────────────────────────

export function isSubscriptionActive(expiryDate: Timestamp | null): boolean {
  if (!expiryDate) return false
  return Date.now() < expiryDate.toMillis()
}

export function isTrialExpired(
  type:       OrgSubscriptionType,
  expiryDate: Timestamp | null,
): boolean {
  if (type !== 'trial' || !expiryDate) return false
  return Date.now() > expiryDate.toMillis()
}

export function getSubscriptionStatus(
  type:       OrgSubscriptionType,
  expiryDate: Timestamp | null,
): 'active' | 'trial' | 'expired' | 'suspended' {
  if (!expiryDate) return type === 'free' ? 'active' : 'suspended'
  const expired = Date.now() > expiryDate.toMillis()
  if (expired) return 'expired'
  return type === 'trial' ? 'trial' : 'active'
}

// ─── Format helpers ────────────────────────────────────────────────────────────

export function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseDateInput(s: string): Date {
  return new Date(s + 'T00:00:00')
}

export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AED'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AED: 'د.إ',
}
