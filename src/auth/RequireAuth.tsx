import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { useAuth } from "./auth-context"

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return children
}
