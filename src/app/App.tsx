import { RouterProvider } from 'react-router-dom'
import { EVEngineerAuthProvider } from '../auth/EVEngineerAuthProvider'
import { OrgContextProvider } from '../modules/organisation/OrgContextProvider'
import { ProductConfigProvider } from '../config/ProductConfigProvider'
import { BrandingProvider } from '../hooks/useBranding'
import { DomainContextProvider } from '../modules/website/DomainContextProvider'
import { WhatsAppCTA } from '../components/ui/WhatsAppCTA'
import { router } from './router'

export function App() {
  return (
    <EVEngineerAuthProvider>
      {/* OrgContextProvider holds the single Firestore subscription for org/member data */}
      <OrgContextProvider>
        {/* DomainContextProvider resolves hostname → domainMappings, falls back gracefully */}
        <DomainContextProvider>
          {/* ProductConfigProvider reads org.code from OrgContextProvider */}
          <ProductConfigProvider>
            {/* BrandingProvider resolves domain-based branding once for the whole app */}
            <BrandingProvider>
              <RouterProvider router={router} />
              <WhatsAppCTA />
            </BrandingProvider>
          </ProductConfigProvider>
        </DomainContextProvider>
      </OrgContextProvider>
    </EVEngineerAuthProvider>
  )
}
