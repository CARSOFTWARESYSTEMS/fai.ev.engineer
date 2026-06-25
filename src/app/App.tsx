import { RouterProvider } from 'react-router-dom'
import { EVEngineerAuthProvider } from '../auth/EVEngineerAuthProvider'
import { ProductConfigProvider } from '../config/ProductConfigProvider'
import { BrandingProvider } from '../hooks/useBranding'
import { DomainContextProvider } from '../modules/website/DomainContextProvider'
import { WhatsAppCTA } from '../components/ui/WhatsAppCTA'
import { router } from './router'

export function App() {
  return (
    <EVEngineerAuthProvider>
      {/* DomainContextProvider resolves hostname → domainMappings, falls back gracefully */}
      <DomainContextProvider>
        {/* ProductConfigProvider sits inside auth so it can read user.organizationCode */}
        <ProductConfigProvider>
          {/* BrandingProvider resolves domain-based branding once for the whole app */}
          <BrandingProvider>
            <RouterProvider router={router} />
            <WhatsAppCTA />
          </BrandingProvider>
        </ProductConfigProvider>
      </DomainContextProvider>
    </EVEngineerAuthProvider>
  )
}
