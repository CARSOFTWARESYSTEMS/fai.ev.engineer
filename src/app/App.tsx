import { RouterProvider } from 'react-router-dom'
import { EVEngineerAuthProvider } from '../auth/EVEngineerAuthProvider'
import { WhatsAppCTA } from '../components/ui/WhatsAppCTA'
import { router } from './router'

export function App() {
  return (
    <EVEngineerAuthProvider>
      <RouterProvider router={router} />
      <WhatsAppCTA />
    </EVEngineerAuthProvider>
  )
}
