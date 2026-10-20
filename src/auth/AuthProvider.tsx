import { useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router"
import {
  clearSession,
  loadSession,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../api/client"
import { AuthContext, type AuthValue } from "./auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => loadSession())
  const navigate = useNavigate()
  const value = useMemo<AuthValue>(
    () => ({
      session,
      async login(email, password) {
        const next = await loginRequest(email, password)
        setSession(next)
        await navigate("/")
      },
      async register(email, password, displayName) {
        const next = await registerRequest(email, password, displayName)
        setSession(next)
        await navigate("/")
      },
      async logout() {
        await logoutRequest()
        setSession(null)
        await navigate("/login")
      },
      expire() {
        clearSession()
        setSession(null)
      },
    }),
    [navigate, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
