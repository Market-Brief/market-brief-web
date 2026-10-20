import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { ApiError, fetchDashboard } from "../api/client"
import type { BoardColumnJson, DashboardSymbolJson } from "../api/types"
import { useAuth } from "../auth/auth-context"

export function BoardPage() {
  const { expire } = useAuth()
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

  const disclaimer = dashboard.data?.board.columns.find((column) => column.brief)?.brief?.disclaimer

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Bảng giá</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Danh sách theo dõi của bạn, ba nguồn dnse, vci và kbs. Trình duyệt không gọi thẳng sàn.
        </p>
      </div>

      {dashboard.isPending ? <Status title="Đang hỏi API" detail="GET /dashboard" /> : null}
      {dashboard.isError ? (
        <Status
          title="Chưa có dữ liệu"
          detail={dashboard.error instanceof Error ? dashboard.error.message : "API không trả lời"}
        />
      ) : null}
      {dashboard.data ? (
        <BoardTable symbols={dashboard.data.symbols} columns={dashboard.data.board.columns} />
      ) : null}
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

function BoardTable({
  symbols,
  columns,
}: {
  symbols: DashboardSymbolJson[]
  columns: BoardColumnJson[]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 text-stone-500">
          <tr>
            <th className="px-4 py-2 font-medium">Mã</th>
            {columns.map((column) => (
              <th key={column.name} className="px-4 py-2 font-medium">
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map((symbol) => (
            <tr key={symbol.ticker} className="border-b border-stone-100 last:border-0">
              <td className="px-4 py-2">
                <Link to={`/charts/${symbol.ticker}`} className="font-medium underline-offset-2 hover:underline">
                  {symbol.ticker}
                </Link>
                <span className="ml-2 text-stone-500">{symbol.name}</span>
              </td>
              {columns.map((column) => (
                <td key={column.name} className="px-4 py-2">
                  {cell(column, symbol.ticker)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {columns.some((column) => column.error) ? (
        <ul className="space-y-1 border-t border-stone-200 px-4 py-3 text-xs text-stone-500">
          {columns
            .filter((column) => column.error)
            .map((column) => (
              <li key={column.name}>
                {column.name}: {column.error}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  )
}

function cell(column: BoardColumnJson, ticker: string): string {
  const quote = column.brief?.quotes.find((item) => item.symbol.ticker === ticker)
  if (!quote) {
    return "—"
  }
  const change = quote.change_percent === null ? "" : ` ${quote.change_percent}%`
  return `${quote.price}${change}`
}
