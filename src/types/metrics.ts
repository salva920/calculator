export interface DashboardMetrics {
  totalProfit: number
  totalProfitToday: number
  totalTransactions: number
  completedTransactions: number
  pendingBuy: number
  pendingSell: number
  totalBuyAmount: number
  totalSellAmount: number
  totalBuyValue: number
  totalSellValue: number
  averageBuyPrice: number
  averageSellPrice: number
  profitMargin: number
  roi: number
  totalVolume: number
  completedCycles: number
  pendingToBuy: number
  pendingToSell: number
  todayBuyAmount: number
  todaySellAmount: number
  todayBuyValue: number
  todaySellValue: number
  todayPendingBuyAmount: number
  todayPendingSellAmount: number
  todayTransactionsCount: number
  todayCompletedCount: number
  todayVolume: number
  todayCompletedCycles: number
  todayCyclesVolumeUsdt?: number
  todayCyclesVolumeBs?: number
  todayCyclesSummary?: {
    cycles: {
      cycleNumber: number
      sellUsdtAmount: number
      buyUsdtAmount: number
      netProfit: number
      cumulativeProfit: number
    }[]
    totalProfitFromCycles: number
  }
  currentCycleSoldUsdt?: number
  currentCycleBoughtUsdt?: number
  remainingToSellUsdt?: number
  remainingToBuyUsdt?: number
  remainingToSellBs?: number
  remainingToBuyBs?: number
  manualBuyEquivalent?: number
  manualSellEquivalent?: number
  adjustedTotalBuyAmount?: number
  adjustedTotalSellAmount?: number
  manualNetUsdt?: number
  closedCyclesProfitTotal?: number
  lastClosedCycleProfit?: number
  manualAdjustments?: {
    id: string
    type: 'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT'
    usdtAmount: number
    note: string | null
    createdAt: Date | string
  }[]
  latestBuyPrice: number
  latestSellPrice: number
  currentGap: number
  currentGapPercent: number
  estimatedProfitPerUsdt: number
  estimatedROI: number
  buyPriceTrend: 'increasing' | 'decreasing' | 'stable'
  isGapTooSmall: boolean
}
