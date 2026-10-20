import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/auth-context"
import { AuthCard, Field } from "./LoginPage"

export function RegisterPage() {
  const { register } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError("")
    try {
      await register(email, password, displayName)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không tạo được tài khoản.")
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Tạo tài khoản"
      error={error}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="Tạo và vào bảng giá"
    >
      <Field label="Tên hiển thị" value={displayName} onChange={setDisplayName} type="text" />
      <Field label="Email" value={email} onChange={setEmail} type="email" />
      <Field label="Mật khẩu" value={password} onChange={setPassword} type="password" />
      <p className="text-sm leading-6 text-stone-500">
        Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và một ký tự đặc biệt.
      </p>
      <p className="text-sm text-stone-500">
        Đã có tài khoản? <Link className="text-stone-900 underline" to="/login">Đăng nhập</Link>
      </p>
    </AuthCard>
  )
}
