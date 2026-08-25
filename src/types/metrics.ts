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
  /** Estimación operativa del día (ops COMPLETED hoy), no FIFO histórico */
  todayMatchedUsdt?: number
  todayAvgBuyPrice?: number
  todayAvgSellPrice?: number
  todaySpread?: number
  todayEstimatedGrossBs?: number
  todayPagoMovilFeeBs?: number
  todayBinanceFeeBs?: number
  todayEstimatedNetBs?: number
  todayEstimatedNetUsdt?: number
  todayEstimatedNetPerUsdt?: number
  /**
   * Análisis en vivo del ciclo abierto (mismo criterio manual):
   * matched × spread − PM 0,30% − fees Binance, con % y progreso de recompra.
   */
  liveCycleActive?: boolean
  liveCycleSoldUsdt?: number
  liveCycleBoughtUsdt?: number
  liveCycleSellBs?: number
  liveCycleBuyBs?: number
  liveCycleAvgSellPrice?: number
  liveCycleAvgBuyPrice?: number
  liveCycleMatchedUsdt?: number
  liveCycleSpread?: number
  liveCycleGrossBs?: number
  liveCyclePagoMovilFeeBs?: number
  liveCycleBinanceFeeBs?: number
  liveCycleNetBs?: number
  liveCycleNetUsdt?: number
  liveCycleAdFeeUsdt?: number
  liveCycleNetUsdtAfterAd?: number
  /** % neto sobre costo de recompra (matched × media compra) */
  liveCycleProfitPercent?: number
  /** Progreso de cierre: min(1, bought/sold) * 100 cuando hay ventas abiertas */
  liveCycleProgressPercent?: number
  liveCycleRemainingToBuyUsdt?: number
  liveCycleRemainingBuyBs?: number
  liveCycleInventoryUsdt?: number
  liveCycleCashDiffBs?: number
}
