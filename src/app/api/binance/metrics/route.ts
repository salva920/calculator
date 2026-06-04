import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processAndSaveCycles } from '@/utils/cycle-processor'
import { formatDateYmdCaracas, getTodayBoundsCaracas, isCompletedInWindow } from '@/utils/caracas-date'
import {
  getMetricsCacheEntry,
  METRICS_CACHE_TTL_MS,
  setMetricsCacheEntry,
} from '@/lib/metrics-cache'

const MIN_CYCLE_USDT = 0.01 // mínimo para considerar un ciclo (evitar polvo)
const prismaAny = prisma as any

type ManualAdjustmentRecord = {
  id: string
  type: 'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT'
  usdtAmount: number
  note: string | null
  createdAt: Date
}

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetro de filtro de fecha desde query string
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('dateFilter') || 'all' // 'week', 'month', 'threeMonths', 'all'
    const shouldProcessCycles = searchParams.get('processCycles') === 'true'
    const forceRefresh = searchParams.get('refresh') === '1' || searchParams.get('refresh') === 'true'
    
    // Verificar caché (omitir si refresh o procesando ciclos)
    if (!shouldProcessCycles && !forceRefresh) {
      const cacheKey = `metrics-${dateFilter}`
      const cached = getMetricsCacheEntry(cacheKey)
      if (cached && Date.now() - cached.timestamp < METRICS_CACHE_TTL_MS) {
        return NextResponse.json({
          success: true,
          metrics: cached.data,
          cached: true,
        })
      }
    }
    
    // Calcular fecha de inicio según el filtro
    let startDate: Date | null = null
    const now = new Date()
    
    switch (dateFilter) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'threeMonths':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'all':
      default:
        startDate = null
        break
    }
    
    // Construir query con filtro de fecha si es necesario
    const whereClause = startDate
      ? {
          createTime: {
            gte: startDate,
          },
        }
      : {}
    
    // Obtener transacciones P2P (filtradas por fecha si es necesario)
    const allTransactions = await prisma.binanceP2PTransaction.findMany({
      where: whereClause,
      orderBy: {
        createTime: 'desc',
      },
    })

    // Estados normalizados (Binance puede devolver "Completed", "TRADING", etc.)
    const isCompleted = (status: string) => (status || '').toString().toUpperCase() === 'COMPLETED'
    const cancelledStatusList = ['CANCELLED', 'CANCELLED_BY_SYSTEM']
    const isCancelled = (status: string) => cancelledStatusList.includes((status || '').toString().toUpperCase())
    const inProgressStatusList = ['TRADING', 'BUYER_PAYED', 'APPEALING', 'PARTIAL_COMPLETED']
    const isInProgress = (status: string) => inProgressStatusList.includes((status || '').toString().toUpperCase())

    // Separar transacciones por estado y tipo
    const completedBuys = allTransactions.filter(
      (tx) => tx.tradeType === 'BUY' && isCompleted(tx.orderStatus)
    )
    const completedSells = allTransactions.filter(
      (tx) => tx.tradeType === 'SELL' && isCompleted(tx.orderStatus)
    )
    // Pendientes: cualquier orden no cancelada y no completada (incluye TRADING, BUYER_PAYED, etc.)
    const pendingBuys = allTransactions.filter(
      (tx) =>
        tx.tradeType === 'BUY' &&
        !isCompleted(tx.orderStatus) &&
        !isCancelled(tx.orderStatus) &&
        isInProgress(tx.orderStatus)
    )
    const pendingSells = allTransactions.filter(
      (tx) =>
        tx.tradeType === 'SELL' &&
        !isCompleted(tx.orderStatus) &&
        !isCancelled(tx.orderStatus) &&
        isInProgress(tx.orderStatus)
    )

    // Día actual en Caracas (misma ventana que el resumen directo desde Binance)
    const { start: today, end: todayEnd } = getTodayBoundsCaracas()

    const instantInCaracasToday = (d: Date) => {
      const t = new Date(d).getTime()
      return t >= today.getTime() && t <= todayEnd.getTime()
    }

    const todayByCreateTime = allTransactions.filter((tx) => instantInCaracasToday(new Date(tx.createTime)))

    // Completadas hoy: misma regla que la lista (createTime o completedAt en el día Caracas).
    // No usar solo completedAt: al sincronizar puede cambiar y hacer bajar el total.
    const todayCompletedBuys = allTransactions.filter(
      (tx) => tx.tradeType === 'BUY' && isCompletedInWindow(tx, today, todayEnd)
    )
    const todayCompletedSells = allTransactions.filter(
      (tx) => tx.tradeType === 'SELL' && isCompletedInWindow(tx, today, todayEnd)
    )
    const todayPendingBuys = todayByCreateTime.filter(
      (tx) =>
        tx.tradeType === 'BUY' &&
        !isCompleted(tx.orderStatus) &&
        !isCancelled(tx.orderStatus) &&
        isInProgress(tx.orderStatus)
    )
    const todayPendingSells = todayByCreateTime.filter(
      (tx) =>
        tx.tradeType === 'SELL' &&
        !isCompleted(tx.orderStatus) &&
        !isCancelled(tx.orderStatus) &&
        isInProgress(tx.orderStatus)
    )

    const todayTxIds = new Set<string>()
    for (const tx of todayCompletedBuys) todayTxIds.add(tx.id)
    for (const tx of todayCompletedSells) todayTxIds.add(tx.id)
    for (const tx of todayPendingBuys) todayTxIds.add(tx.id)
    for (const tx of todayPendingSells) todayTxIds.add(tx.id)
    let todayTransactionsCount = todayTxIds.size

    // Calcular totales de transacciones COMPLETADAS (todas)
    const totalBuyAmount = completedBuys.reduce((sum, tx) => sum + tx.amount, 0)
    const totalSellAmount = completedSells.reduce((sum, tx) => sum + tx.amount, 0)
    
    const totalBuyValue = completedBuys.reduce((sum, tx) => sum + tx.fiatAmount, 0)
    const totalSellValue = completedSells.reduce((sum, tx) => sum + tx.fiatAmount, 0)

    // Totales de HOY desde BD (monótonos al llegar ventas nuevas; alineado con la tabla)
    const todayBuyAmount = todayCompletedBuys.reduce((sum, tx) => sum + tx.amount, 0)
    const todaySellAmount = todayCompletedSells.reduce((sum, tx) => sum + tx.amount, 0)
    const todayBuyValue = todayCompletedBuys.reduce((sum, tx) => sum + tx.fiatAmount, 0)
    const todaySellValue = todayCompletedSells.reduce((sum, tx) => sum + tx.fiatAmount, 0)
    const todayPendingBuyAmount = todayPendingBuys.reduce((sum, tx) => sum + tx.amount, 0)
    const todayPendingSellAmount = todayPendingSells.reduce((sum, tx) => sum + tx.amount, 0)

    const todayCompletedCount = todayCompletedBuys.length + todayCompletedSells.length

    // Calcular precios promedio (solo de completadas)
    const averageBuyPrice = completedBuys.length > 0
      ? totalBuyValue / totalBuyAmount
      : 0
    const averageSellPrice = completedSells.length > 0
      ? totalSellValue / totalSellAmount
      : 0

    // Calcular ganancias (solo de transacciones completadas)
    const grossProfit = totalSellValue - totalBuyValue
    const totalCommissions = completedBuys.concat(completedSells).reduce((sum, tx) => sum + tx.commission, 0)
    const netProfit = grossProfit - totalCommissions

    // Calcular ganancia del día (solo completadas de hoy)
    const todayCommissions = todayCompletedBuys
      .concat(todayCompletedSells)
      .reduce((sum, tx) => sum + tx.commission, 0)
    const totalProfitToday = todaySellValue - todayBuyValue - todayCommissions

    // Calcular ROI basado en las tasas de compra y venta
    // ROI = ((precio_venta_promedio - precio_compra_promedio) / precio_compra_promedio) * 100
    let roi = 0
    if (averageBuyPrice > 0 && averageSellPrice > 0) {
      roi = ((averageSellPrice - averageBuyPrice) / averageBuyPrice) * 100
    }
    
    // Margen de ganancia
    const profitMargin = totalSellValue > 0 ? (netProfit / totalSellValue) * 100 : 0

    // Obtener las transacciones más recientes de cada tipo (completadas)
    // Ordenar todas las transacciones completadas por fecha descendente y tomar las más recientes
    const allRecentBuysSorted = completedBuys
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    
    const allRecentSellsSorted = completedSells
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    
    // Priorizar transacciones de hoy, pero si no hay suficientes, usar las más recientes disponibles
    let recentBuys = todayCompletedBuys
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    
    // Si no hay transacciones de hoy o hay menos de 1, usar las más recientes de todas las fechas
    if (recentBuys.length === 0) {
      recentBuys = allRecentBuysSorted.slice(0, 5)
    } else if (recentBuys.length < 5) {
      // Combinar transacciones de hoy con las más recientes de todas las fechas
      const combinedBuys = [...recentBuys, ...allRecentBuysSorted]
        .filter((tx, index, self) => 
          index === self.findIndex(t => t.binanceOrderId === tx.binanceOrderId)
        )
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
        .slice(0, 5)
      recentBuys = combinedBuys
    } else {
      recentBuys = recentBuys.slice(0, 5)
    }

    let recentSells = todayCompletedSells
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    
    // Si no hay transacciones de hoy o hay menos de 1, usar las más recientes de todas las fechas
    if (recentSells.length === 0) {
      recentSells = allRecentSellsSorted.slice(0, 5)
    } else if (recentSells.length < 5) {
      // Combinar transacciones de hoy con las más recientes de todas las fechas
      const combinedSells = [...recentSells, ...allRecentSellsSorted]
        .filter((tx, index, self) => 
          index === self.findIndex(t => t.binanceOrderId === tx.binanceOrderId)
        )
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
        .slice(0, 5)
      recentSells = combinedSells
    } else {
      recentSells = recentSells.slice(0, 5)
    }

    // Calcular tasas más recientes
    // Para la brecha actual, usar la transacción MÁS RECIENTE (no el promedio)
    // Esto asegura que refleje las tasas actuales del mercado
    const latestBuyPrice = recentBuys.length > 0
      ? recentBuys[0].unitPrice // La más reciente (primera después de ordenar desc)
      : (completedBuys.length > 0 
          ? completedBuys.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())[0]?.unitPrice || averageBuyPrice
          : 0)
    const latestSellPrice = recentSells.length > 0
      ? recentSells[0].unitPrice // La más reciente (primera después de ordenar desc)
      : (completedSells.length > 0
          ? completedSells.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())[0]?.unitPrice || averageSellPrice
          : 0)
    
    // También calcular promedio de las últimas 5 para comparación (opcional)
    const avgRecentBuyPrice = recentBuys.length > 0
      ? recentBuys.reduce((sum, tx) => sum + tx.unitPrice, 0) / recentBuys.length
      : averageBuyPrice
    const avgRecentSellPrice = recentSells.length > 0
      ? recentSells.reduce((sum, tx) => sum + tx.unitPrice, 0) / recentSells.length
      : averageSellPrice

    // Detectar tendencia de cambio en tasas de compra
    let buyPriceTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (recentBuys.length >= 2) {
      const oldestPrice = recentBuys[recentBuys.length - 1].unitPrice
      const newestPrice = recentBuys[0].unitPrice
      const changePercent = ((newestPrice - oldestPrice) / oldestPrice) * 100
      
      if (changePercent > 0.5) {
        buyPriceTrend = 'increasing'
      } else if (changePercent < -0.5) {
        buyPriceTrend = 'decreasing'
      }
    }

    // Calcular brecha actual (diferencia entre tasa de venta y compra más recientes)
    const currentGap = latestSellPrice > 0 && latestBuyPrice > 0
      ? latestSellPrice - latestBuyPrice
      : 0
    const currentGapPercent = latestBuyPrice > 0
      ? (currentGap / latestBuyPrice) * 100
      : 0

    // Calcular ganancia estimada por USDT basada en la brecha actual
    // Considerando comisiones promedio (Binance + comisión bancaria)
    const avgBinanceCommissionPercent = completedBuys.length > 0
      ? completedBuys.reduce((sum, tx) => {
          const commission = tx.commission || 0
          const fiatAmount = tx.fiatAmount || 0
          return sum + (fiatAmount > 0 ? (commission / fiatAmount) * 100 : 0)
        }, 0) / completedBuys.length
      : 0.1 // Default 0.1% para Binance si no hay datos
    
    const avgBankCommissionPercent = completedBuys.length > 0
      ? completedBuys.reduce((sum, tx) => {
          const bankComm = tx.bankCommission || 0
          const fiatAmount = tx.fiatAmount || 0
          return sum + (fiatAmount > 0 ? (bankComm / fiatAmount) * 100 : 0)
        }, 0) / completedBuys.length
      : 0.3 // Default 0.3% si no hay datos

    // Ganancia estimada por USDT = brecha - comisiones (en Bs.S)
    // Comisiones se calculan sobre el precio de compra
    // Usar comisiones de las transacciones más recientes si están disponibles
    const recentBuyCommissions = recentBuys.length > 0
      ? recentBuys.reduce((sum, tx) => {
          const commission = tx.commission || 0
          const fiatAmount = tx.fiatAmount || 0
          return sum + (fiatAmount > 0 ? (commission / fiatAmount) * 100 : 0)
        }, 0) / recentBuys.length
      : avgBinanceCommissionPercent
    
    const recentBuyBankCommissions = recentBuys.length > 0
      ? recentBuys.reduce((sum, tx) => {
          const bankComm = tx.bankCommission || 0
          const fiatAmount = tx.fiatAmount || 0
          return sum + (fiatAmount > 0 ? (bankComm / fiatAmount) * 100 : 0)
        }, 0) / recentBuys.length
      : avgBankCommissionPercent
    
    const totalCommissionPercent = recentBuyCommissions + recentBuyBankCommissions
    
    // Calcular ganancia estimada solo si la brecha es positiva (venta > compra)
    const estimatedProfitPerUsdt = currentGap > 0 && latestBuyPrice > 0
      ? Math.max(0, currentGap - (latestBuyPrice * (totalCommissionPercent / 100)))
      : 0

    // ROI estimado basado en brecha actual
    const estimatedROI = latestBuyPrice > 0 && estimatedProfitPerUsdt > 0
      ? (estimatedProfitPerUsdt / latestBuyPrice) * 100
      : 0

    // Alerta si la brecha es muy pequeña (menos del 1%)
    const isGapTooSmall = currentGapPercent < 1

    // Calcular pendientes (transacciones en proceso)
    const pendingBuyAmount = pendingBuys.reduce((sum, tx) => sum + tx.amount, 0)
    const pendingSellAmount = pendingSells.reduce((sum, tx) => sum + tx.amount, 0)

    // Ciclos: cantidad real vendida y comprada emparejada (sin 100 fijo). Orden cronológico.
    const cycleWindowStart = new Date(now)
    cycleWindowStart.setMonth(cycleWindowStart.getMonth() - 6)

    // Solo procesar ciclos si se solicita explícitamente (no en cada request para mejorar rendimiento)
    if (shouldProcessCycles) {
      // Ejecutar en background sin bloquear la respuesta
      processAndSaveCycles(cycleWindowStart, today, todayEnd).catch((err) =>
        console.error('Error procesando ciclos en background:', err)
      )
    }

    // Usar ciclos ya guardados para contar y calcular pendientes acumulados con completadas + ajustes manuales
    const [savedCycles, completedTransactionsForCarry, manualAdjustments] = await Promise.all([
      prisma.p2PCycle.findMany({
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
      prisma.binanceP2PTransaction.findMany({
        where: {
          orderStatus: 'COMPLETED',
        },
        select: {
          tradeType: true,
          amount: true,
          createTime: true,
        },
        orderBy: { createTime: 'asc' },
      }),
      prismaAny.manualBalanceAdjustment.findMany({
        select: {
          id: true,
          type: true,
          usdtAmount: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]) as [any[], any[], ManualAdjustmentRecord[]]

    // Contar ciclos completados usando los guardados
    const totalCompletedCycles = savedCycles.length
    const todayCyclesRaw = savedCycles.filter(
      (c) => formatDateYmdCaracas(new Date(c.date)) === formatDateYmdCaracas(today)
    )
    // Ordenar por completedAt para mostrar ciclos en orden
    const todayCycles = [...todayCyclesRaw].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    const todayCompletedCycles = todayCycles.length
    const todayCyclesVolumeUsdt = todayCycles.reduce((sum, c) => sum + c.usdtAmount, 0)
    const todayCyclesVolumeBs = todayCycles.reduce((sum, c) => sum + c.sellFiatAmount, 0)
    const closedCyclesProfitTotal = savedCycles.reduce((sum, c) => sum + (c.netProfit ?? 0), 0)
    const sortedCyclesByCompletedAt = [...savedCycles].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )
    const lastClosedCycleProfit = sortedCyclesByCompletedAt[0]?.netProfit ?? 0
    // Resumen por ciclo: cantidad total vendida + cantidad total comprada = 1 ciclo; ganancia y acumulado
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

    // Calcular pendientes acumulados (carry entre días) usando Binance + ajustes manuales
    type CarryEvent = { tradeType: 'BUY' | 'SELL'; amount: number; createTime: Date }
    const carryEvents: CarryEvent[] = [
      ...completedTransactionsForCarry.map((tx) => ({
        tradeType: tx.tradeType as 'BUY' | 'SELL',
        amount: tx.amount,
        createTime: new Date(tx.createTime),
      })),
      ...manualAdjustments.map((adj) => ({
        // BUY_EXTERNAL y SETTLEMENT reducen saldo por comprar; SELL_EXTERNAL incrementa saldo por comprar
        tradeType: (adj.type === 'SELL_EXTERNAL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
        amount: adj.usdtAmount,
        createTime: adj.createdAt,
      })),
    ].sort((a, b) => a.createTime.getTime() - b.createTime.getTime())

    let pendingSell = 0
    let pendingBuy = 0
    for (const event of carryEvents) {
      if (event.tradeType === 'SELL') pendingSell += event.amount
      else if (event.tradeType === 'BUY') pendingBuy += event.amount
      while (pendingSell >= MIN_CYCLE_USDT && pendingBuy >= MIN_CYCLE_USDT) {
        const subtract = Math.min(pendingSell, pendingBuy)
        pendingSell -= subtract
        pendingBuy -= subtract
      }
    }
    const manualBuyEquivalent = manualAdjustments
      .filter((a) => a.type === 'BUY_EXTERNAL' || a.type === 'SETTLEMENT')
      .reduce((sum, a) => sum + a.usdtAmount, 0)
    const manualSellEquivalent = manualAdjustments
      .filter((a) => a.type === 'SELL_EXTERNAL')
      .reduce((sum, a) => sum + a.usdtAmount, 0)

    const adjustedTotalBuyAmount = totalBuyAmount + manualBuyEquivalent
    const adjustedTotalSellAmount = totalSellAmount + manualSellEquivalent
    const adjustedBalanceDifference = adjustedTotalSellAmount - adjustedTotalBuyAmount

    const currentCycleSoldUsdt = pendingSell
    const currentCycleBoughtUsdt = pendingBuy

    // Pendientes para el próximo ciclo (cantidad variable: cuando emparejes, el ciclo será min(vendido, comprado))
    const remainingToSellUsdt = currentCycleSoldUsdt
    const remainingToBuyUsdt = currentCycleBoughtUsdt
    const remainingToSellBs = latestSellPrice > 0 ? currentCycleSoldUsdt * latestSellPrice : 0
    const remainingToBuyBs = latestBuyPrice > 0 ? currentCycleBoughtUsdt * latestBuyPrice : 0
    
    // Volumen total de HOY (compras + ventas completadas)
    const todayVolume = todayBuyAmount + todaySellAmount
    
    // Total de transacciones (todas)
    const totalTransactions = allTransactions.length
    const completedTransactions = allTransactions.filter(
      (tx) => isCompleted(tx.orderStatus)
    ).length

    const metrics = {
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
      // Métricas de HOY
      todayBuyAmount,
      todaySellAmount,
      todayBuyValue,
      todaySellValue,
      todayPendingBuyAmount,
      todayPendingSellAmount,
      todayTransactionsCount,
      todayCompletedCount,
      todayVolume,
      todayCompletedCycles,
      // Ciclos: cantidad variable (lo que vendes y compras emparejado). Pendientes = lo que falta por emparejar.
      todayCyclesVolumeUsdt,
      todayCyclesVolumeBs,
      todayCyclesSummary,
      currentCycleSoldUsdt,
      currentCycleBoughtUsdt,
      remainingToSellUsdt,
      remainingToBuyUsdt,
      remainingToSellBs,
      remainingToBuyBs,
      closedCyclesProfitTotal,
      lastClosedCycleProfit,
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
      // Métricas de brecha y estimaciones
      latestBuyPrice,
      latestSellPrice,
      currentGap,
      currentGapPercent,
      estimatedProfitPerUsdt,
      estimatedROI,
      buyPriceTrend,
      isGapTooSmall,
    }

    // Guardar en caché
    const cacheKey = `metrics-${dateFilter}`
    setMetricsCacheEntry(cacheKey, metrics)
    
    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error: any) {
    console.error('Error calculando métricas:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al calcular métricas',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

