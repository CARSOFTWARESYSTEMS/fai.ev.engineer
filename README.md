# FAI Engineer

A browser-based SaaS toolkit for engineering drawing ballooning, characteristic tables, and First Article Inspection (AS9102) report preparation.

**Website:** https://fai.ev.engineer
**Platform:** EV.ENGINEER

---

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Firebase Authentication (Google Sign-In)
- Firebase Firestore
- React Router v6

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication → Sign-in method → Google**.
3. Disable Email/Password, Phone, Anonymous, Apple, and Microsoft.
4. Enable **Firestore Database** (start in production mode).
5. Copy your project credentials.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_DRIVE_CLIENT_ID=your_drive_client_id
```

### 4. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste and publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read and update only their own profile
    match /users/{userId} {
      allow read, create, update: if request.auth != null
                                 && request.auth.uid == userId;
    }

    // Product configs: authenticated read, no client write
    match /productConfigs/{productKey} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Organization configs: authenticated read, no client write
    match /organizationConfigs/{organizationCode} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Projects: owner-only create/read/update/delete
    match /projects/{projectId} {
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid;
      allow read, update, delete: if request.auth != null
                                  && resource.data.uid == request.auth.uid;
    }
  }
}
```

> **If project creation shows a `permission-denied` error**, the `projects` rule above is either missing or not yet published in Firebase Console. Copy the full block above, paste it in Firestore → Rules, and click **Publish**.

> **Delete Project** permanently removes the Firestore project document (`deleteDoc`). This is an irreversible operation in MVP. The `delete` permission in the rule above grants this access only to the document owner.

### 5. Firebase Storage Rules

In Firebase Console → Storage → Rules, paste and publish:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projectFiles/{projectId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

PDF files are stored at: `projectFiles/{projectId}/drawing.pdf`
```

### 5. Run development server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### 6. Build for production

```bash
npm run build
```

---

## Authentication Flow (EVEngineerAuth)

### New User

```
Continue with Google
→ Google Auth popup
→ Check Firestore users/{uid}
→ Document not found
→ /complete-profile
    - WhatsApp Number (required)
    - Organization Name (optional)
    - GST Number (optional)
→ Create users/{uid} in Firestore
→ /dashboard
```

### Returning User

```
Continue with Google
→ Google Auth popup
→ users/{uid} found in Firestore
→ /dashboard
```

### Protected Route Guard

| State | Redirect |
|---|---|
| Not authenticated | `/login` |
| Authenticated, no Firestore profile | `/complete-profile` |
| Authenticated, profile complete | Allow `/dashboard` |

---

## Firestore Schema

**Collection:** `users`
**Document ID:** `{uid}`

```json
{
  "uid": "firebase_uid",
  "displayName": "Jane Smith",
  "email": "jane@company.com",
  "photoURL": "https://...",
  "whatsappNumber": "+91 98765 43210",
  "organizationCode": "fortius",
  "organizationName": "Fortius Machining Solutions",
  "gstNumber": "29ABCDE1234F1Z5",
  "subscriptionPlan": "trial",
  "createdAt": "2026-06-04T10:00:00.000Z",
  "lastLoginAt": "2026-06-04T10:00:00.000Z"
}
```

`organizationCode` is the first word of `organizationName`, lowercased.
If no organization is provided, it defaults to `"default"`.

---

## Project Structure

```
src/
  firebase/
    firebaseApp.ts       # Firebase app initialization
    auth.ts              # Firebase Auth instance
    firestore.ts         # Firestore instance

  auth/
    AuthTypes.ts                 # EVEngineerUser + context types
    EVEngineerAuthContext.tsx    # React context
    EVEngineerAuthProvider.tsx   # Auth state provider
    EVEngineerAuthService.ts     # Google sign-in, Firestore CRUD
    ProtectedRoute.tsx           # 3-state route guard
    hooks/
      useAuth.ts                 # useAuth() hook

  pages/
    LandingPage.tsx        # Public marketing site
    LoginPage.tsx          # Google Sign-In only
    CompleteProfilePage.tsx # New user profile completion
    DashboardPage.tsx      # Protected main app
    RoadmapPage.tsx        # Public roadmap
    NotFoundPage.tsx       # 404

  components/
    layout/
      Header.tsx
      Footer.tsx
    ui/
      WhatsAppCTA.tsx      # Sticky WhatsApp contact button

  config/
    theme.ts

  styles/
    index.css
```

---

## Sprint Status

### Day 1 — Foundation (Complete)
- Public marketing website with hero, features, pricing, FAQ
- Roadmap page
- SEO metadata + structured data
- Engineering collaborators section
- Sticky WhatsApp CTA

### Day 2 — Authentication (Complete)
- EVEngineerAuth reusable module
- Google Sign-In only (no email/password)
- Firestore user profile
- Complete Profile flow (WhatsApp + org details)
- 3-state ProtectedRoute

### Day 3 — Product Key Engine (Complete)
- ProductConfigProvider + feature flags per organization
- Multi-tenant product key system (`?pk=` URL param)
- Theme, logo, pricing, and feature access per org

### Day 4 — Project Management (Complete)
- Create, list, detail, edit, and delete projects
- Permanent delete — removes Firestore document (`deleteDoc`)
- Soft-delete replaced by permanent delete in MVP

### Day 5 — Upcoming
- PDF Drawing Viewer
- Manual Balloon Tool
- Feature Table (characteristic table)
- AS9102 Form 3 Export

---

## Delete Project Behavior

Delete Project permanently removes the Firestore document using `deleteDoc`. This is irreversible in MVP.

The Firestore `delete` permission in the security rules grants this to the document owner only.

### Future Admin Portal (not part of MVP)

When the Admin Portal is implemented, the following features may be introduced:

- Archive Project (soft delete with status = archived)
- Restore Project
- Audit History
- Deleted Project Recovery

---

## EVEngineerAuth — Reusable Module

The `src/auth/` module is designed to be shared across all EV.ENGINEER products:

- `fai.ev.engineer` — FAI Toolkit
- `battery.ev.engineer`
- `career.ev.engineer`
- `autonomous.ev.engineer`

The module exposes `EVEngineerAuthProvider` and `useAuth()` as standalone building blocks.

---

## License

Proprietary — EV.ENGINEER
