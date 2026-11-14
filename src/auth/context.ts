import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  /** `undefined` while the stored session is still loading. */
  session: Session | null | undefined
}

export const AuthContext = createContext<AuthContextValue>({ session: undefined })

export function useAuth() {
  return useContext(AuthContext)
}
