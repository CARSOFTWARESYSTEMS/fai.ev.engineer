/**
 * FAI Reports Product Module
 *
 * Product:   fai_reports
 * Type:      Internal (routes served within this app)
 * Status:    Active
 *
 * Product-owned pages:   src/pages/ProjectsPage, CreateProjectPage, ProjectDetailPage, etc.
 * Product-owned features: src/features/ballooning/, as9102/, featureTable/, export/
 * Product-owned services: src/projects/
 *
 * Shared platform imports allowed:
 *   src/auth/       — useAuth, ProtectedRoute, ProductRoute
 *   src/services/   — organisationService, brandingService, etc.
 *   src/firebase/   — firestore, auth
 *   src/modules/shared/ — domain validation, utilities
 *
 * No circular dependencies: this module must NOT import from other product modules.
 */

export const FAI_PRODUCT_KEY = 'fai_reports' as const
