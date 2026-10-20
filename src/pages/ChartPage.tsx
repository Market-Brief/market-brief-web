import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { ApiError, fetchCandles, fetchDashboard } from "../api/client"
import { CandleChart } from "../charts/CandleChart"
import { useAuth } from "../auth/auth-context"

export function ChartPage() {
  const { expire } = useAuth()
  const params = useParams()
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        return await fetchDashboard()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          expire()
        }
        throw error
      }
    },
    retry: false,
  })
  const ticker = (params.ticker ?? dashboard.data?.symbols[0]?.ticker ?? "").toUpperCase()
  const candles = useQuery({
    queryKey: ["candles", ticker],
    enabled: ticker.length > 0,
    queryFn: async () => {
      try {
        return await fetchCandles(ticker)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          expire()
        }
        throw error
      }
    },
    retry: false,
  })
  const disclaimer = dashboard.data?.board.columns.find((column) => column.brief)?.brief?.disclaimer
  const unitLabel = candles.data?.price_unit === "point" ? "điểm" : "đồng"

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {candles.data ? `${candles.data.ticker} · ${candles.data.name}` : ticker || "Biểu đồ nến"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Nến ngày DNSE{candles.data ? `, giá bằng ${unitLabel}` : ""}. Màu thân so với giá mở cửa trong phiên. Mở sẵn 1 năm gần nhất; kéo sang trái để xem đủ 5 năm.
        </p>
      </div>
      {dashboard.data ? (
        <nav className="flex flex-wrap gap-2" aria-label="Mã theo dõi">
          {dashboard.data.symbols.map((symbol) => (
            <Link
              key={symbol.ticker}
              to={`/charts/${symbol.ticker}`}
              className={`rounded-full px-3 py-1 text-sm ${symbol.ticker === ticker ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"}`}
            >
              {symbol.ticker}
            </Link>
          ))}
        </nav>
      ) : null}
      {candles.isPending ? <Status title="Đang hỏi API" detail={`GET /instruments/${ticker}/candles`} /> : null}
      {candles.isError ? (
        <Status title="Chưa có nến" detail={candles.error instanceof Error ? candles.error.message : "API không trả lời"} />
      ) : null}
      {candles.data && candles.data.candles.length > 0 ? <CandleChart series={candles.data} /> : null}
      {candles.data && candles.data.candles.length === 0 ? <Status title="Chưa có nến ngày" detail={ticker} /> : null}
      {disclaimer ? <p className="text-sm text-stone-500">{disclaimer}</p> : null}
    </section>
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
