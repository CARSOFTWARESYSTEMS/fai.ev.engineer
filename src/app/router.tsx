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
import { DeveloperSettingsPage } from '../pages/DeveloperSettingsPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { BootstrapRoute } from '../auth/BootstrapRoute'
import { PartnerRoute } from '../auth/PartnerRoute'
import { ProductRoute } from '../auth/ProductRoute'
import { CNCMachiningPage } from '../pages/fortius/CNCMachiningPage'
import { CNCMillingPage } from '../pages/fortius/CNCMillingPage'
import { CNCTurningPage } from '../pages/fortius/CNCTurningPage'
import { AerospaceComponentsPage } from '../pages/fortius/AerospaceComponentsPage'
import { AutomotiveComponentsPage } from '../pages/fortius/AutomotiveComponentsPage'
import { JigsFixturesPage } from '../pages/fortius/JigsFixturesPage'
import { PressToolsPage } from '../pages/fortius/PressToolsPage'
// ─── Phase 1.5 — Partner + Organization placeholders ─────────────────────────
import { OrganisationDetailPage } from '../pages/OrganisationDetailPage'
import { PartnerPage } from '../pages/PartnerPage'
import { PartnerOrganizationsPage } from '../pages/PartnerOrganizationsPage'
import { PartnerRequestsPage } from '../pages/PartnerRequestsPage'
import { PartnerSettingsPage } from '../pages/PartnerSettingsPage'
import { PartnerBrandingPage } from '../pages/PartnerBrandingPage'
import { OrganizationPage } from '../pages/OrganizationPage'
import { OrganizationTeamPage } from '../pages/OrganizationTeamPage'
import { OrganizationProjectsPage } from '../pages/OrganizationProjectsPage'
import { OrganizationSettingsPage } from '../pages/OrganizationSettingsPage'

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
    element: <ProtectedRoute><ProductRoute product="fai_reports"><ProjectsPage /></ProductRoute></ProtectedRoute>,
  },
  {
    path: '/projects/new',
    element: <ProtectedRoute><ProductRoute product="fai_reports"><CreateProjectPage /></ProductRoute></ProtectedRoute>,
  },
  {
    path: '/projects/:projectId',
    element: <ProtectedRoute><ProductRoute product="fai_reports"><ProjectDetailPage /></ProductRoute></ProtectedRoute>,
  },
  {
    path: '/projects/:projectId/edit',
    element: <ProtectedRoute><ProductRoute product="fai_reports"><EditProjectPage /></ProductRoute></ProtectedRoute>,
  },
  {
    path: '/projects/:projectId/pdf',
    element: <ProtectedRoute><ProductRoute product="fai_reports"><ProjectPdfViewerPage /></ProductRoute></ProtectedRoute>,
  },

  // ─── Developer Settings ───────────────────────────────────────────────────
  {
    path: '/developer-settings',
    element: <ProtectedRoute><DeveloperSettingsPage /></ProtectedRoute>,
  },

  // ─── Partner (Phase 2 — developer + partnerAdmin access) ─────────────────
  {
    path: '/partner',
    element: <PartnerRoute><PartnerPage /></PartnerRoute>,
  },
  {
    path: '/partner/organizations',
    element: <PartnerRoute><PartnerOrganizationsPage /></PartnerRoute>,
  },
  {
    path: '/partner/requests',
    element: <PartnerRoute><PartnerRequestsPage /></PartnerRoute>,
  },
  {
    path: '/partner/settings',
    element: <PartnerRoute><PartnerSettingsPage /></PartnerRoute>,
  },
  {
    path: '/partner/branding',
    element: <PartnerRoute><PartnerBrandingPage /></PartnerRoute>,
  },
  {
    path: '/partner/organisations/:id',
    element: <PartnerRoute><OrganisationDetailPage /></PartnerRoute>,
  },

  // ─── Organization (Phase 1.5 — bootstrap only) ────────────────────────────
  {
    path: '/organization',
    element: <BootstrapRoute><OrganizationPage /></BootstrapRoute>,
  },
  {
    path: '/organization/team',
    element: <BootstrapRoute><OrganizationTeamPage /></BootstrapRoute>,
  },
  {
    path: '/organization/projects',
    element: <BootstrapRoute><OrganizationProjectsPage /></BootstrapRoute>,
  },
  {
    path: '/organization/settings',
    element: <BootstrapRoute><OrganizationSettingsPage /></BootstrapRoute>,
  },

  // ─── 404 ──────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
])
