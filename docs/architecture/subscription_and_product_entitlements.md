# FAI Engineer — Subscription and Product Entitlements

**Date:** 2026-06-21  
**Status:** Architecture — Authoritative

---

## 1. Subscription Model

### 1.1 Subscription Types

| Type | Duration | Notes |
|------|----------|-------|
| `free` | Indefinite | Limited features; no expiry |
| `trial` | 7 days from `startDate` | Default for new orgs |
| `monthly` | 31 days from `startDate` | |
| `annual` | 366 days from `startDate` | |

### 1.2 Subscription Status

| Status | Meaning |
|--------|---------|
| `active` | Org can access platform normally |
| `expired` | Trial / subscription period ended; read-only or locked |
| `pending_payment` | Created but payment not confirmed |
| `suspended` | Manually suspended by admin or non-payment |

### 1.3 Firestore Schema

**Collection:** `organisations/{orgId}`  
**Field:** `subscription`

```typescript
interface OrganisationSubscription {
  type:            'free' | 'trial' | 'monthly' | 'annual'
  status:          'active' | 'expired' | 'pending_payment' | 'suspended'
  startDate:       Timestamp
  expiryDate:      Timestamp
  currency:        'INR' | 'GBP' | 'USD' | string
  totalAmount:     number
  discountAmount:  number
  paidAmount:      number
  balanceAmount:   number    // totalAmount - paidAmount
  paymentNotes?:   string
}
```

**Expiry computation:**
```typescript
const DURATION_DAYS = { trial: 7, monthly: 31, annual: 366, free: 0 }
expiryDate = Timestamp.fromMillis(startDate.toMillis() + DURATION_DAYS[type] * 86_400_000)
```

### 1.4 Subscription Visibility

| Role | View | Edit |
|------|------|------|
| `super_admin` | All orgs | ✅ |
| `admin` | All orgs | ✅ |
| `developer` | All orgs | ❌ |
| `partner_super_admin` | Own partner's orgs | ✅ |
| `partner_admin` | Own partner's orgs | ✅ |
| `owner` (org) | Own org only | ❌ |
| Other org roles | Hidden | ❌ |

---

## 2. Organisation Seat Limits

### 2.1 Default Limits

```typescript
interface OrgUserLimits {
  ownerLimit:     number   // default: 1
  managerLimit:   number   // default: 2  (max default: 5)
  engineerLimit:  number   // default: 2  (max default: 5)
  inspectorLimit: number   // default: 0  (optional paid seat)
  auditorLimit:   number   // default: 0  (optional paid seat)
  approverLimit:  number   // default: 0  (optional paid seat)
  viewerLimit:    number   // default: 0  (optional paid seat)
}
```

### 2.2 Seat Rules

- `owner`: Always 1. Not configurable.
- `manager` / `engineer`: Configurable. Default max = 5. Partner can increase.
- `inspector` / `auditor` / `approver` / `viewer`: Optional paid seats. Default = 0. Partner enables and sets limit.
- Seat enforcement: checked at invite time. If org is at limit for a role, invitation is blocked.

### 2.3 Who Sets Limits

| Role | Can change limits |
|------|------------------|
| `super_admin` | Any org |
| `admin` | Any org |
| `partner_super_admin` | Own partner's orgs |
| `partner_admin` | Own partner's orgs |
| `owner` (org) | ❌ |

---

## 3. Product Entitlements

### 3.1 Product Catalogue

| Product ID | Name | Status |
|-----------|------|--------|
| `fai_reports` | Balloon Drawings + AS9102 FAI Reports | Production |
| `battery_pm` | Battery Predictive Maintenance | Dev (placeholder) |
| `motor_pm` | Motor Predictive Maintenance | Dev (placeholder) |
| `energy_mgmt` | Energy Management | Dev (placeholder) |
| `clean_room` | Clean Room Solutions | Dev (placeholder) |

### 3.2 Entitlement Hierarchy

```
Platform level
└── Platform enables product for Partner
    └── Partner enables subset for Organisation
        └── Organisation users see only enabled products
```

**Rule:** Disabled products must be completely hidden from UI — no error state, no lock icon, simply not rendered.

### 3.3 Firestore Schema

**Platform-level enablement** (`platformConfig/products`):
```typescript
interface PlatformProductConfig {
  enabledProducts: ProductId[]
}
```

**Partner-level enablement** (`partners/{partnerId}`):
```typescript
interface PartnerDocument {
  enabledProducts: ProductId[]  // subset of platform enabledProducts
}
```

**Organisation-level enablement** (`organisations/{orgId}`):
```typescript
interface OrganisationDocument {
  enabledProducts: ProductId[]  // subset of partner enabledProducts
}
```

### 3.4 Product Entitlement Visibility

| Role | View enablement | Edit enablement |
|------|----------------|----------------|
| `super_admin` | All levels | All levels |
| `admin` | All levels | All levels |
| `developer` | All levels | ❌ |
| `partner_super_admin` | Own partner + orgs | Own partner's orgs only |
| `partner_admin` | Own partner + orgs | Own partner's orgs only |
| `owner` | Own org | ❌ |
| Other org roles | N/A (products just hidden) | ❌ |

### 3.5 Product Landing Placeholders

For non-`fai_reports` products (currently dev):

- Create a minimal static landing page per product with:
  - Product heading
  - One-paragraph description
  - "Coming Soon" or "In Development" label
  - No implementation content
- Only rendered if product is enabled for org
- Hidden completely if not enabled

### 3.6 Current productConfig Integration

The existing `productConfig.types.ts` / `useProductConfig()` hook uses a flat feature flag system per org (`canAccess(featureKey)`). The new entitlement model extends this:

1. First gate: `enabledProducts` check (is the product enabled for this org?)
2. Second gate: `canAccess(featureKey)` within the product (feature flags)
3. Existing `canAccess` remains for backward compat within FAI product

---

## 4. Trial / Subscription Enforcement

| Condition | Behaviour |
|-----------|-----------|
| Trial active | Full access within seat limits |
| Trial expired | Read-only: can view/export projects, cannot create/edit |
| `pending_payment` | Warning banner; admin can edit, engineers see read-only |
| `suspended` | Login blocked with support contact; admin can contact partner |
| `free` | Limited features per product config |

Enforcement is applied at:
1. Route guard (check org subscription before rendering page)
2. Service layer (check before write operations)
3. Firestore rules (secondary enforcement for create/update)

---

## 5. Billing Currency and Multi-Currency

- Default currency: `INR`
- Supported: `INR`, `GBP`, `USD` + any ISO 4217 string
- Currency set per organisation at subscription creation
- Currency is immutable after first payment is recorded
- `totalAmount`, `discountAmount`, `paidAmount`, `balanceAmount` are all in the org's `currency`

---

## 6. Implementation Priority

| Priority | Item |
|----------|------|
| P0 (now) | TypeScript types for subscription, seat limits, product IDs |
| P0 (now) | Firestore rules for subscription read access by partner roles |
| P1 | Partner admin: org creation flow with subscription setup |
| P1 | Trial expiry enforcement in route guards |
| P2 | Product entitlement gating in UI |
| P2 | Product landing placeholder pages |
| P3 | Payment recording UI for admin/partner |
| P3 | Seat enforcement at invite time |
