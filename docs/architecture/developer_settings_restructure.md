# Developer Settings — Restructure Plan

**Date:** 2026-06-21  
**Status:** Architecture — Planned (not yet implemented)

---

## 1. Current Structure

```
Developer Settings
 ├─ Developers         (developer user management + config access)
 ├─ Configurations     (includes branding templates)
 ├─ Partners           (partner CRUD)
 ├─ Users / Contacts   (ContactsTab — all users)
 └─ Demo Data
```

**Current `Tab` type:**
```typescript
type Tab = 'developers' | 'configurations' | 'users' | 'demo' | 'partners' | 'contacts'
```

---

## 2. Target Structure

```
Developer Settings
 │
 ├─ Developer Access
 │   ├─ Developer Users        (platform role management: super_admin / admin / developer)
 │   └─ Roles & Access Matrix  (static read-only table — all tiers)
 │
 ├─ Partner Management
 │   ├─ Partners               (create/edit partners; merge domain + branding here)
 │   ├─ Branding / Domain      (moved from Configurations; per-partner branding templates)
 │   ├─ Admin Users            (partner_super_admin / partner_admin assignment)
 │   ├─ Organisations          (org list, subscription, seat limits per partner)
 │   ├─ Subscription & Billing (org subscription CRUD, payment recording)
 │   └─ Product Entitlements   (enable/disable products per partner → per org)
 │
 ├─ Users / Contacts           (all users; lifecycle, role, activity log — unchanged)
 │
 ├─ Products                   (product catalogue: status, landing placeholder links)
 │
 ├─ Configurations             (platform-level config: feature flags, defaults)
 │   └─ [Branding Templates removed — moved to Partner Management]
 │
 └─ Demo Data                  (seed data, reset — unchanged)
```

---

## 3. Key Structural Changes

### 3.1 Split "Developer Access" from "Partner Management"

Current `Developers` tab mixes platform user management with configurations. Split:
- `Developer Access` → sub-navigation with two items
- `Partner Management` → new top-level section with 6 sub-items

### 3.2 Move Branding Templates

```
FROM: Configurations → Platform Branding Templates
TO:   Partner Management → Branding / Domain
```

Rationale: branding is partner-scoped. Creating a partner and configuring its domain/branding should be a single flow.

### 3.3 Partner Creation Flow

When creating a new partner, the flow should combine:
1. Partner profile (name, code, domain)
2. Branding configuration (logo, colours, support contacts)
3. Initial product entitlement selection
4. Create first `partner_super_admin` user

These are currently in separate tabs — consolidate into a multi-step modal or wizard.

### 3.4 Organisation Management (Phase 2)

Organisation management lives under `Partner Management → Organisations`. This is not yet implemented. Design fields:

```typescript
interface OrganisationCreateInput {
  organisationName:  string
  organisationCode:  string   // auto-generated slug
  partnerId:         string
  ownerEmail:        string   // invited owner
  subscription: {
    type:       'trial' | 'monthly' | 'annual'
    currency:   'INR' | 'GBP' | 'USD'
    totalAmount: number
  }
  userLimits:        OrgUserLimits
  enabledProducts:   ProductId[]
}
```

### 3.5 Roles & Access Matrix (Phase 1 — Static UI)

New static tab under `Developer Access`:
- Read-only HTML table
- Shows all roles across all three tiers
- Columns: action category, permission per role
- No API calls, no state management
- Visible to `super_admin` / `admin` / `developer` only

---

## 4. Navigation Implementation Plan

### 4.1 New Tab Type

```typescript
type TopTab =
  | 'developer_access'
  | 'partner_management'
  | 'contacts'
  | 'products'
  | 'configurations'
  | 'demo'

type DeveloperAccessSubTab = 'developer_users' | 'access_matrix'

type PartnerManagementSubTab =
  | 'partners'
  | 'branding_domain'
  | 'admin_users'
  | 'organisations'
  | 'subscription_billing'
  | 'product_entitlements'
```

### 4.2 Backward Compatibility

Current tab IDs (`developers`, `configurations`, `partners`, `contacts`, `demo`) are stored in `localStorage` as `fai-dev-settings-tab`. During migration:
- Map `developers` → `developer_access`
- Map `partners` → `partner_management`
- Other tabs: keep as-is

---

## 5. Implementation Phases

| Phase | Items | When |
|-------|-------|------|
| 1 | Roles & Access Matrix (static UI) | Sprint 5 |
| 1 | Developer Settings navigation restructure (top-level tabs) | Sprint 5 |
| 2 | Partner Management sub-navigation | Sprint 6 |
| 2 | Branding/Domain tab (moved from Configurations) | Sprint 6 |
| 2 | Organisation Management (create org, assign owner) | Sprint 6 |
| 3 | Subscription & Billing UI | Sprint 7 |
| 3 | Product Entitlements UI | Sprint 7 |
| 3 | Partner Admin Users management | Sprint 7 |

---

## 6. Access Control

The entire Developer Settings page is guarded by `isDeveloper || isProductAdmin`. Within the page:

| Section | Access |
|---------|--------|
| Developer Access → Developer Users | `super_admin` only (create/delete); `admin` (read + limited create) |
| Developer Access → Roles & Access Matrix | `super_admin`, `admin`, `developer` |
| Partner Management | `super_admin`, `admin`; `developer` read-only |
| Users / Contacts | All developer/admin roles |
| Products | All developer/admin roles |
| Configurations | `super_admin`, `admin` |
| Demo Data | All developer/admin roles |
