import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type Role = 'admin' | 'demo'

export type Profile = {
  id: string
  full_name: string | null
  role: Role
}

export type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isDemo: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)