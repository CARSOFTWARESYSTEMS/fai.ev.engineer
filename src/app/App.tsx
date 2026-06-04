import { RouterProvider } from 'react-router-dom'
import { MockAuthProvider } from '../auth/MockAuthProvider'
import { WhatsAppCTA } from '../components/ui/WhatsAppCTA'
import { router } from './router'

export function App() {
  return (
    <MockAuthProvider>
      <RouterProvider router={router} />
      <WhatsAppCTA />
    </MockAuthProvider>
  )
}
