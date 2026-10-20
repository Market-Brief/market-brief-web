import { useState } from "react"
import { NavLink, Route, Routes, useLocation } from "react-router"
import { useAuth } from "./auth/auth-context"
import { RequireAuth } from "./auth/RequireAuth"
import { BoardPage } from "./pages/BoardPage"
import { ChartPage } from "./pages/ChartPage"
import { IntegrationsPage } from "./pages/IntegrationsPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"

const SIDEBAR_KEY = "mb_sidebar"

export default function App() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const wide = location.pathname.startsWith("/charts")
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "collapsed")

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current
      localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "open")
      return next
    })
  }

  return (
    <div className="flex min-h-svh bg-stone-50 text-stone-900">
      {session ? <Sidebar collapsed={collapsed} displayName={session.display_name} onToggle={toggleSidebar} onLogout={() => void logout()} /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {session ? null : (
          <header className="border-b border-stone-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-4">
              <div>
                <p className="text-xs text-stone-500">Nghiên cứu</p>
                <p className="text-lg font-semibold">Market Brief</p>
              </div>
              <p className="text-sm text-stone-500">Tài khoản</p>
            </div>
          </header>
        )}
        <main className={`mx-auto w-full flex-1 px-6 py-8 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <BoardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/charts"
              element={
                <RequireAuth>
                  <ChartPage />
                </RequireAuth>
              }
            />
            <Route
              path="/charts/:ticker"
              element={
                <RequireAuth>
                  <ChartPage />
                </RequireAuth>
              }
            />
            <Route
              path="/integrations"
              element={
                <RequireAuth>
                  <IntegrationsPage />
                </RequireAuth>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function Sidebar({
  collapsed,
  displayName,
  onToggle,
  onLogout,
}: {
  collapsed: boolean
  displayName: string
  onToggle: () => void
  onLogout: () => void
}) {
  return (
    <aside className={`flex shrink-0 flex-col border-r border-stone-200 bg-white ${collapsed ? "w-16" : "w-56"}`}>
      <div className={`flex items-start gap-2 py-5 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        {collapsed ? null : (
          <div>
            <p className="text-xs text-stone-500">Nghiên cứu</p>
            <p className="text-lg font-semibold">Market Brief</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
          title={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
          className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
        >
          <Chevron collapsed={collapsed} />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        <NavLink to="/" end title="Bảng giá" className={linkClass(collapsed)}>
          <Mark>B</Mark>
          {collapsed ? null : "Bảng giá"}
        </NavLink>
        <NavLink to="/charts" title="Biểu đồ" className={linkClass(collapsed)}>
          <Mark>N</Mark>
          {collapsed ? null : "Biểu đồ"}
        </NavLink>
        <NavLink to="/integrations" title="Tích hợp" className={linkClass(collapsed)}>
          <Mark>T</Mark>
          {collapsed ? null : "Tích hợp"}
        </NavLink>
      </nav>
      <div className={`border-t border-stone-200 py-4 text-sm ${collapsed ? "px-2 text-center" : "px-5"}`}>
        {collapsed ? null : <p className="truncate text-stone-600">{displayName}</p>}
        <button
          type="button"
          onClick={onLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className={`text-stone-900 underline ${collapsed ? "" : "mt-2"}`}
        >
          {collapsed ? "Ra" : "Đăng xuất"}
        </button>
      </div>
    </aside>
  )
}

function Mark({ children }: { children: string }) {
  return <span className="grid h-6 w-6 place-items-center rounded bg-stone-100 text-xs font-medium">{children}</span>
}

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d={collapsed ? "M7 4l6 6-6 6" : "M13 4l-6 6 6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function linkClass(collapsed: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-md px-2 py-2 text-sm ${collapsed ? "justify-center" : ""} ${isActive ? "bg-stone-100 font-medium text-stone-900" : "text-stone-600"}`
}
