# FAI Engineer

A browser-based SaaS toolkit for engineering drawing ballooning, characteristic tables, and First Article Inspection (AS9102) report preparation.

## Product

**Website:** https://fai.ev.engineer  
**Platform:** EV.ENGINEER

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Firebase (Authentication + Firestore)
- React Router v6

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in Firebase credentials in .env.local

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`.

### Build

```bash
npm run build
```

Output is in `dist/`.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

See `.env.example` for required variables. Firebase project credentials are required for authentication and data persistence.

## Project Structure

```
src/
  app/          # App entry and router
  pages/        # Route-level page components
  components/
    layout/     # Header, Footer, page wrappers
    ui/         # Reusable UI elements
    sections/   # Landing page sections
  config/       # Theme and product configuration
  auth/         # Auth context, mock auth, protected routes
  styles/       # Global CSS
```

## Current Status

**Sprint 1 — Foundation**
- Public marketing website
- Authentication pages (UI only)
- Protected dashboard route (mock auth)
- Theme and routing structure

**Sprint 2 (upcoming)**
- Firebase Authentication
- PDF Viewer
- Balloon Tool
- Feature Table
- AS9102 Form 3 Export

## License

Proprietary — EV.ENGINEER
