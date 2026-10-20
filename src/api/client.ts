import type { CandleSeriesJson, DashboardJson, SlackConnectionInput, SlackIntegrationJson } from "./types"

const DEFAULT_API_URL = "http://127.0.0.1:8080"
const SESSION_KEY = "mb_access"

export type Session = {
  access_token: string
  expires_at: string
  display_name: string
  language: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL
  if (typeof configured === "string" && configured.length > 0) {
    return configured.replace(/\/$/, "")
  }
  return DEFAULT_API_URL
}

export function loadSession(): Session | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as Session
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(session: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function register(email: string, password: string, displayName: string): Promise<Session> {
  return sendAuth("/auth/register", { email, password, display_name: displayName })
}

export function login(email: string, password: string): Promise<Session> {
  return sendAuth("/auth/login", { email, password })
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${apiBaseUrl()}/auth/logout`, { method: "POST", credentials: "include" })
  } finally {
    clearSession()
  }
}

export function fetchDashboard(): Promise<DashboardJson> {
  return getJson<DashboardJson>("/dashboard")
}

export function fetchCandles(ticker: string): Promise<CandleSeriesJson> {
  return getJson<CandleSeriesJson>(`/instruments/${encodeURIComponent(ticker)}/candles`)
}

export function fetchSlackIntegration(): Promise<SlackIntegrationJson> {
  return getJson<SlackIntegrationJson>("/integrations/slack")
}

export function saveSlackIntegration(input: SlackConnectionInput): Promise<SlackIntegrationJson> {
  return sendJson<SlackIntegrationJson>("/integrations/slack", input)
}

async function getJson<T>(path: string): Promise<T> {
  return readBody(await withRefresh(path))
}

async function sendJson<T>(path: string, body: object): Promise<T> {
  return readBody(await withRefresh(path, { method: "PUT", body: JSON.stringify(body) }))
}

async function withRefresh(path: string, init?: RequestInit): Promise<Response> {
  let response = await authorized(path, init)
  if (response.status === 401) {
    const refreshed = await refresh()
    if (!refreshed) {
      clearSession()
      throw new ApiError("Phiên đã hết hạn.", 401)
    }
    response = await authorized(path, init)
  }
  if (response.status === 401) {
    clearSession()
    throw new ApiError("Phiên đã hết hạn.", 401)
  }
  return response
}

async function readBody<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(await readError(response), response.status)
  }
  return response.json() as Promise<T>
}

async function sendAuth(path: string, body: object): Promise<Session> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError(`Không kết nối được ${apiBaseUrl()}`, 0)
  }
  if (!response.ok) {
    throw new ApiError(await readError(response), response.status)
  }
  const session = (await response.json()) as Session
  saveSession(session)
  return session
}

async function refresh(): Promise<boolean> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
  } catch {
    return false
  }
  if (!response.ok) {
    return false
  }
  saveSession((await response.json()) as Session)
  return true
}

async function authorized(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const session = loadSession()
  if (session) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }
  if (init?.body) {
    headers.set("Content-Type", "application/json")
  }
  try {
    return await fetch(`${apiBaseUrl()}${path}`, { ...init, headers, credentials: "include" })
  } catch {
    throw new ApiError(`Không kết nối được ${apiBaseUrl()}`, 0)
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; title?: string }
    return body.detail || body.title || `API trả ${response.status}`
  } catch {
    return `API trả ${response.status}`
  }
}
