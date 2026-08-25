import { prisma } from '@/lib/prisma'
import {
  isCancelledStatus,
  isCompletedStatus,
  isInProgressStatus,
} from '@/lib/binance-transaction-status'
import { processAndSaveCycles } from '@/utils/cycle-processor'
import {
  buildTransactionWindowWhere,
  formatDateYmdCaracas,
  getTodayBoundsCaracas,
  isCompletedInWindow,
} from '@/utils/caracas-date'
import {
  isPagoMovilMethod,
  PAGO_MOVIL_FEE_PERCENT,
} from '@/lib/payment-commissions'
import type { DashboardMetrics } from '@/types/metrics'

const MIN_CYCLE_USDT = 0.01
const ALL_FILTER_MAX_MONTHS = 6
const prismaAny = prisma as any

type ManualAdjustmentRecord = {
  id: string
  type: 'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT'
  usdtAmount: number
  note: string | null
  createdAt: Date
}

type TxSlice = {
  id: string
  tradeType: string
  orderStatus: string
  amount: number
  fiatAmount: number
  commission: number
  unitPrice: number
  bankCommission: number
  paymentMethod?: string | null
  createTime: Date
  completedAt: Date | null
  binanceOrderId: string
}

function getStartDateForFilter(dateFilter: string): Date {
  const now = new Date()
  switch (dateFilter) {
    case 'week': {
      const d = new Date(now)
      d.setDate(now.getDate() - 7)
      return d
    }
    case 'month': {
      const d = new Date(now)
      d.setMonth(now.getMonth() - 1)
      return d
    }
    case 'threeMonths': {
      const d = new Date(now)
      d.setMonth(now.getMonth() - 3)
      return d
    }
    case 'all':
    default: {
      const d = new Date(now)
      d.setMonth(now.getMonth() - ALL_FILTER_MAX_MONTHS)
      return d
    }
  }
}

function pickRecentCompleted(
  todayItems: TxSlice[],
  periodItems: TxSlice[],
  limit = 5
): TxSlice[] {
  const sortedToday = [...todayItems].sort(
    (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
  )
  if (sortedToday.length >= limit) return sortedToday.slice(0, limit)
  if (sortedToday.length === 0) return periodItems.slice(0, limit)

  const combined = [...sortedToday, ...periodItems].filter(
    (tx, index, self) => index === self.findIndex((t) => t.binanceOrderId === tx.binanceOrderId)
  )
  return combined
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .slice(0, limit)
}

function avgCommissionPercent(items: TxSlice[], field: 'commission' | 'bankCommission'): number {
  if (items.length === 0) return 0
  return (
    items.reduce((sum, tx) => {
      const value = field === 'commission' ? tx.commission : tx.bankCommission
      return sum + (tx.fiatAmount > 0 ? (value / tx.fiatAmount) * 100 : 0)
    }, 0) / items.length
  )
}

async function runInBatches(
  tasks: Array<() => Promise<unknown>>,
  batchSize = 4
): Promise<unknown[]> {
  const results: unknown[] = []
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((task) => task()))
    results.push(...batchResults)
  }
  return results
}

export async function computeDashboardMetrics(
  dateFilter: string,
  shouldProcessCycles: boolean
): Promise<DashboardMetrics> {
  const startDate = getStartDateForFilter(dateFilter)
  const periodWhere = { createTime: { gte: startDate } }
  const { start: today, end: todayEnd } = getTodayBoundsCaracas()
  const now = new Date()

  if (shouldProcessCycles) {
    const cycleWindowStart = new Date(now)
    cycleWindowStart.setMonth(cycleWindowStart.getMonth() - 6)
    processAndSaveCycles(cycleWindowStart, today, todayEnd).catch((err) =>
      console.error('Error procesando ciclos en background:', err)
    )
  }

  const completedWhere = { ...periodWhere, orderStatus: 'COMPLETED' }
  const pendingWhere = {
    ...periodWhere,
    orderStatus: { in: ['TRADING', 'BUYER_PAYED', 'APPEALING', 'PARTIAL_COMPLETED'] },
  }

  const batchResults = await runInBatches([
    () =>
      prisma.binanceP2PTransaction.aggregate({
        where: { ...completedWhere, tradeType: 'BUY' },
        _sum: { amount: true, fiatAmount: true, commission: true },
        _count: true,
      }),
    () =>
      prisma.binanceP2PTransaction.aggregate({
        where: { ...completedWhere, tradeType: 'SELL' },
        _sum: { amount: true, fiatAmount: true, commission: true },
        _count: true,
      }),
    () =>
      prisma.binanceP2PTransaction.aggregate({
        where: { ...pendingWhere, tradeType: 'BUY' },
        _sum: { amount: true },
      }),
    () =>
      prisma.binanceP2PTransaction.aggregate({
        where: { ...pendingWhere, tradeType: 'SELL' },
        _sum: { amount: true },
      }),
    () => prisma.binanceP2PTransaction.count({ where: periodWhere }),
    () => prisma.binanceP2PTransaction.count({ where: completedWhere }),
    () =>
      prisma.binanceP2PTransaction.findMany({
        where: { ...completedWhere, tradeType: 'BUY' },
        orderBy: { createTime: 'desc' },
        take: 5,
        select: {
          id: true,
          tradeType: true,
          orderStatus: true,
          amount: true,
          fiatAmount: true,
          commission: true,
          unitPrice: true,
          bankCommission: true,
          paymentMethod: true,
          createTime: true,
          completedAt: true,
          binanceOrderId: true,
        },
      }),
    () =>
      prisma.binanceP2PTransaction.findMany({
        where: { ...completedWhere, tradeType: 'SELL' },
        orderBy: { createTime: 'desc' },
        take: 5,
        select: {
          id: true,
          tradeType: true,
          orderStatus: true,
          amount: true,
          fiatAmount: true,
          commission: true,
          unitPrice: true,
          bankCommission: true,
          paymentMethod: true,
          createTime: true,
          completedAt: true,
          binanceOrderId: true,
        },
      }),
    () =>
      prisma.binanceP2PTransaction.findMany({
        where: buildTransactionWindowWhere(today, todayEnd),
        select: {
          id: true,
          tradeType: true,
          orderStatus: true,
          amount: true,
          fiatAmount: true,
          commission: true,
          unitPrice: true,
          bankCommission: true,
          paymentMethod: true,
          createTime: true,
          completedAt: true,
          binanceOrderId: true,
        },
      }),
    () =>
      prisma.binanceP2PTransaction.findMany({
        where: { orderStatus: 'COMPLETED', createTime: { gte: startDate } },
        select: {
          tradeType: true,
          amount: true,
          fiatAmount: true,
          commission: true,
          paymentMethod: true,
          createTime: true,
        },
        orderBy: { createTime: 'asc' },
      }),
    () =>
      prismaAny.manualBalanceAdjustment.findMany({
        select: { id: true, type: true, usdtAmount: true, note: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }) as Promise<ManualAdjustmentRecord[]>,
    () => prisma.p2PCycle.count(),
    () => prisma.p2PCycle.aggregate({ _sum: { netProfit: true } }),
    () =>
      prisma.p2PCycle.findFirst({
        orderBy: { completedAt: 'desc' },
        select: { netProfit: true },
      }),
    () =>
      prisma.p2PCycle.findMany({
        where: { date: { gte: today, lte: todayEnd } },
        select: {
          date: true,
          usdtAmount: true,
          sellUsdtAmount: true,
          buyUsdtAmount: true,
          sellFiatAmount: true,
          completedAt: true,
          netProfit: true,
        },
      }),
  ])

  const buyAgg = batchResults[0] as {
    _sum: { amount: number | null; fiatAmount: number | null; commission: number | null }
    _count: number
  }
  const sellAgg = batchResults[1] as {
    _sum: { amount: number | null; fiatAmount: number | null; commission: number | null }
    _count: number
  }
  const pendingBuyAgg = batchResults[2] as { _sum: { amount: number | null } }
  const pendingSellAgg = batchResults[3] as { _sum: { amount: number | null } }
  const totalTransactions = batchResults[4] as number
  const completedTransactions = batchResults[5] as number
  const recentPeriodBuys = batchResults[6] as TxSlice[]
  const recentPeriodSells = batchResults[7] as TxSlice[]
  const todayTransactions = batchResults[8] as TxSlice[]
  const completedForCarry = batchResults[9] as Array<{
    tradeType: string
    amount: number
    fiatAmount: number
    commission: number
    paymentMethod: string | null
    createTime: Date
  }>
  const manualAdjustments = batchResults[10] as ManualAdjustmentRecord[]
  const totalCompletedCycles = batchResults[11] as number
  const closedCyclesProfitAgg = batchResults[12] as { _sum: { netProfit: number | null } }
  const lastClosedCycle = batchResults[13] as { netProfit: number | null } | null
  const todayCyclesRaw = batchResults[14] as Array<{
    date: Date
    usdtAmount: number
    sellUsdtAmount: number
    buyUsdtAmount: number
    sellFiatAmount: number
    completedAt: Date
    netProfit: number | null
  }>

  const totalBuyAmount = buyAgg._sum.amount ?? 0
  const totalSellAmount = sellAgg._sum.amount ?? 0
  const totalBuyValue = buyAgg._sum.fiatAmount ?? 0
  const totalSellValue = sellAgg._sum.fiatAmount ?? 0
  const pendingBuyAmount = pendingBuyAgg._sum.amount ?? 0
  const pendingSellAmount = pendingSellAgg._sum.amount ?? 0

  const todayTx = todayTransactions
  const todayCompletedBuys = todayTx.filter(
    (tx) => tx.tradeType === 'BUY' && isCompletedInWindow(tx, today, todayEnd)
  )
  const todayCompletedSells = todayTx.filter(
    (tx) => tx.tradeType === 'SELL' && isCompletedInWindow(tx, today, todayEnd)
  )
  const todayByCreateTime = todayTx.filter((tx) => {
    const t = new Date(tx.createTime).getTime()
    return t >= today.getTime() && t <= todayEnd.getTime()
  })
  const todayPendingBuys = todayByCreateTime.filter(
    (tx) =>
      tx.tradeType === 'BUY' &&
      !isCompletedStatus(tx.orderStatus) &&
      !isCancelledStatus(tx.orderStatus) &&
      isInProgressStatus(tx.orderStatus)
  )
  const todayPendingSells = todayByCreateTime.filter(
    (tx) =>
      tx.tradeType === 'SELL' &&
      !isCompletedStatus(tx.orderStatus) &&
      !isCancelledStatus(tx.orderStatus) &&
      isInProgressStatus(tx.orderStatus)
  )

  const todayTxIds = new Set<string>()
  for (const tx of [...todayCompletedBuys, ...todayCompletedSells, ...todayPendingBuys, ...todayPendingSells]) {
    todayTxIds.add(tx.id)
  }

  const todayBuyAmount = todayCompletedBuys.reduce((s, tx) => s + tx.amount, 0)
  const todaySellAmount = todayCompletedSells.reduce((s, tx) => s + tx.amount, 0)
  const todayBuyValue = todayCompletedBuys.reduce((s, tx) => s + tx.fiatAmount, 0)
  const todaySellValue = todayCompletedSells.reduce((s, tx) => s + tx.fiatAmount, 0)
  const todayPendingBuyAmount = todayPendingBuys.reduce((s, tx) => s + tx.amount, 0)
  const todayPendingSellAmount = todayPendingSells.reduce((s, tx) => s + tx.amount, 0)
  const todayCompletedCount = todayCompletedBuys.length + todayCompletedSells.length

  const averageBuyPrice = totalBuyAmount > 0 ? totalBuyValue / totalBuyAmount : 0
  const averageSellPrice = totalSellAmount > 0 ? totalSellValue / totalSellAmount : 0

  const totalCommissions = (buyAgg._sum.commission ?? 0) + (sellAgg._sum.commission ?? 0)
  const grossProfit = totalSellValue - totalBuyValue
  const netProfit = grossProfit - totalCommissions

  const todayCommissions = [...todayCompletedBuys, ...todayCompletedSells].reduce(
    (s, tx) => s + tx.commission,
    0
  )
  const totalProfitToday = todaySellValue - todayBuyValue - todayCommissions

  const roi =
    averageBuyPrice > 0 && averageSellPrice > 0
      ? ((averageSellPrice - averageBuyPrice) / averageBuyPrice) * 100
      : 0
  const profitMargin = totalSellValue > 0 ? (netProfit / totalSellValue) * 100 : 0

  const recentBuys = pickRecentCompleted(todayCompletedBuys, recentPeriodBuys)
  const recentSells = pickRecentCompleted(todayCompletedSells, recentPeriodSells)

  const latestBuyPrice = recentBuys[0]?.unitPrice ?? averageBuyPrice
  const latestSellPrice = recentSells[0]?.unitPrice ?? averageSellPrice

  let buyPriceTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (recentBuys.length >= 2) {
    const oldestPrice = recentBuys[recentBuys.length - 1].unitPrice
    const newestPrice = recentBuys[0].unitPrice
    const changePercent = ((newestPrice - oldestPrice) / oldestPrice) * 100
    if (changePercent > 0.5) buyPriceTrend = 'increasing'
    else if (changePercent < -0.5) buyPriceTrend = 'decreasing'
  }

  const currentGap =
    latestSellPrice > 0 && latestBuyPrice > 0 ? latestSellPrice - latestBuyPrice : 0
  const currentGapPercent = latestBuyPrice > 0 ? (currentGap / latestBuyPrice) * 100 : 0

  const avgBinanceCommissionPercent =
    buyAgg._count > 0 ? avgCommissionPercent(recentPeriodBuys, 'commission') : 0.1

  const recentBuyCommissions =
    recentBuys.length > 0
      ? avgCommissionPercent(recentBuys, 'commission')
      : avgBinanceCommissionPercent

  const estimatedProfitPerUsdt =
    currentGap > 0 && latestBuyPrice > 0
      ? Math.max(
          0,
          currentGap -
            latestBuyPrice * (recentBuyCommissions / 100) -
            (latestBuyPrice + latestSellPrice) * (PAGO_MOVIL_FEE_PERCENT / 100)
        )
      : 0
  const estimatedROI =
    latestBuyPrice > 0 && estimatedProfitPerUsdt > 0
      ? (estimatedProfitPerUsdt / latestBuyPrice) * 100
      : 0
  const isGapTooSmall = currentGapPercent < 1

  // Estimación operativa del DÍA (mismo criterio que el análisis manual):
  // matched = min(compras, ventas) del día; spread = tasa media venta − compra; − fees PM 0,30% y Binance
  const todayAvgBuyPrice = todayBuyAmount > 0 ? todayBuyValue / todayBuyAmount : 0
  const todayAvgSellPrice = todaySellAmount > 0 ? todaySellValue / todaySellAmount : 0
  const todayMatchedUsdt =
    todayBuyAmount > 0 && todaySellAmount > 0 ? Math.min(todayBuyAmount, todaySellAmount) : 0
  const todaySpread =
    todayAvgBuyPrice > 0 && todayAvgSellPrice > 0 ? todayAvgSellPrice - todayAvgBuyPrice : 0
  const todayEstimatedGrossBs = todayMatchedUsdt > 0 ? todayMatchedUsdt * todaySpread : 0

  const todayPmBuyFiat = todayCompletedBuys
    .filter((tx) => isPagoMovilMethod(tx.paymentMethod))
    .reduce((s, tx) => s + tx.fiatAmount, 0)
  const todayPmSellFiat = todayCompletedSells
    .filter((tx) => isPagoMovilMethod(tx.paymentMethod))
    .reduce((s, tx) => s + tx.fiatAmount, 0)
  const todayPagoMovilFeeBs =
    todayPmBuyFiat * (PAGO_MOVIL_FEE_PERCENT / 100) +
    todayPmSellFiat * (PAGO_MOVIL_FEE_PERCENT / 100)
  const todayBinanceFeeBs = todayCommissions
  const todayEstimatedNetBs = todayEstimatedGrossBs - todayPagoMovilFeeBs - todayBinanceFeeBs
  const todayEstimatedNetUsdt =
    todayAvgBuyPrice > 0 ? todayEstimatedNetBs / todayAvgBuyPrice : 0
  const todayEstimatedNetPerUsdt =
    todayMatchedUsdt > 0 ? todayEstimatedNetBs / todayMatchedUsdt : 0

  const todayYmd = formatDateYmdCaracas(today)
  const todayCycles = [...todayCyclesRaw]
    .filter((c) => formatDateYmdCaracas(new Date(c.date)) === todayYmd)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

  let cumulative = 0
  const todayCyclesSummary = {
    cycles: todayCycles.map((c, i) => {
      const net = c.netProfit ?? 0
      cumulative += net
      return {
        cycleNumber: i + 1,
        sellUsdtAmount: c.sellUsdtAmount ?? c.usdtAmount,
        buyUsdtAmount: c.buyUsdtAmount ?? c.usdtAmount,
        netProfit: net,
        cumulativeProfit: cumulative,
      }
    }),
    totalProfitFromCycles: cumulative,
  }

  type CarryEvent = {
    tradeType: 'BUY' | 'SELL'
    amount: number
    fiatAmount: number
    commission: number
    paymentMethod: string | null
    createTime: Date
  }
  const carryEvents: CarryEvent[] = [
    ...completedForCarry.map((tx) => ({
      tradeType: tx.tradeType as 'BUY' | 'SELL',
      amount: tx.amount,
      fiatAmount: tx.fiatAmount,
      commission: tx.commission,
      paymentMethod: tx.paymentMethod,
      createTime: new Date(tx.createTime),
    })),
    ...manualAdjustments.map((adj) => ({
      tradeType: (adj.type === 'SELL_EXTERNAL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
      amount: adj.usdtAmount,
      fiatAmount: 0,
      commission: 0,
      paymentMethod: null as string | null,
      createTime: adj.createdAt,
    })),
  ].sort((a, b) => a.createTime.getTime() - b.createTime.getTime())

  // Carry global (desbalance acumulado) — igual que antes
  let pendingSell = 0
  let pendingBuy = 0
  for (const event of carryEvents) {
    if (event.tradeType === 'SELL') pendingSell += event.amount
    else pendingBuy += event.amount
    while (pendingSell >= MIN_CYCLE_USDT && pendingBuy >= MIN_CYCLE_USDT) {
      const subtract = Math.min(pendingSell, pendingBuy)
      pendingSell -= subtract
      pendingBuy -= subtract
    }
  }

  /**
   * Ciclo en vivo = ola reciente (venta→recompra), NO todo el historial.
   * Ventana 3 días + soft-close + tope 15k + hueco 10h entre ventas.
   */
  const LIVE_CYCLE_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000
  const LIVE_CYCLE_SELL_GAP_MS = 10 * 60 * 60 * 1000
  const LIVE_CYCLE_SOFT_CLOSE_RATIO = 0.05
  const LIVE_CYCLE_MAX_WAVE_USDT = 15_000

  const liveCutoffMs = Date.now() - LIVE_CYCLE_LOOKBACK_MS
  const liveCarryEvents = carryEvents.filter(
    (e) => e.createTime.getTime() >= liveCutoffMs
  )

  type WaveLot = {
    amount: number
    fiatAmount: number
    commission: number
    paymentMethod: string | null
  }

  let sellLots: WaveLot[] = []
  let buyLots: WaveLot[] = []
  let waveEvents: CarryEvent[] = []
  let lastClosedWaveEvents: CarryEvent[] | null = null
  let lastSellAtMs = 0

  const lotSum = (lots: WaveLot[]) => lots.reduce((s, l) => s + l.amount, 0)

  const matchWaveLots = () => {
    while (sellLots.length > 0 && buyLots.length > 0) {
      const sLot = sellLots[0]
      const bLot = buyLots[0]
      const take = Math.min(sLot.amount, bLot.amount)
      if (take <= 0) break
      const sFiatTake = sLot.amount > 0 ? (sLot.fiatAmount * take) / sLot.amount : 0
      const bFiatTake = bLot.amount > 0 ? (bLot.fiatAmount * take) / bLot.amount : 0
      const sFeeTake = sLot.amount > 0 ? (sLot.commission * take) / sLot.amount : 0
      const bFeeTake = bLot.amount > 0 ? (bLot.commission * take) / bLot.amount : 0
      sLot.amount -= take
      sLot.fiatAmount -= sFiatTake
      sLot.commission -= sFeeTake
      bLot.amount -= take
      bLot.fiatAmount -= bFiatTake
      bLot.commission -= bFeeTake
      if (sLot.amount < MIN_CYCLE_USDT) sellLots.shift()
      if (bLot.amount < MIN_CYCLE_USDT) buyLots.shift()
    }
  }

  const waveSoldBought = (events: CarryEvent[]) => {
    let sold = 0
    let bought = 0
    for (const e of events) {
      if (e.tradeType === 'SELL') sold += e.amount
      else bought += e.amount
    }
    return { sold, bought }
  }

  const residualFromSellLots = (): CarryEvent[] =>
    sellLots
      .filter((l) => l.amount >= MIN_CYCLE_USDT)
      .map((l) => ({
        tradeType: 'SELL' as const,
        amount: l.amount,
        fiatAmount: l.fiatAmount,
        commission: l.commission,
        paymentMethod: l.paymentMethod,
        createTime: new Date(liveCutoffMs),
      }))

  /**
   * Soft-close solo si ya hubo recompra real (≥95%).
   * Nunca cerrar una ola solo-ventas (antes el umbral 200 USDT borraba compras al reiniciar).
   */
  const shouldSoftCloseWave = (events: CarryEvent[]) => {
    const { sold, bought } = waveSoldBought(events)
    if (sold < MIN_CYCLE_USDT || bought < MIN_CYCLE_USDT) return false
    const remaining = sold - bought
    const progress = bought / sold
    // Cierre total
    if (remaining <= MIN_CYCLE_USDT && lotSum(sellLots) < MIN_CYCLE_USDT) return true
    if (lotSum(buyLots) >= MIN_CYCLE_USDT) return false
    // Casi cerrado
    if (progress >= 0.95) {
      const threshold = Math.max(50, sold * LIVE_CYCLE_SOFT_CLOSE_RATIO)
      return remaining <= threshold
    }
    // Ola demasiado grande y ya recompramos al menos la mitad → partir
    if (sold > LIVE_CYCLE_MAX_WAVE_USDT && progress >= 0.5) return true
    return false
  }

  const beginNewWaveWithResidualAndSell = (sellEvent: CarryEvent) => {
    const { sold } = waveSoldBought(waveEvents)
    if (
      sold >= MIN_CYCLE_USDT &&
      sold <= LIVE_CYCLE_MAX_WAVE_USDT * 1.2
    ) {
      lastClosedWaveEvents = waveEvents
    }
    const residual = residualFromSellLots()
    waveEvents = [...residual, sellEvent]
    // sellLots ya tiene el remanente; se agrega el nuevo sell después
    buyLots = []
  }

  for (const event of liveCarryEvents) {
    if (event.tradeType === 'SELL') {
      const { sold, bought } = waveSoldBought(waveEvents)
      const gapOk =
        lastSellAtMs > 0 &&
        event.createTime.getTime() - lastSellAtMs >= LIVE_CYCLE_SELL_GAP_MS
      const hadBuys = bought >= MIN_CYCLE_USDT
      const fullyClosedLots =
        lotSum(sellLots) < MIN_CYCLE_USDT && lotSum(buyLots) < MIN_CYCLE_USDT
      const nearlyDone =
        sold >= MIN_CYCLE_USDT && hadBuys && bought / sold >= 0.95

      if (
        waveEvents.length > 0 &&
        (fullyClosedLots || (gapOk && hadBuys) || (nearlyDone && gapOk) || sold >= LIVE_CYCLE_MAX_WAVE_USDT)
      ) {
        beginNewWaveWithResidualAndSell(event)
      } else if (waveEvents.length === 0) {
        waveEvents = [event]
      } else {
        waveEvents.push(event)
      }

      sellLots.push({
        amount: event.amount,
        fiatAmount: event.fiatAmount,
        commission: event.commission,
        paymentMethod: event.paymentMethod,
      })
      lastSellAtMs = event.createTime.getTime()
      matchWaveLots()
    } else {
      if (waveEvents.length === 0 && lotSum(sellLots) < MIN_CYCLE_USDT) {
        continue
      }
      if (waveEvents.length === 0) {
        // Remanente en lots sin wave (no debería pasar) → reconstruir
        waveEvents = residualFromSellLots()
      }
      waveEvents.push(event)
      buyLots.push({
        amount: event.amount,
        fiatAmount: event.fiatAmount,
        commission: event.commission,
        paymentMethod: event.paymentMethod,
      })
      matchWaveLots()
    }

    if (waveEvents.length > 0 && shouldSoftCloseWave(waveEvents)) {
      const { sold, bought } = waveSoldBought(waveEvents)
      if (sold <= LIVE_CYCLE_MAX_WAVE_USDT * 1.2) {
        lastClosedWaveEvents = waveEvents
      }
      // Cierre total → limpiar. Si queda remanente, SE MANTIENE la ola completa
      // (con ventas+compras) para que el panel siga mostrando matched/ganancia.
      if (lotSum(sellLots) < MIN_CYCLE_USDT && bought + MIN_CYCLE_USDT >= sold) {
        waveEvents = []
        sellLots = []
        buyLots = []
      }
    }
  }

  const cycleEventsForLive =
    waveEvents.length > 0 ? waveEvents : lastClosedWaveEvents ?? []

  // Análisis en vivo del ciclo abierto (mismo criterio que el análisis manual)
  let liveCycleActive = false
  let liveCycleSoldUsdt = 0
  let liveCycleBoughtUsdt = 0
  let liveCycleSellBs = 0
  let liveCycleBuyBs = 0
  let liveCycleAvgSellPrice = 0
  let liveCycleAvgBuyPrice = 0
  let liveCycleMatchedUsdt = 0
  let liveCycleSpread = 0
  let liveCycleGrossBs = 0
  let liveCyclePagoMovilFeeBs = 0
  let liveCycleBinanceFeeBs = 0
  let liveCycleNetBs = 0
  let liveCycleNetUsdt = 0
  let liveCycleAdFeeUsdt = 0
  let liveCycleNetUsdtAfterAd = 0
  let liveCycleProfitPercent = 0
  let liveCycleProgressPercent = 0
  let liveCycleRemainingToBuyUsdt = 0
  let liveCycleRemainingBuyBs = 0
  let liveCycleInventoryUsdt = 0
  let liveCycleCashDiffBs = 0

  if (cycleEventsForLive.length > 0) {
    const cycleSells = cycleEventsForLive.filter((e) => e.tradeType === 'SELL')
    const cycleBuys = cycleEventsForLive.filter((e) => e.tradeType === 'BUY')

    liveCycleSoldUsdt = cycleSells.reduce((s, e) => s + e.amount, 0)
    liveCycleBoughtUsdt = cycleBuys.reduce((s, e) => s + e.amount, 0)
    liveCycleSellBs = cycleSells.reduce((s, e) => s + e.fiatAmount, 0)
    liveCycleBuyBs = cycleBuys.reduce((s, e) => s + e.fiatAmount, 0)
    liveCycleAvgSellPrice =
      liveCycleSoldUsdt > 0 ? liveCycleSellBs / liveCycleSoldUsdt : 0
    liveCycleAvgBuyPrice =
      liveCycleBoughtUsdt > 0 ? liveCycleBuyBs / liveCycleBoughtUsdt : 0
    liveCycleMatchedUsdt =
      liveCycleSoldUsdt > 0 && liveCycleBoughtUsdt > 0
        ? Math.min(liveCycleSoldUsdt, liveCycleBoughtUsdt)
        : 0
    liveCycleSpread =
      liveCycleAvgSellPrice > 0 && liveCycleAvgBuyPrice > 0
        ? liveCycleAvgSellPrice - liveCycleAvgBuyPrice
        : 0
    liveCycleGrossBs =
      liveCycleMatchedUsdt > 0 ? liveCycleMatchedUsdt * liveCycleSpread : 0

    const pmSellFiat = cycleSells
      .filter((e) => isPagoMovilMethod(e.paymentMethod))
      .reduce((s, e) => s + e.fiatAmount, 0)
    const pmBuyFiat = cycleBuys
      .filter((e) => isPagoMovilMethod(e.paymentMethod))
      .reduce((s, e) => s + e.fiatAmount, 0)
    const feePmSell = pmSellFiat * (PAGO_MOVIL_FEE_PERCENT / 100)
    const feePmBuy = pmBuyFiat * (PAGO_MOVIL_FEE_PERCENT / 100)
    const feeBinSell = cycleSells.reduce((s, e) => s + e.commission, 0)
    const feeBinBuy = cycleBuys.reduce((s, e) => s + e.commission, 0)

    const sellRatio =
      liveCycleSoldUsdt > 0 ? liveCycleMatchedUsdt / liveCycleSoldUsdt : 0
    const buyRatio =
      liveCycleBoughtUsdt > 0 ? liveCycleMatchedUsdt / liveCycleBoughtUsdt : 0
    liveCyclePagoMovilFeeBs = feePmSell * sellRatio + feePmBuy * buyRatio
    liveCycleBinanceFeeBs = feeBinSell * sellRatio + feeBinBuy * buyRatio
    liveCycleNetBs =
      liveCycleGrossBs - liveCyclePagoMovilFeeBs - liveCycleBinanceFeeBs
    liveCycleNetUsdt =
      liveCycleAvgBuyPrice > 0 ? liveCycleNetBs / liveCycleAvgBuyPrice : 0
    liveCycleAdFeeUsdt = liveCycleBoughtUsdt * 0.2 / 1000
    liveCycleNetUsdtAfterAd = liveCycleNetUsdt - liveCycleAdFeeUsdt
    const matchedCostBs = liveCycleMatchedUsdt * liveCycleAvgBuyPrice
    liveCycleProfitPercent =
      matchedCostBs > 0 ? (liveCycleNetBs / matchedCostBs) * 100 : 0
    liveCycleInventoryUsdt = liveCycleBoughtUsdt - liveCycleSoldUsdt
    liveCycleCashDiffBs = liveCycleSellBs - liveCycleBuyBs
    liveCycleRemainingToBuyUsdt = Math.max(0, liveCycleSoldUsdt - liveCycleBoughtUsdt)
    liveCycleRemainingBuyBs =
      liveCycleAvgBuyPrice > 0
        ? liveCycleRemainingToBuyUsdt * liveCycleAvgBuyPrice
        : latestBuyPrice > 0
          ? liveCycleRemainingToBuyUsdt * latestBuyPrice
          : 0
    liveCycleProgressPercent =
      liveCycleSoldUsdt > 0
        ? Math.min((liveCycleBoughtUsdt / liveCycleSoldUsdt) * 100, 100)
        : liveCycleBoughtUsdt > 0
          ? 100
          : 0
    liveCycleActive =
      liveCycleSoldUsdt >= MIN_CYCLE_USDT || liveCycleBoughtUsdt >= MIN_CYCLE_USDT
  }

  const manualBuyEquivalent = manualAdjustments
    .filter((a) => a.type === 'BUY_EXTERNAL' || a.type === 'SETTLEMENT')
    .reduce((s, a) => s + a.usdtAmount, 0)
  const manualSellEquivalent = manualAdjustments
    .filter((a) => a.type === 'SELL_EXTERNAL')
    .reduce((s, a) => s + a.usdtAmount, 0)

  const adjustedTotalBuyAmount = totalBuyAmount + manualBuyEquivalent
  const adjustedTotalSellAmount = totalSellAmount + manualSellEquivalent
  const adjustedBalanceDifference = adjustedTotalSellAmount - adjustedTotalBuyAmount

  return {
    totalProfit: netProfit,
    totalProfitToday,
    totalTransactions,
    completedTransactions,
    pendingBuy: pendingBuyAmount,
    pendingSell: pendingSellAmount,
    totalBuyAmount,
    totalSellAmount,
    totalBuyValue,
    totalSellValue,
    averageBuyPrice,
    averageSellPrice,
    profitMargin,
    roi,
    totalVolume: totalBuyAmount + totalSellAmount,
    completedCycles: totalCompletedCycles,
    pendingToBuy: adjustedBalanceDifference > 0 ? adjustedBalanceDifference : 0,
    pendingToSell: adjustedBalanceDifference < 0 ? Math.abs(adjustedBalanceDifference) : 0,
    todayBuyAmount,
    todaySellAmount,
    todayBuyValue,
    todaySellValue,
    todayPendingBuyAmount,
    todayPendingSellAmount,
    todayTransactionsCount: todayTxIds.size,
    todayCompletedCount,
    todayVolume: todayBuyAmount + todaySellAmount,
    todayCompletedCycles: todayCycles.length,
    todayCyclesVolumeUsdt: todayCycles.reduce((s, c) => s + c.usdtAmount, 0),
    todayCyclesVolumeBs: todayCycles.reduce((s, c) => s + c.sellFiatAmount, 0),
    todayCyclesSummary,
    currentCycleSoldUsdt: pendingSell,
    currentCycleBoughtUsdt: pendingBuy,
    remainingToSellUsdt: pendingSell,
    remainingToBuyUsdt: pendingBuy,
    remainingToSellBs: latestSellPrice > 0 ? pendingSell * latestSellPrice : 0,
    remainingToBuyBs: latestBuyPrice > 0 ? pendingBuy * latestBuyPrice : 0,
    closedCyclesProfitTotal: closedCyclesProfitAgg._sum.netProfit ?? 0,
    lastClosedCycleProfit: lastClosedCycle?.netProfit ?? 0,
    manualBuyEquivalent,
    manualSellEquivalent,
    adjustedTotalBuyAmount,
    adjustedTotalSellAmount,
    manualNetUsdt: manualBuyEquivalent - manualSellEquivalent,
    manualAdjustments: manualAdjustments
      .slice(-5)
      .reverse()
      .map((a) => ({
        id: a.id,
        type: a.type,
        usdtAmount: a.usdtAmount,
        note: a.note,
        createdAt: a.createdAt,
      })),
    latestBuyPrice,
    latestSellPrice,
    currentGap,
    currentGapPercent,
    estimatedProfitPerUsdt,
    estimatedROI,
    buyPriceTrend,
    isGapTooSmall,
    todayMatchedUsdt,
    todayAvgBuyPrice,
    todayAvgSellPrice,
    todaySpread,
    todayEstimatedGrossBs,
    todayPagoMovilFeeBs,
    todayBinanceFeeBs,
    todayEstimatedNetBs,
    todayEstimatedNetUsdt,
    todayEstimatedNetPerUsdt,
    liveCycleActive,
    liveCycleSoldUsdt,
    liveCycleBoughtUsdt,
    liveCycleSellBs,
    liveCycleBuyBs,
    liveCycleAvgSellPrice,
    liveCycleAvgBuyPrice,
    liveCycleMatchedUsdt,
    liveCycleSpread,
    liveCycleGrossBs,
    liveCyclePagoMovilFeeBs,
    liveCycleBinanceFeeBs,
    liveCycleNetBs,
    liveCycleNetUsdt,
    liveCycleAdFeeUsdt,
    liveCycleNetUsdtAfterAd,
    liveCycleProfitPercent,
    liveCycleProgressPercent,
    liveCycleRemainingToBuyUsdt,
    liveCycleRemainingBuyBs,
    liveCycleInventoryUsdt,
    liveCycleCashDiffBs,
  }
}
