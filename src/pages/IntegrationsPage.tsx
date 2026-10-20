import { useState, type FormEvent } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, fetchSlackIntegration, saveSlackIntegration } from "../api/client"
import type { SlackIntegrationJson } from "../api/types"
import { useAuth } from "../auth/auth-context"

export function IntegrationsPage() {
  const { expire } = useAuth()
  const queryClient = useQueryClient()
  const slack = useQuery({
    queryKey: ["integrations", "slack"],
    queryFn: async () => {
      try {
        return await fetchSlackIntegration()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          expire()
        }
        throw error
      }
    },
    retry: false,
  })

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">Integrations</p>
        <h2 className="text-2xl font-semibold tracking-tight">Tích hợp</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Bot Slack vẫn chạy ở project Python. Trang này lưu ID kênh và token vào file cấu hình của bot, không hiện lại giá trị token.
        </p>
      </div>
      {slack.isPending ? <Status title="Đang hỏi API" detail="GET /integrations/slack" /> : null}
      {slack.isError ? (
        <Status
          title="Chưa đọc được cấu hình"
          detail={slack.error instanceof Error ? slack.error.message : "API không trả lời"}
        />
      ) : null}
      {slack.data ? (
        <SlackCard
          slack={slack.data}
          onSaved={(next) => queryClient.setQueryData(["integrations", "slack"], next)}
          onUnauthorized={expire}
        />
      ) : null}
    </section>
  )
}

function SlackCard({
  slack,
  onSaved,
  onUnauthorized,
}: {
  slack: SlackIntegrationJson
  onSaved: (next: SlackIntegrationJson) => void
  onUnauthorized: () => void
}) {
  const [channel, setChannel] = useState(slack.channel ?? "")
  const [botToken, setBotToken] = useState("")
  const [appToken, setAppToken] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError("")
    setSaved(false)
    try {
      const next = await saveSlackIntegration({
        channel: channel.trim(),
        bot_token: botToken.trim() || null,
        app_token: appToken.trim() || null,
      })
      onSaved(next)
      setBotToken("")
      setAppToken("")
      setChannel(next.channel ?? channel.trim())
      setSaved(true)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized()
      }
      setError(caught instanceof ApiError ? caught.message : "Không lưu được cấu hình.")
    } finally {
      setPending(false)
    }
  }

  return (
    <article className="space-y-5 rounded-lg border border-stone-200 bg-white px-5 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold">{slack.name}</h3>
        <p className="text-sm text-stone-600">{slack.ready ? "Đã đủ cấu hình" : "Thiếu cấu hình"}</p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Fact label="Ứng dụng" value={slack.app_name} />
        <Fact label="Bot" value={`@${slack.bot_name}`} />
        <Fact label="Cách nối" value="Socket Mode" />
        <Fact label="Kênh" value={slack.channel ?? "Chưa có ID kênh"} mono />
        <Fact label="Bot token" value={slack.bot_token_configured ? "Đã đặt" : "Chưa đặt"} />
        <Fact label="App token" value={slack.app_token_configured ? "Đã đặt" : "Chưa đặt"} />
      </dl>
      <div>
        <h4 className="text-sm font-medium text-stone-700">Lệnh</h4>
        <ul className="mt-2 divide-y divide-stone-100 border-y border-stone-100">
          {slack.commands.map((command) => (
            <li key={command.command} className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr_8rem] sm:items-baseline">
              <span className="font-mono text-sm">{command.command}</span>
              <span className="text-sm text-stone-600">{command.description}</span>
              <span className="font-mono text-xs text-stone-500">{command.usage}</span>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 border-t border-stone-100 pt-5">
        <h4 className="text-sm font-medium text-stone-700">Thông số kết nối</h4>
        <ConfigField label="ID kênh" value={channel} onChange={setChannel} type="text" placeholder="C0123456789" />
        <ConfigField
          label="Bot token"
          value={botToken}
          onChange={setBotToken}
          type="password"
          placeholder={slack.bot_token_configured ? "Để trống nếu giữ token hiện tại" : "xoxb-..."}
        />
        <ConfigField
          label="App token"
          value={appToken}
          onChange={setAppToken}
          type="password"
          placeholder={slack.app_token_configured ? "Để trống nếu giữ token hiện tại" : "xapp-..."}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {saved ? <p className="text-sm text-stone-600">Đã lưu. Tắt bot rồi chạy lại để nhận cấu hình mới.</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Đang lưu" : "Lưu cấu hình"}
        </button>
      </form>
      <p className="text-sm text-stone-500">
        Chạy bot bằng <span className="font-mono">uv run market-brief slack</span> trong project Python. Bot chỉ trả lời trong kênh đã cấu hình.
      </p>
    </article>
  )
}

function ConfigField({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type: string
  placeholder: string
}) {
  return (
    <label className="block max-w-md text-sm">
      <span className="text-stone-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono"
      />
    </label>
  )
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className={mono ? "mt-1 font-mono" : "mt-1"}>{value}</dd>
    </div>
  )
}

function Status({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 font-mono text-xs text-stone-500">{detail}</p>
    </div>
  )
}
