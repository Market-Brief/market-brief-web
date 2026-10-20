import { useEffect, useMemo, useRef, useState } from "react"
import type { CandleSeriesJson } from "../api/types"

type Bar = {
  session: string
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

type Tone = "up" | "down" | "doji"

type View = { start: number; count: number }

const COLOR: Record<Tone, string> = {
  up: "#15803d",
  down: "#b91c1c",
  doji: "#78716c",
}

const AXIS = 76
const PAD_LEFT = 12
const PAD_TOP = 12
const DATE_AXIS = 28
const MIN_BARS = 30

export function CandleChart({ series }: { series: CandleSeriesJson }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bars = useMemo(() => series.candles.map(toBar), [series])
  const [readout, setReadout] = useState<Bar | null>(bars.at(-1) ?? null)
  const [windowLabel, setWindowLabel] = useState("")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || bars.length === 0) {
      return
    }
    const view: View = initialView(bars)
    let hover: number | null = null
    let drag: { x: number; start: number } | null = null

    const paint = () => {
      draw(canvas, bars, view, hover, series.price_unit)
      const last = Math.min(bars.length, view.start + view.count) - 1
      setWindowLabel(`${formatDay(bars[view.start].session)} – ${formatDay(bars[last].session)}`)
    }
    const show = (index: number | null) => {
      hover = index
      setReadout(bars[index ?? Math.min(bars.length, view.start + view.count) - 1] ?? null)
      paint()
    }
    paint()
    show(null)

    const observer = new ResizeObserver(() => paint())
    observer.observe(canvas)

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId)
      drag = { x: event.clientX, start: view.start }
    }
    const onPointerMove = (event: PointerEvent) => {
      if (drag) {
        const slot = plotWidth(canvas) / view.count
        const delta = Math.round((drag.x - event.clientX) / slot)
        view.start = clamp(drag.start + delta, 0, bars.length - view.count)
      }
      show(indexAt(canvas, view, event.clientX))
    }
    const onPointerUp = (event: PointerEvent) => {
      drag = null
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const ratio = clamp((event.clientX - canvas.getBoundingClientRect().left - PAD_LEFT) / plotWidth(canvas), 0, 1)
      const anchor = view.start + ratio * view.count
      const nextCount = clamp(Math.round(view.count * (event.deltaY > 0 ? 1.15 : 0.87)), Math.min(MIN_BARS, bars.length), bars.length)
      view.count = nextCount
      view.start = clamp(Math.round(anchor - ratio * nextCount), 0, bars.length - nextCount)
      show(indexAt(canvas, view, event.clientX))
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return
      }
      event.preventDefault()
      const step = event.key === "ArrowLeft" ? -10 : 10
      view.start = clamp(view.start + step, 0, bars.length - view.count)
      show(null)
    }

    const onLeave = () => show(null)
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointerleave", onLeave)
    canvas.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("keydown", onKey)
    return () => {
      observer.disconnect()
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("pointerleave", onLeave)
      canvas.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
    }
  }, [bars, series.price_unit])

  const tone = readout ? candleTone(readout.open, readout.close) : "doji"

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3 text-sm">
        <p className="text-stone-700">
          {readout ? (
            <>
              <span className="font-medium text-stone-900">{formatDay(readout.session)}</span>
              <span className="ml-3">Mở {formatPrice(readout.open, series.price_unit)}</span>
              <span className="ml-3">Cao {formatPrice(readout.high, series.price_unit)}</span>
              <span className="ml-3">Thấp {formatPrice(readout.low, series.price_unit)}</span>
              <span className="ml-3" style={{ color: COLOR[tone] }}>
                Đóng {formatPrice(readout.close, series.price_unit)}
              </span>
              <span className="ml-3 text-stone-500">KL {formatVolume(readout.volume)}</span>
            </>
          ) : (
            "Chưa có nến"
          )}
        </p>
        <p className="text-stone-500">{windowLabel}</p>
      </div>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label={`Biểu đồ nến ngày ${series.ticker}`}
        className="h-[520px] w-full touch-none rounded-lg border border-stone-200 bg-white outline-none focus:border-stone-400"
      />
      <ul className="flex flex-wrap gap-4 text-xs text-stone-500">
        <li><Swatch tone="up" /> Đóng cửa cao hơn mở cửa</li>
        <li><Swatch tone="down" /> Đóng cửa thấp hơn mở cửa</li>
        <li><Swatch tone="doji" /> Đóng cửa bằng mở cửa</li>
        <li>Cột khối lượng cùng màu với thân nến</li>
      </ul>
    </div>
  )
}

function Swatch({ tone }: { tone: Tone }) {
  return <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: COLOR[tone] }} />
}

function toBar(row: CandleSeriesJson["candles"][number]): Bar {
  return {
    session: row.session_date,
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: row.volume,
  }
}

function initialView(bars: Bar[]): View {
  const last = bars[bars.length - 1].session
  const cutoff = shiftYear(last, -1)
  const start = Math.max(0, bars.findIndex((bar) => bar.session >= cutoff))
  const count = Math.max(1, bars.length - start)
  return { start, count }
}

function shiftYear(iso: string, years: number): string {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year + years, month - 1, day)).toISOString().slice(0, 10)
}

function plotWidth(canvas: HTMLCanvasElement): number {
  return Math.max(1, canvas.clientWidth - PAD_LEFT - AXIS)
}

function indexAt(canvas: HTMLCanvasElement, view: View, clientX: number): number | null {
  const x = clientX - canvas.getBoundingClientRect().left - PAD_LEFT
  if (x < 0 || x > plotWidth(canvas)) {
    return null
  }
  return clamp(view.start + Math.floor((x / plotWidth(canvas)) * view.count), view.start, view.start + view.count - 1)
}

function draw(canvas: HTMLCanvasElement, bars: Bar[], view: View, hover: number | null, unit: "vnd" | "point") {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.floor(width * ratio)
  canvas.height = Math.floor(height * ratio)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  const visible = bars.slice(view.start, view.start + view.count)
  if (visible.length === 0) {
    return
  }
  const priceTop = PAD_TOP
  const priceHeight = Math.max(40, (height - PAD_TOP - DATE_AXIS) * 0.74)
  const volumeTop = priceTop + priceHeight + 16
  const volumeHeight = Math.max(24, height - DATE_AXIS - volumeTop - 8)
  const innerWidth = plotWidth(canvas)
  let low = Infinity
  let high = -Infinity
  let maxVolume = 0
  for (const bar of visible) {
    low = Math.min(low, bar.low)
    high = Math.max(high, bar.high)
    maxVolume = Math.max(maxVolume, bar.volume ?? 0)
  }
  const pad = high === low ? Math.max(high * 0.02, 1) : (high - low) * 0.08
  const priceMax = high + pad
  const priceMin = Math.max(0, low - pad)
  const slot = innerWidth / visible.length
  const yPrice = (price: number) => priceTop + ((priceMax - price) / (priceMax - priceMin)) * priceHeight

  ctx.strokeStyle = "#e7e5e4"
  ctx.lineWidth = 1
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif"
  ctx.fillStyle = "#78716c"
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  for (let tick = 0; tick < 4; tick += 1) {
    const price = priceMax - ((priceMax - priceMin) * tick) / 3
    const y = yPrice(price)
    ctx.beginPath()
    ctx.moveTo(PAD_LEFT, y)
    ctx.lineTo(PAD_LEFT + innerWidth, y)
    ctx.stroke()
    ctx.fillText(formatPrice(price, unit), PAD_LEFT + innerWidth + 8, y)
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(PAD_LEFT, priceTop, innerWidth, priceHeight)
  ctx.clip()
  visible.forEach((bar, offset) => {
    const x = PAD_LEFT + (offset + 0.5) * slot
    const tone = candleTone(bar.open, bar.close)
    ctx.strokeStyle = COLOR[tone]
    ctx.fillStyle = COLOR[tone]
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, yPrice(bar.high))
    ctx.lineTo(x, yPrice(bar.low))
    ctx.stroke()
    const bodyTop = yPrice(Math.max(bar.open, bar.close))
    const bodyBottom = yPrice(Math.min(bar.open, bar.close))
    const bodyWidth = Math.max(1, slot * 0.62)
    const bodyHeight = Math.max(1, bodyBottom - bodyTop)
    ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight)
  })
  ctx.restore()

  visible.forEach((bar, offset) => {
    const x = PAD_LEFT + (offset + 0.5) * slot
    const bodyWidth = Math.max(1, slot * 0.62)
    const barHeight = maxVolume === 0 ? 0 : ((bar.volume ?? 0) / maxVolume) * volumeHeight
    ctx.fillStyle = COLOR[candleTone(bar.open, bar.close)]
    ctx.globalAlpha = 0.85
    ctx.fillRect(x - bodyWidth / 2, volumeTop + volumeHeight - barHeight, bodyWidth, barHeight)
    ctx.globalAlpha = 1
  })

  ctx.fillStyle = "#78716c"
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  const labelEvery = Math.max(1, Math.ceil(visible.length / Math.max(1, Math.floor(innerWidth / 88))))
  visible.forEach((bar, offset) => {
    if (offset % labelEvery !== 0 && offset !== visible.length - 1) {
      return
    }
    ctx.fillText(formatDay(bar.session), PAD_LEFT + (offset + 0.5) * slot, height - DATE_AXIS + 8)
  })

  if (hover !== null && hover >= view.start && hover < view.start + view.count) {
    const x = PAD_LEFT + (hover - view.start + 0.5) * slot
    ctx.strokeStyle = "#a8a29e"
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(x, priceTop)
    ctx.lineTo(x, volumeTop + volumeHeight)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function candleTone(open: number, close: number): Tone {
  if (close > open) {
    return "up"
  }
  if (close < open) {
    return "down"
  }
  return "doji"
}

function formatPrice(value: number, unit: "vnd" | "point"): string {
  if (unit === "point") {
    return value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return Math.round(value).toLocaleString("vi-VN")
}

function formatVolume(volume: number | null): string {
  if (volume === null) {
    return "—"
  }
  return volume.toLocaleString("vi-VN")
}

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
