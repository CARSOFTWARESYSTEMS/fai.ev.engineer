# FAI Engineer — Sample Customer Demo Script

**Duration:** 15 minutes  
**Audience:** Aerospace/defence quality engineers, manufacturing managers  
**Goal:** Show a complete AS9102 FAIR workflow from drawing upload to FAIR package export

---

## Pre-Demo Setup (5 minutes before)

1. Sign in to FAI Engineer as a demo account with pre-seeded data
2. Open Developer Settings → Demo Data → ensure demo projects exist
3. Open the "Aerospace Bracket — Aft Fuselage" demo project (status: completed)
4. Have a sample drawing PDF ready for upload (any multi-page engineering drawing)
5. Keep a second browser tab open at the project list for the final reveal

---

## Demo Flow

---

### Step 1 — Login (1 minute)

**What to show:** The Google Sign-In flow.

> "FAI Engineer uses Google authentication — no new passwords to manage. Your existing Google workspace account gets you straight in."

- Click Sign in with Google
- Show the OAuth consent
- Land on the Dashboard

**Talking points:**
- Role-based access: Engineers see their projects; Managers see all projects and can approve FAIRs
- The beta watermark confirms this is a pre-release build

---

### Step 2 — Create a New Project (2 minutes)

**What to show:** Creating a project from scratch.

> "Every FAIR starts with a project. Let me create one now — this takes about 30 seconds."

- Click New Project
- Fill in:
  - Project Name: "Wing Rib Bracket"
  - Part Number: WRB-0042-001
  - Drawing Number: DWG-WRB-0042-001
  - Drawing Revision: Rev A
  - Customer: Boeing
  - Material: Aluminium 7075-T6
- Click Create

**Talking points:**
- Part number, drawing number, and revision are exactly what AS9102 requires in Form 1
- Status defaults to Draft — nothing is locked until you decide

---

### Step 3 — Upload Drawing (1 minute)

**What to show:** PDF upload to Google Drive.

> "The drawing lives in your Google Drive — always accessible, never lost."

- Click Upload Drawing
- Select the sample PDF
- Show the upload progress
- PDF opens in the viewer

**Talking points:**
- Stored in your organisation's Google Drive folder — not on our servers
- Multi-page drawings fully supported
- The watermark is only on-screen — never in the exported package

---

### Step 4 — Balloon the Drawing (2 minutes)

**What to show:** Click-to-balloon workflow.

> "This is where FAI Engineer saves the most time. Instead of manually numbering a drawing in Acrobat, you click directly on the PDF."

- Click on a dimension on the drawing → balloon 1 appears
- Click on two more features → balloons 2 and 3
- Show the balloon numbers are sequential and correct

**Talking points:**
- Each click places a balloon and creates a row in the feature table automatically
- Balloon positions are stored as percentages — resolution-independent, scale-independent
- Multi-page: navigate pages and balloon each separately

---

### Step 5 — Feature Table (2 minutes)

**What to show:** The feature table auto-populated from balloons.

> "As you place balloons, the feature table builds itself. You fill in the engineering data — nominal, tolerance, units."

- Show the 3 auto-populated rows
- Fill in balloon 1: Type = Diameter, Nominal = 30.00, Tolerance = ±0.02
- Min/max auto-calculates to 29.98 / 30.02
- Fill in balloon 2: Type = Thread, Nominal = M8x1.25, Tolerance = 6H

**Talking points:**
- Supports all AS9102 characteristic types: Linear, Diameter, Radius, Angle, Thread, GD&T, Surface Finish
- Min/max calculated automatically from nominal + tolerance
- This data feeds directly into Form 3 — you never re-enter it

---

### Step 6 — Form 1 (1 minute)

**What to show:** The AS9102 Form 1 header.

> "Form 1 is the FAIR cover sheet. Part number and drawing number are pre-filled from the project."

- Navigate to Form 1 tab
- Show pre-filled fields
- Fill in: FAIR Identifier, FAIR Type = Detail, Scope = Full
- Fill in: Verified By, Reviewed By, Date

**Talking points:**
- All fields map 1:1 to AS9102B Form 1 requirements
- Nonconformance field triggers NCR tracking in Form 3

---

### Step 7 — Form 2 (1 minute)

**What to show:** Material and process certification table.

> "Form 2 is your material and process certification register. One row per material or special process."

- Navigate to Form 2 tab
- Show the pre-seeded demo rows (Aluminium 6061-T6, Hard Anodise Type III, etc.)
- Add a new row: CNC Machining, N/A spec

**Talking points:**
- Supplier code, CoC number, acceptance report — all captured per AS9102
- Common processes like anodising, passivation, shot peening are in our suggestion library

---

### Step 8 — Form 3 (1 minute)

**What to show:** Inspection results against every characteristic.

> "Form 3 is where inspection results are recorded against every ballooned characteristic. The rows are already there — you just fill in the measurements."

- Navigate to Form 3 tab
- Show the 3 rows matching the features created earlier
- Set row 1 to Pass, enter result: 30.01
- Set row 2 to Pass
- Set row 3 to Fail, enter NC number: NC-0001

**Talking points:**
- Pass/fail status drives the overall FAIR disposition
- Failed characteristics automatically enable the NC number field
- Measurement equipment and tooling fields — full AS9102 compliance

---

### Step 9 — Review Workflow (1 minute)

**What to show:** Engineer submits → Manager approves.

> "When the engineer is done, they submit for review. A manager can approve, reject, or request rework — all tracked with a timestamp."

- Set project status to Review
- Switch to the manager account (or show the review screen)
- Click Approve

**Talking points:**
- Full audit trail: who approved, when
- Rejection sends it back to the engineer with a comment
- Completed projects are locked from editing

---

### Step 10 — FAIR Export (1 minute)

**What to show:** One-click FAIR package generation.

> "With everything completed, the FAIR package is one click away — a ZIP containing the drawing PDF, Form 1, Form 2, and Form 3 data."

- Navigate to the completed Aerospace Bracket demo project
- Click Export FAIR Package
- Show the downloaded ZIP
- Open it and show the contents: PDF + JSON forms

**Talking points:**
- Watermark is NOT in the exported PDF — it's clean for customer submission
- JSON data is structured for downstream integration
- Average FAIR prep time drops from 2–3 days to 2–3 hours

---

## Closing (1 minute)

> "That's a complete AS9102 FAIR — from a blank project to a ready-to-submit package — in about 15 minutes.
> In reality, with a real drawing and all characteristics ballooned, you're looking at 2–4 hours instead of 2–3 days.
> No more spreadsheets, no more Acrobat hacks, no more copy-paste between forms."

**Key value reminders:**
- Works on any engineering drawing (PDF)
- AS9102A and AS9102B compliant
- Google Drive storage — your data, your Drive
- Role-based access — engineers inspect, managers approve
- One-click FAIR package export

---

## Q&A Prompts

Common questions and suggested answers:

**"Can we use our own drawing format?"**
> Any PDF drawing works — single or multi-page. We support any revision block layout.

**"What happens if the drawing is revised?"**
> You create a new project for the new revision. The old FAIR is preserved.

**"Can multiple engineers work on the same project?"**
> Currently, projects are owned by the creating engineer. Multi-user collaboration is on the roadmap.

**"Where is the data stored?"**
> Drawings are in your Google Drive. Inspection data is in Firebase (Google Cloud). We do not store your drawings on our servers.

**"Is this AS9102A or B?"**
> The form structure covers both. Form fields are aligned to AS9102B requirements.
