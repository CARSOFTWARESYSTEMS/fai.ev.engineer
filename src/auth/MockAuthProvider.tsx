import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  uid: string
  email: string
  displayName: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Default is unauthenticated — will be replaced with Firebase auth
const MOCK_AUTH_ENABLED = false

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(
    MOCK_AUTH_ENABLED
      ? { uid: 'mock-uid-001', email: 'demo@fai.ev.engineer', displayName: 'Demo User' }
      : null
  )
  const [isLoading] = useState(false)

  const signIn = async (email: string, _password: string) => {
    setUser({ uid: 'mock-uid-001', email, displayName: email.split('@')[0] })
  }

  const signOut = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside MockAuthProvider')
  return ctx
}
