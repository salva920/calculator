import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { BinanceAPI, type BinanceP2POrder } from '@/lib/binance'
import { getTodayHistoryApiBoundsCaracas } from '@/utils/caracas-date'

/** Evita golpear Binance en cada poll del dashboard (métricas cada ~5s). */
const CACHE_TTL_MS = 45_000

let cache: { at: number; data: BinanceTodayTotals } | null = null

export type BinanceTodayTotals = {
  todaySellAmount: number
  todaySellValue: number
  todayBuyAmount: number
  todayBuyValue: number
  todayPendingSellAmount: number
  todayPendingBuyAmount: number
  todayCommissions: number
  todayCompletedCount: number
  todayTransactionsCount: number
}

export function clearBinanceTodayCache() {
  cache = null
}

function isCompletedStatus(s: string) {
  return (s || '').toString().toUpperCase() === 'COMPLETED'
}

function isCancelledStatus(s: string) {
  return ['CANCELLED', 'CANCELLED_BY_SYSTEM'].includes((s || '').toString().toUpperCase())
}

function isInProgressStatus(s: string) {
  return ['TRADING', 'BUYER_PAYED', 'APPEALING', 'PARTIAL_COMPLETED'].includes((s || '').toString().toUpperCase())
}

function completionEventMs(o: BinanceP2POrder): number {
  const c = o.completionTimeMs
  if (c != null && Number.isFinite(c) && c > 0) return c
  return Number(o.createTime) || 0
}

/**
 * COMPLETED: suma si la hora de cierre cae en [dayStartMs, dayEndMs] del día Caracas.
 * Pendientes en curso: solo si createTime cae en ese mismo día Caracas.
 */
function foldOrders(orders: BinanceP2POrder[], dayStartMs: number, dayEndMs: number) {
  let completedUsdt = 0
  let completedFiat = 0
  let pendingUsdt = 0
  let commissionCompleted = 0
  let completedN = 0

  for (const o of orders) {
    const st = (o.orderStatus || '').toString().toUpperCase()
    if (isCancelledStatus(st)) continue

    const ct = Number(o.createTime)
    const amt = parseFloat(String(o.amount || '0')) || 0
    const fiat = parseFloat(String(o.fiatAmount || o.totalPrice || '0')) || 0
    const comm = parseFloat(String(o.commission || '0')) || 0

    if (isCompletedStatus(st)) {
      const eventMs = completionEventMs(o)
      if (!Number.isFinite(eventMs) || eventMs < dayStartMs || eventMs > dayEndMs) continue
      completedUsdt += amt
      completedFiat += fiat
      commissionCompleted += comm
      completedN += 1
    } else if (isInProgressStatus(st)) {
      if (!Number.isFinite(ct) || ct < dayStartMs || ct > dayEndMs) continue
      pendingUsdt += amt
    }
  }

  return {
    completedUsdt,
    completedFiat,
    pendingUsdt,
    commissionCompleted,
    completedN,
  }
}

/**
 * Totales del día (Caracas): historial C2C con ventana API ampliada hacia atrás;
 * ventas/compras COMPLETED contadas por hora de cierre en el día Caracas.
 */
export async function getTodayTotalsFromBinanceApi(force: boolean): Promise<BinanceTodayTotals | null> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data
  }

  const credentials = await prisma.binanceCredentials.findFirst({
    where: { isActive: true },
  })
  if (!credentials) {
    return null
  }

  try {
    const apiKey = decrypt(credentials.apiKey)
    const apiSecret = decrypt(credentials.apiSecret)
    const binance = new BinanceAPI(apiKey, apiSecret)

    const { dayStart, dayEnd, apiStartMs, apiEndMs } = getTodayHistoryApiBoundsCaracas()
    const dayStartMs = dayStart.getTime()
    const dayEndMs = Math.min(Date.now(), dayEnd.getTime())

    const [sellOrders, buyOrders] = await Promise.all([
      binance.getUserP2PHistory('SELL', apiStartMs, apiEndMs),
      binance.getUserP2PHistory('BUY', apiStartMs, apiEndMs),
    ])

    const sell = foldOrders(sellOrders, dayStartMs, dayEndMs)
    const buy = foldOrders(buyOrders, dayStartMs, dayEndMs)

    const completedTotal = sell.completedN + buy.completedN
    const data: BinanceTodayTotals = {
      todaySellAmount: sell.completedUsdt,
      todaySellValue: sell.completedFiat,
      todayBuyAmount: buy.completedUsdt,
      todayBuyValue: buy.completedFiat,
      todayPendingSellAmount: sell.pendingUsdt,
      todayPendingBuyAmount: buy.pendingUsdt,
      todayCommissions: sell.commissionCompleted + buy.commissionCompleted,
      todayCompletedCount: completedTotal,
      todayTransactionsCount: completedTotal,
    }

    cache = { at: Date.now(), data }
    return data
  } catch (e) {
    console.warn('[binance-today-from-api] No se pudieron obtener totales del día desde Binance:', e)
    return null
  }
}
