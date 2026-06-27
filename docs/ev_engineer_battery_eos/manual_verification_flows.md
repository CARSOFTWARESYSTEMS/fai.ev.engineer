# Manual Verification Flows — Battery EOS

## Prerequisites

- Firebase project running with Auth and Firestore
- At least one user with `battery_pm` org entitlement
- At least one user with `orgRole: engineer`
- At least one user with `orgRole: manager` or `owner`
- At least one user with `orgRole: approver` or `manager`
- Developer access user (for full-access testing)

---

## Flow 1: Product Card Visibility

1. Log in as a user whose org has `battery_pm` in `enabledProducts`
2. Navigate to `/dashboard`
3. Verify "Battery Intelligence & Cybersecurity" card appears with a **NEW** badge
4. Verify the card shows "Open Product" button
5. Click "Open Product" → should navigate to `/products/battery-intelligence`
6. Log in as a user whose org does NOT have `battery_pm` → card must not appear

---

## Flow 2: Engineer Check-in Gate

1. Log in as a user with `orgRole: engineer` and `battery_pm` entitlement
2. Navigate to `/products/battery-intelligence`
3. Verify the amber "Daily check-in required" banner appears
4. Verify the `DailyCheckinPanel` form is shown
5. Fill in Yesterday's Work (required), Today's Plan (required)
6. Toggle "I have a blocker" → verify Blocker Description field appears
7. Submit the form
8. Verify the gate clears and the EOS workspace is shown
9. Refresh the page → check-in gate must NOT appear again today
10. Navigate away and return → gate must still be bypassed

---

## Flow 3: Non-Engineer Direct Access

1. Log in as a user with `orgRole: manager` or `viewer`
2. Navigate to `/products/battery-intelligence`
3. Verify the check-in gate does NOT appear
4. Verify the EOS workspace is shown directly with the Overview tab active

---

## Flow 4: Tab Visibility by Role

### Engineer
- Tabs visible: Overview, My Work
- Team tab: hidden
- Reviews tab: hidden

### Manager / Owner
- Tabs visible: Overview, Team
- My Work tab: hidden
- Reviews tab: hidden (unless also `approver`)

### Approver
- Tabs visible: Overview, Reviews
- My Work tab: hidden
- Team tab: hidden

### Developer / Admin
- All 4 tabs visible: Overview, My Work, Team, Reviews

---

## Flow 5: Work Package Cards

1. On the Overview tab, verify two WP cards appear:
   - WP-001 Battery Aadhaar Platform
   - WP-005 Battery Cybersecurity Platform
2. Each card shows: WP ID badge, mission name, title, definition, status/priority, progress bar, milestone/story count
3. **Info button**: visible to all authenticated users → clicking opens WP detail overlay
4. **Demo button**: visible to all → clicking opens WP detail overlay
5. **Engineering button**: only visible if `access.canEngineering === true`
6. Click Engineering → `WorkPackageDetail` full-screen overlay appears
7. Tab through: Overview, Milestones, Stories, Kanban, Documents
8. Click a story card → `StoryDetailPanel` slides in from right
9. Verify acceptance criteria, DoD, test cases, security test cases are all listed
10. Press X or click backdrop → overlay closes

---

## Flow 6: My Work Tab (Engineer)

1. Log in as an engineer who has checked in today
2. Click "My Work" tab
3. Verify `EngineerDashboard` renders with:
   - Today's check-in summary (green panel with yesterday/today text)
   - Blocker shown in amber if `hasBlocker: true`
   - 3 stat cards: Work Packages, Active Stories, Blocked
   - Active stories grid (if any assigned)
4. If a story is in `blocked` status, verify it appears in the Blocked Stories section

---

## Flow 7: Team Tab (Manager)

1. Log in as a user with `orgRole: manager` or `owner`
2. Click "Team" tab
3. Verify `ManagerDashboard` renders with:
   - 4 status stat cards: In Development, QA/Review, Approved, Blocked
   - Today's Check-ins panel (shows engineers who have checked in)
   - Blocked badge highlighted in amber for engineers with blockers
   - Work Package Progress bars for WP-001 and WP-005

---

## Flow 8: Reviews Tab (Reviewer)

1. Log in as a user with `orgRole: approver`, `manager`, or `owner`
2. Click "Reviews" tab
3. Verify `ReviewQueue` renders
4. If a story has status `technical_review` or `ready_for_verification`, it appears in the queue
5. Click "Review" on a story
6. Fill in all 7 score sliders (0–10 each)
7. Verify Overall Score updates in real-time
8. Add reviewer comments (required)
9. Click "Approve" or "Request Rework"
10. Submit → verify the story disappears from the queue and shows in the session counter

---

## Flow 9: Unauthenticated Access

1. Log out
2. Navigate to `/products/battery-intelligence`
3. Verify redirect to `/login`
4. Navigate to `/dashboard`
5. Verify redirect to `/login`

---

## Flow 10: FAI Reports Not Broken

1. Log in as a user with `fai_reports` entitlement
2. Navigate to `/projects`
3. Verify FAI Reports works normally
4. Create or open an existing project
5. Verify PDF viewer works at `/projects/:projectId/pdf`
6. Navigate to `/dashboard` → verify FAI Reports product card is still visible
