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

### 4. Firestore Security Rules (minimum for development)

In Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
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

### Day 3 — Upcoming
- PDF Drawing Viewer
- Manual Balloon Tool
- Feature Table (characteristic table)
- AS9102 Form 3 Export

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
