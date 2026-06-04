import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { CompleteProfilePage } from '../pages/CompleteProfilePage'
import { DashboardPage } from '../pages/DashboardPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { CreateProjectPage } from '../pages/CreateProjectPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { RoadmapPage } from '../pages/RoadmapPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'

export const router = createBrowserRouter([
  // ─── Public ───────────────────────────────────────────────────────────────
  { path: '/',         element: <LandingPage /> },
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <LoginPage /> },
  { path: '/roadmap',  element: <RoadmapPage /> },

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

  // ─── 404 ──────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
])
