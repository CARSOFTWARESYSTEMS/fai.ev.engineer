# FAI Engineer — Branding Settings & Watermark Architecture

**Date:** 2026-06-12
**Status:** Architecture — Not Yet Implemented
**Target sprint:** Phase 1

---

## 1. Purpose

FAI Engineer will be licensed to partner organisations who need their own brand identity in the product header (logo, business name). The platform also needs to show "powered by EV.ENGINEER" as a persistent attribution link.

This document covers:
- Branding presets data model
- Active branding selection
- Header layout (left: brand, right: org/user)
- EV.ENGINEER powered-by link
- Watermark configuration
- Firestore model
- Access rules
- Developer Settings UI design
- Fallback behaviour

---

## 2. Active Branding — Beta Default

During beta, the active branding will be:

```
iTelematics Software Private Limited
powered by EV.ENGINEER
```

The EV.ENGINEER text links to `https://ev.engineer` and opens in a new tab.

Later, a different partner branding can be set for demos without code changes.

---

## 3. Header Layout Design

### Left Side (Brand Identity)

```
[ Brand Logo ]
  Business Name
  powered by EV.ENGINEER  ←  "EV.ENGINEER" is a link to https://ev.engineer
```

Priority order:
1. If active branding is set → show brand logo + businessName
2. If no active branding → show `FAI Engineer` + `powered by EV.ENGINEER` (hardcoded fallback)

### Right Side (Organization + User)

```
[ Org Logo ]   (future — when org management is built)
Org Name       (future)
[ User Avatar ▾ ]
```

For beta: show only the user avatar menu (no org logo, no org name).

Once Organization Management is built, the right side will show org logo + org name alongside the avatar.

---

## 4. Branding Preset Data Model

### Firestore Collection: `brandings/{brandingId}`

```ts
interface BrandingPreset {
  brandingId: string             // auto-generated Firestore ID
  businessName: string           // "iTelematics Software Private Limited"
  businessCode: string           // slug, e.g. "itelematics"
  logoUrl?: string               // URL of the logo (GCS/Drive/CDN or base64 data URI)
  website?: string               // "https://itelematics.in"
  supportEmail?: string          // "support@itelematics.in"
  supportPhone?: string          // "+91 9876543210"
  whatsappNumber?: string        // international format, e.g. "919876543210"
  poweredByText: string          // "powered by EV.ENGINEER"
  poweredByUrl: string           // "https://ev.engineer"
  enabled: boolean               // false = hidden from preset list, not selectable
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string              // uid of creator
}
```

**Why a presets collection:**
- Multiple branding presets can be prepared (production, demo, partner A, partner B)
- Switching active branding does not require code changes or redeployment
- Only one preset is active at any time (enforced by `appConfig/activeBranding`)

---

## 5. Active Branding Selection

### Firestore Document: `appConfig/activeBranding`

```ts
interface ActiveBrandingConfig {
  activeBrandingId: string | null   // null = use fallback defaults
  updatedAt: Timestamp
  updatedBy: string                 // uid of developer who made the change
}
```

**Behaviour:**
1. `ProductConfigProvider` (or a new `BrandingProvider`) loads `appConfig/activeBranding` on startup
2. If `activeBrandingId` is null or document does not exist → use fallback defaults
3. If `activeBrandingId` is set → load `brandings/{activeBrandingId}` → render in header

**Real-time update:** Use `onSnapshot` so switching active branding in Developer Settings updates all open sessions live (same pattern as `betaBanner`).

---

## 6. Fallback Behaviour

If no active branding is configured:

```
businessName = "FAI Engineer"
poweredByText = "powered by EV.ENGINEER"
poweredByUrl = "https://ev.engineer"
logoUrl = undefined → render the "F" monogram icon (current default)
```

This fallback is hardcoded in the provider. The app never shows a broken state if `appConfig/activeBranding` is missing.

---

## 7. Access Rules

```
match /brandings/{brandingId} {
  // Any authenticated user can read presets (needed to render the header)
  allow read:   if isAuth();
  // Only Developer Admins can create/edit/delete presets
  allow create: if isDeveloperAdmin();
  allow update: if isDeveloperAdmin();
  allow delete: if isDeveloperAdmin();
}

// appConfig/activeBranding uses the existing appConfig rule:
// allow read:  if isAuth();
// allow write: if isDeveloper();
```

**Rationale:**
- End users must read the active branding to render the header — hence public read
- Branding changes affect the entire product experience — restrict write to Developer Admin
- The `activeBrandingId` pointer is in `appConfig`, which is writable by any developer (consistent with banner config)

---

## 8. Developer Settings UI Design

New section in Developer Settings → Configurations tab: **Branding Settings**

### Layout

```
Configurations
  ├── Banner Configuration          [existing]
  ├── Feature Flags                 [future]
  ├── Maintenance Mode              [future]
  ├── Branding Settings             [NEW]
  │     ├── Branding Presets
  │     │     ├── [Preset card 1] — iTelematics · ✓ Active
  │     │     ├── [Preset card 2] — Demo Partner
  │     │     └── [+ Add Branding]
  │     └── Active Branding Selector
  └── Restore Default Configs       [existing]
```

### Branding Preset Card

Each preset card shows:
- Logo (thumbnail or "F" placeholder)
- Business name
- Powered-by URL
- Active badge (if this is the current active preset)
- Edit / Delete buttons (Developer Admin only)
- "Set as Active" button (Developer Admin only)

### Add/Edit Branding Form

Fields:
- Business Name (required)
- Business Code (slug, required)
- Logo URL (optional, URL or upload placeholder)
- Website (optional)
- Support Email (optional)
- Support Phone (optional)
- WhatsApp Number (optional)
- Powered-by Text (default: "powered by EV.ENGINEER")
- Powered-by URL (default: "https://ev.engineer")
- Enabled toggle

### Header Preview

Show a live preview of how the header left side would look with the current preset data.

---

## 9. EV.ENGINEER Link (Implemented — PART 4)

The text `EV.ENGINEER` in the sub-brand line is now a clickable link pointing to `https://ev.engineer`, opening in a new tab.

This applies to all app headers:
- Public marketing header ([Header.tsx](../../src/components/layout/Header.tsx))
- In-app dashboard header ([DashboardPage.tsx](../../src/pages/DashboardPage.tsx))
- Login / register / complete-profile pages
- Profile page / create project page

**Implementation pattern:**

```tsx
<a
  href="https://ev.engineer"
  target="_blank"
  rel="noopener noreferrer"
  className="hover:underline hover:text-primary transition-colors"
>
  EV.ENGINEER
</a>
```

The surrounding `by ` text remains as a plain `<span>`.

**Future:** When the Branding Provider is implemented, the `poweredByText` and `poweredByUrl` fields from the active branding preset will replace the hardcoded values. The link component will become:

```tsx
<a
  href={activeBranding.poweredByUrl}
  target="_blank"
  rel="noopener noreferrer"
>
  {activeBranding.poweredByText.replace('powered by ', '')}
</a>
```

---

## 10. Watermark Configuration

### Current Behaviour

`BetaWatermark` renders a fixed full-screen overlay on Dashboard, Projects, and the PDF workspace. The text `FAI AS9102 BETA TESTING` is hardcoded. The component accepts a `variant` prop (`light` | `dark`).

**Watermarks never appear in exported files** — the watermark is an absolutely-positioned DOM element with `pointer-events: none`. It is never part of the PDF canvas or any exported workbook.

### Proposed Firestore Document: `appConfig/watermark`

```ts
interface WatermarkConfig {
  enabled: boolean           // true = show watermark; false = hide entirely
  text: string               // "FAI AS9102 BETA TESTING"
  opacity: number            // 0.00 – 0.20 (UI slider step 0.01)
  variant: 'light' | 'dark' | 'auto'
  updatedAt: Timestamp
  updatedBy: string
}
```

**Default values:**
```ts
{
  enabled: true,
  text: "FAI AS9102 BETA TESTING",
  opacity: 0.04,
  variant: 'light',
}
```

### Behaviour Rules

| Condition | Result |
| --- | --- |
| `enabled = false` | Watermark component returns `null` — no DOM element rendered |
| `text` changes | Watermark text updates live via `onSnapshot` |
| `opacity` changes | Watermark opacity updates live |
| `variant = 'auto'` | Use `'dark'` on pages with dark backgrounds (PDF workspace), `'light'` elsewhere |

### Developer Settings UI

Add to Configurations tab → new `CollapsibleCard`: **Watermark Configuration**

Fields:
- Enabled toggle
- Text input (free text, max 50 chars)
- Opacity slider (0.01 – 0.20, step 0.01, current value display)
- Variant selector (Light / Dark / Auto)
- Live preview (styled `<span>` showing the text at the configured opacity)
- Save Config / Reset to Default buttons

### Integration Plan

1. Create `watermarkService.ts` — `subscribeToWatermark`, `getWatermark`, `saveWatermark`, modelled after `betaNoticeService.ts`
2. Update `BetaWatermark.tsx` to accept config props and use `subscribeToWatermark`
3. Add `WatermarkConfig` panel to Configurations tab in Developer Settings
4. Add `appConfig/watermark` to `RESTORABLE_CONFIGS` list

### Firestore Rule

The existing `appConfig/{document=**}` wildcard rule covers `appConfig/watermark`:
```
allow read:  if isAuth();
allow write: if isDeveloper();
```
No rule change required.

---

## 11. Implementation Phases

### Phase 1 — EV.ENGINEER Link (Done)

Make `EV.ENGINEER` text a clickable `<a href="https://ev.engineer">` in all app headers. Preserve styling. No layout changes.

### Phase 2 — Watermark Configuration

1. `watermarkService.ts` — Firestore read/write helpers
2. Update `BetaWatermark.tsx` — consume config from Firestore
3. Developer Settings panel — enable/text/opacity/variant controls
4. Restore defaults support

### Phase 3 — Branding Presets

1. `brandingService.ts` — CRUD helpers for `brandings/` collection + `appConfig/activeBranding`
2. `useBranding()` hook — real-time subscription to active branding
3. Update all `by EV.ENGINEER` spans in headers to use active branding from hook
4. Developer Settings — Branding Settings section (list, add, edit, set active)

### Phase 4 — Organization Logo in Header (Requires Org Management)

After Organization Management is implemented, the header right side expands to show org logo + name.

---

## 12. Migration Path

The current hardcoded `by EV.ENGINEER` text and `FAI AS9102 BETA TESTING` watermark are not breaking changes. Phase 2 and Phase 3 each add a new Firestore document that falls back to hardcoded defaults if absent. No existing data needs migration.

The `appConfig/betaBanner` pattern is the reference implementation for both watermark and branding config reads.

---

*Related: [current_fai_engineer_architecture.md](current_fai_engineer_architecture.md)*
*Related: [organization_management_architecture.md](organization_management_architecture.md)*
