import { createContext, useContext } from "react"
import type { Session } from "../api/client"

export type AuthValue = {
  session: Session | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  expire: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("AuthProvider chưa được gắn.")
  }
  return value
}
