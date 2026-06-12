# FAI Engineer — Beta Test Plan

**Version:** 1.0  
**Date:** 2026-06-12  
**Environment:** Internal beta (Firebase production project)  
**Tester:** Beta team / first customers

---

## How to Use This Document

For each test case:
1. Follow the steps exactly as written
2. Compare the actual result against the Expected Result
3. Mark **PASS** or **FAIL** in the Result column
4. Note any bug ID or comment in the Notes column

---

## 1. Authentication

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| A1 | Google Sign-In | Click "Sign in with Google", complete OAuth flow | Redirected to complete-profile page or dashboard | | |
| A2 | Sign-out | Click avatar → Sign out | Redirected to login page; session cleared | | |
| A3 | Re-sign-in | Sign in again after sign-out | Lands on dashboard (profile already complete) | | |
| A4 | Unauthenticated route guard | Navigate to `/dashboard` while signed out | Redirected to `/login` | | |
| A5 | Simultaneous tabs | Sign out in one tab | Other tabs redirect to login on next interaction | | |

---

## 2. User Profiles

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| P1 | Complete profile | New user → complete-profile page → fill all fields → Save | Profile saved; redirected to dashboard | | |
| P2 | Profile page view | Navigate to `/profile` | Displays name, email, org, role | | |
| P3 | Edit profile | Change display name → Save | Name updated across all page headers | | |
| P4 | Incomplete profile guard | New user skips profile → navigate to dashboard | Redirected back to complete-profile | | |

---

## 3. Projects

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| J1 | Create project | Click New Project → fill required fields → Create | Project appears in project list with status "Draft" | | |
| J2 | Required field validation | Submit create form with empty Part Number | Inline error shown; submit blocked | | |
| J3 | Project list | Navigate to `/projects` | All user projects listed with status badges | | |
| J4 | Search projects | Type part of a project name in search | List filters in real time | | |
| J5 | Edit project | Open project → Edit → change customer name → Save | Updated name shown in project header | | |
| J6 | Status transition (engineer) | Set status from Draft → In Progress | Status badge updates; no error | | |
| J7 | Status guard (engineer) | Try to set status to Completed as Engineer role | Option not available or blocked | | |
| J8 | Status transition (manager) | Manager sets status to Completed | Status updated; completedAt/completedBy recorded | | |
| J9 | Archive project | Manager sets status to Archived | Project shows Archived badge | | |
| J10 | Project priority | Set priority to Critical | Priority badge shown in project card | | |

---

## 4. PDF Upload

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| U1 | Upload PDF | Open project → Upload Drawing → select a PDF | Upload progress shown; PDF visible in viewer | | |
| U2 | PDF size limit | Upload a PDF > allowed size limit | Error message shown; upload blocked | | |
| U3 | Non-PDF file | Attempt to upload a .docx or image | Error: only PDF files accepted | | |
| U4 | PDF persists | Refresh page after upload | PDF still visible in viewer | | |
| U5 | Google Drive link | After upload, check project metadata | `googleDriveFileId` populated; Drive link available | | |

---

## 5. Ballooning

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| B1 | Add balloon | Open PDF viewer → click on drawing | Balloon circle placed at click position with next number | | |
| B2 | Balloon persists | Add balloon → refresh page | Balloon still present at same position | | |
| B3 | Multiple pages | Add balloons on page 1 and page 2 | Each page retains its own balloons | | |
| B4 | Balloon numbering | Add 3 balloons sequentially | Numbered 1, 2, 3 in order | | |
| B5 | Delete balloon | Right-click or select balloon → delete | Balloon removed; associated feature unlinked | | |
| B6 | 50 balloons | Add 50 balloons to a single project | All 50 render correctly; no performance issues | | |

---

## 6. Feature Table

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| F1 | Auto-populated row | Add balloon | Feature row auto-appears in feature table | | |
| F2 | Edit feature type | Set feature type to Diameter | Type shows as Diameter in table and Form 3 | | |
| F3 | Nominal + tolerance | Enter nominal 30.00, tolerance ±0.02 | Min/max auto-calculated as 29.98 / 30.02 | | |
| F4 | Save feature | Edit feature → Save | Changes reflected immediately | | |
| F5 | Feature sort | Sort by balloon number | Table reorders correctly | | |
| F6 | Feature count badge | Add 5 features | Badge on tab/header shows "5" | | |

---

## 7. AS9102 Form 1

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| F1A | Open Form 1 | Navigate to Form 1 tab | Pre-filled with project part number, drawing number | | |
| F1B | Fill all fields | Enter all Form 1 fields → Save | Data saved; no required-field errors | | |
| F1C | FAIR identifier | Enter identifier FAI-001-A | Saved and shown in form header | | |
| F1D | Nonconformance toggle | Set "Contains Nonconformance" to Yes | Field accepts value; saves | | |
| F1E | Date fields | Enter verified date and reviewed date | Dates saved in correct ISO format | | |
| F1F | Persist across reload | Save Form 1 → reload page | All fields still populated | | |

---

## 8. AS9102 Form 2

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| F2A | Add material row | Click Add Row → fill material name + spec | Row appears in table | | |
| F2B | Add process row | Add "Hard Anodise Type III" process row | Row saved with AMS 2469 spec | | |
| F2C | Row order | Reorder rows via drag or order field | Rows render in new order | | |
| F2D | Delete row | Delete a Form 2 row | Row removed from table | | |
| F2E | Multiple rows | Add 5 rows | All 5 rows shown in correct order | | |
| F2F | Persist across reload | Save rows → reload page | All rows still present | | |

---

## 9. AS9102 Form 3

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| F3A | Auto-populated rows | Complete Form 1 + features | Form 3 shows one row per feature | | |
| F3B | Set result PASS | Enter measurement result → set status Pass | Row turns green | | |
| F3C | Set result FAIL | Enter result → set status Fail | Row turns red; NC number field enabled | | |
| F3D | NC number | Enter NC number on failed characteristic | NC number saved | | |
| F3E | Inspector notes | Add inspector note to a row | Note saved | | |
| F3F | Overall pass rate | 90% pass rows | Pass rate shown correctly in summary | | |
| F3G | Pending rows | Leave some rows as Pending | Pending count shown in summary | | |

---

## 10. Exports

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| E1 | FAIR ZIP export | Complete project → Export FAIR Package | ZIP downloaded containing PDF + Form data | | |
| E2 | ZIP structure | Open downloaded ZIP | Contains form1.json, form2.json, form3.json, drawing PDF | | |
| E3 | Watermark absent | Open exported PDF | Watermark NOT present in exported PDF | | |
| E4 | Export with nonconformance | Project with NC rows → Export | NC numbers included in Form 3 export | | |
| E5 | Incomplete project export | Attempt export with no Form 1 | Warning shown or export blocked with explanation | | |

---

## 11. Review Workflow

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| R1 | Submit for review | Engineer sets status to Review | Status badge shows Review; manager notified (if notifications enabled) | | |
| R2 | Manager approves | Manager opens project → Approve | Status → Completed; reviewDecision = approved | | |
| R3 | Manager rejects | Manager opens project → Reject → add comment | Status → In Progress; reviewDecision = rejected; comment saved | | |
| R4 | Needs rework | Manager sets Needs Rework | Status → In Progress; engineer can edit | | |
| R5 | Cancel review | Manager cancels | Status reverts; reviewDecision = cancelled | | |
| R6 | Engineer cannot approve | As Engineer, try to approve own project | Approve button not shown | | |
| R7 | Audit trail entry | After status change | Audit trail entry created with changedBy, changedAt | | |

---

## 12. Branding

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| BR1 | Set active branding | Developer Settings → Branding → Create preset → Set Active | All app headers show new business name | | |
| BR2 | Powered-by link | Create preset with custom powered-by URL | Header "powered by" link navigates correctly | | |
| BR3 | Deactivate branding | Set active branding to None | Headers fall back to "FAI Engineer / powered by EV.ENGINEER" | | |
| BR4 | Branding on all pages | Activate a preset | Dashboard, Projects, Profile, Create/Edit Project all show new name | | |
| BR5 | Live update | Change active preset in one tab | Other open tabs update within 2–3 seconds | | |

---

## 13. Watermark

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| W1 | Enable watermark | Developer Settings → Watermark → Enabled ON → Save | Watermark visible on dashboard | | |
| W2 | Disable watermark | Set Enabled OFF → Save | Watermark disappears from all pages | | |
| W3 | Custom text | Change text to "CONFIDENTIAL DRAFT" | New text appears on all authenticated pages | | |
| W4 | Opacity control | Reduce opacity to 2% | Watermark nearly invisible but present | | |
| W5 | Variant | Switch to Dark variant | Watermark colour inverts for dark backgrounds | | |
| W6 | Absent from exports | Enable watermark → export FAIR package | Watermark NOT in PDF export | | |
| W7 | Live update | Change watermark in one tab | Other tabs reflect change without reload | | |

---

## 14. Role Management

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|-----------|-------|----------------|--------|-------|
| RM1 | Admin sees users tab | Log in as product Admin | Developer Settings → Product Users tab visible | | |
| RM2 | Search users | Type email in search box | List filters to matching users | | |
| RM3 | Change role (admin) | Admin changes Engineer → Manager | Role updated; audit log entry created | | |
| RM4 | Cannot self-modify | Admin tries to change own role | Change Role button hidden for own row | | |
| RM5 | Admin cannot assign super_admin | Admin tries to assign super_admin | super_admin not in role select options | | |
| RM6 | Super admin assigns admin | Super admin changes Engineer → Admin | Role updated successfully | | |
| RM7 | Engineer cannot access | Log in as Engineer → navigate to Developer Settings | Access Denied page shown | | |
| RM8 | Audit trail | After role change | roleAuditTrail entry written with correct fields | | |

---

## Pass / Fail Summary

| Section | Total Cases | Pass | Fail | Blocked |
|---------|-------------|------|------|---------|
| Authentication | 5 | | | |
| Profiles | 4 | | | |
| Projects | 10 | | | |
| PDF Upload | 5 | | | |
| Ballooning | 6 | | | |
| Feature Table | 6 | | | |
| Form 1 | 6 | | | |
| Form 2 | 6 | | | |
| Form 3 | 7 | | | |
| Exports | 5 | | | |
| Review Workflow | 7 | | | |
| Branding | 5 | | | |
| Watermark | 7 | | | |
| Role Management | 8 | | | |
| **TOTAL** | **87** | | | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead Developer | | | |
| QA Reviewer | | | |
| Product Owner | | | |
