import { RouterProvider } from 'react-router-dom'
import { MockAuthProvider } from '../auth/MockAuthProvider'
import { router } from './router'

export function App() {
  return (
    <MockAuthProvider>
      <RouterProvider router={router} />
    </MockAuthProvider>
  )
}
