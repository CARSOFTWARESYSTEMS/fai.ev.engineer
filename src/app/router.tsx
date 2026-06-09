import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { FortiusPage } from '../pages/FortiusPage'
import { LoginPage } from '../pages/LoginPage'
import { CompleteProfilePage } from '../pages/CompleteProfilePage'
import { DashboardPage } from '../pages/DashboardPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { CreateProjectPage } from '../pages/CreateProjectPage'
import { EditProjectPage } from '../pages/EditProjectPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { ProjectPdfViewerPage } from '../pages/ProjectPdfViewerPage'
import { RoadmapPage } from '../pages/RoadmapPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { CNCMachiningPage } from '../pages/fortius/CNCMachiningPage'
import { CNCMillingPage } from '../pages/fortius/CNCMillingPage'
import { CNCTurningPage } from '../pages/fortius/CNCTurningPage'
import { AerospaceComponentsPage } from '../pages/fortius/AerospaceComponentsPage'
import { AutomotiveComponentsPage } from '../pages/fortius/AutomotiveComponentsPage'
import { JigsFixturesPage } from '../pages/fortius/JigsFixturesPage'
import { PressToolsPage } from '../pages/fortius/PressToolsPage'

export const router = createBrowserRouter([
  // ─── Public ───────────────────────────────────────────────────────────────
  { path: '/',          element: <LandingPage /> },
  { path: '/login',     element: <LoginPage /> },
  { path: '/register',  element: <LoginPage /> },
  { path: '/roadmap',   element: <RoadmapPage /> },
  { path: '/Fortius',   element: <FortiusPage /> },

  // ─── Fortius service pages ────────────────────────────────────────────────
  { path: '/fortius/cnc-machining',        element: <CNCMachiningPage /> },
  { path: '/fortius/cnc-milling',          element: <CNCMillingPage /> },
  { path: '/fortius/cnc-turning',          element: <CNCTurningPage /> },
  { path: '/fortius/aerospace-components', element: <AerospaceComponentsPage /> },
  { path: '/fortius/automotive-components',element: <AutomotiveComponentsPage /> },
  { path: '/fortius/jigs-and-fixtures',    element: <JigsFixturesPage /> },
  { path: '/fortius/press-tools',          element: <PressToolsPage /> },

  // ─── Auth flow ────────────────────────────────────────────────────────────
  { path: '/complete-profile', element: <CompleteProfilePage /> },

  // ─── Protected ────────────────────────────────────────────────────────────
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/profile',
    element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
  },
  {
    path: '/projects',
    element: <ProtectedRoute><ProjectsPage /></ProtectedRoute>,
  },
  {
    path: '/projects/new',
    element: <ProtectedRoute><CreateProjectPage /></ProtectedRoute>,
  },
  {
    path: '/projects/:projectId',
    element: <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>,
  },
  {
    path: '/projects/:projectId/edit',
    element: <ProtectedRoute><EditProjectPage /></ProtectedRoute>,
  },
  {
    path: '/projects/:projectId/pdf',
    element: <ProtectedRoute><ProjectPdfViewerPage /></ProtectedRoute>,
  },

  // ─── 404 ──────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
])
