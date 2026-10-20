/** JSON shape aligned with the Python Board model. Field names stay snake_case. */

export type QuoteJson = {
  symbol: {
    ticker: string
    name: string
    exchange: string
    asset: "equity" | "index"
    price_unit: "vnd" | "point"
  }
  price: string
  change_percent: string | null
  volume: number | null
  as_of: string
  source: string
}

export type BoardColumnJson = {
  name: string
  error: string | null
  brief: {
    generated_at: string
    quotes: QuoteJson[]
    source: string
    disclaimer: string
    language: string
  } | null
}

export type BoardJson = {
  generated_at: string
  language: string
  columns: BoardColumnJson[]
}

export type DashboardSymbolJson = {
  ticker: string
  name: string
}

export type DashboardJson = {
  display_name: string
  language: string
  symbols: DashboardSymbolJson[]
  board: BoardJson
}

export type CandleBarJson = {
  session_date: string
  open: string
  high: string
  low: string
  close: string
  volume: number | null
}

export type CandleSeriesJson = {
  ticker: string
  name: string
  exchange: string
  asset: "equity" | "index"
  price_unit: "vnd" | "point"
  source: string
  resolution: string
  candles: CandleBarJson[]
}

export type SlackCommandJson = {
  command: string
  description: string
  usage: string
}

export type SlackConnectionInput = {
  channel: string
  bot_token: string | null
  app_token: string | null
}

export type SlackIntegrationJson = {
  name: string
  app_name: string
  bot_name: string
  transport: string
  channel: string | null
  bot_token_configured: boolean
  app_token_configured: boolean
  ready: boolean
  commands: SlackCommandJson[]
}
