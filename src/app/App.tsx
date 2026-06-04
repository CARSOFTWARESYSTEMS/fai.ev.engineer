import { RouterProvider } from 'react-router-dom'
import { EVEngineerAuthProvider } from '../auth/EVEngineerAuthProvider'
import { ProductConfigProvider } from '../config/ProductConfigProvider'
import { WhatsAppCTA } from '../components/ui/WhatsAppCTA'
import { router } from './router'

export function App() {
  return (
    <EVEngineerAuthProvider>
      {/* ProductConfigProvider sits inside auth so it can read user.organizationCode */}
      <ProductConfigProvider>
        <RouterProvider router={router} />
        <WhatsAppCTA />
      </ProductConfigProvider>
    </EVEngineerAuthProvider>
  )
}
