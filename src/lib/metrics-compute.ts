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
          createTime: true,
          completedAt: true,
          binanceOrderId: true,
        },
      }),
    () =>
      prisma.binanceP2PTransaction.findMany({
        where: { orderStatus: 'COMPLETED', createTime: { gte: startDate } },
        select: { tradeType: true, amount: true, createTime: true },
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
  const avgBankCommissionPercent =
    buyAgg._count > 0 ? avgCommissionPercent(recentPeriodBuys, 'bankCommission') : 0.3

  const recentBuyCommissions =
    recentBuys.length > 0
      ? avgCommissionPercent(recentBuys, 'commission')
      : avgBinanceCommissionPercent
  const recentBuyBankCommissions =
    recentBuys.length > 0
      ? avgCommissionPercent(recentBuys, 'bankCommission')
      : avgBankCommissionPercent
  const totalCommissionPercent = recentBuyCommissions + recentBuyBankCommissions

  const estimatedProfitPerUsdt =
    currentGap > 0 && latestBuyPrice > 0
      ? Math.max(0, currentGap - latestBuyPrice * (totalCommissionPercent / 100))
      : 0
  const estimatedROI =
    latestBuyPrice > 0 && estimatedProfitPerUsdt > 0
      ? (estimatedProfitPerUsdt / latestBuyPrice) * 100
      : 0
  const isGapTooSmall = currentGapPercent < 1

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

  type CarryEvent = { tradeType: 'BUY' | 'SELL'; amount: number; createTime: Date }
  const carryEvents: CarryEvent[] = [
    ...completedForCarry.map((tx) => ({
      tradeType: tx.tradeType as 'BUY' | 'SELL',
      amount: tx.amount,
      createTime: new Date(tx.createTime),
    })),
    ...manualAdjustments.map((adj) => ({
      tradeType: (adj.type === 'SELL_EXTERNAL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
      amount: adj.usdtAmount,
      createTime: adj.createdAt,
    })),
  ].sort((a, b) => a.createTime.getTime() - b.createTime.getTime())

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
  }
}
