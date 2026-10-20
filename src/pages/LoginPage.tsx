import { useState, type FormEvent, type ReactNode } from "react"
import { Link } from "react-router"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/auth-context"

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError("")
    try {
      await login(email, password)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không đăng nhập được.")
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Đăng nhập"
      error={error}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="Vào bảng giá"
    >
      <Field label="Email" value={email} onChange={setEmail} type="email" />
      <Field label="Mật khẩu" value={password} onChange={setPassword} type="password" />
      <p className="text-sm text-stone-500">
        Chưa có tài khoản? <Link className="text-stone-900 underline" to="/register">Tạo tài khoản</Link>
      </p>
    </AuthCard>
  )
}

export function AuthCard({
  title,
  error,
  onSubmit,
  pending,
  submitLabel,
  children,
}: {
  title: string
  error: string
  onSubmit: (event: FormEvent) => void
  pending: boolean
  submitLabel: string
  children: ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-lg border border-stone-200 bg-white px-6 py-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Đang gửi" : submitLabel}
      </button>
    </form>
  )
}

export function Field({
  label,
  value,
  onChange,
  type,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type: string
}) {
  return (
    <label className="block text-sm">
      <span className="text-stone-600">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
      />
    </label>
  )
}
