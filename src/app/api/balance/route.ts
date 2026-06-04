export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTimeDynamicError } from '@/lib/api-route'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const days = parseInt(searchParams.get('days') || '7')

    // Rango hacia atrás: por defecto "últimos N días" hasta hoy (o hasta la fecha indicada).
    const endDate = date ? new Date(date) : new Date()
    endDate.setHours(23, 59, 59, 999)

    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)

    // Usamos solo transacciones P2P completadas como base del balance diario
    const binanceTxs = await prisma.binanceP2PTransaction.findMany({
      where: {
        createTime: {
          gte: startDate,
          lte: endDate
        },
        orderStatus: 'COMPLETED'
      },
      orderBy: { createTime: 'asc' }
    })

    // Agrupar por día y calcular:
    // - Volumen (USDT)
    // - Ganancia en USDT = USDT comprados - USDT vendidos
    // - Ganancia en Bs.S aprox = gananciaUSDT * precioVentaPromedioDelDía
    const dailyMap = new Map<string, {
      date: Date
      totalTransactions: number
      buyUsdt: number
      sellUsdt: number
      buyFiat: number
      sellFiat: number
    }>()

    for (const tx of binanceTxs) {
      const day = new Date(tx.createTime)
      day.setHours(0, 0, 0, 0)
      const dayKey = day.toISOString().substring(0, 10)

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          date: day,
          totalTransactions: 0,
          buyUsdt: 0,
          sellUsdt: 0,
          buyFiat: 0,
          sellFiat: 0
        })
      }

      const entry = dailyMap.get(dayKey)!
      entry.totalTransactions += 1

      if (tx.tradeType === 'BUY') {
        entry.buyUsdt += tx.amount
        entry.buyFiat += tx.fiatAmount
      } else {
        entry.sellUsdt += tx.amount
        entry.sellFiat += tx.fiatAmount
      }
    }

    const dailyBalances = Array.from(dailyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(d => {
        const totalUsdtAmount = d.buyUsdt + d.sellUsdt

        // Ganancia simple en USDT: lo que faltó por vender (BUY - SELL)
        const profitUsdt = d.buyUsdt - d.sellUsdt

        // Precio de referencia: promedio de venta (si existe), si no, promedio de compra
        const avgSellPrice = d.sellUsdt > 0 ? d.sellFiat / d.sellUsdt : 0
        const avgBuyPrice = d.buyUsdt > 0 ? d.buyFiat / d.buyUsdt : 0
        const priceRef = avgSellPrice || avgBuyPrice || 0

        const profitBs = priceRef > 0 ? profitUsdt * priceRef : 0

        // ROI aproximado: gananciaUSDT / USDT comprados
        const roi = d.buyUsdt > 0 ? (profitUsdt / d.buyUsdt) * 100 : 0

        return {
          date: d.date,
          totalTransactions: d.totalTransactions,
          totalUsdtAmount,
          totalGrossProfit: profitBs,
          totalNetProfit: profitBs,
          totalCosts: 0,
          averageROI: roi
        }
      })

    // Resumen total sobre el rango
    const totalTransactions = dailyBalances.reduce((sum, d) => sum + d.totalTransactions, 0)
    const totalUsdtAmount = dailyBalances.reduce((sum, d) => sum + d.totalUsdtAmount, 0)
    const totalGrossProfit = dailyBalances.reduce((sum, d) => sum + d.totalGrossProfit, 0)
    const totalNetProfit = dailyBalances.reduce((sum, d) => sum + d.totalNetProfit, 0)
    const totalCosts = 0

    const totalDays = dailyBalances.length
    const averageDailyProfit = totalDays > 0 ? totalNetProfit / totalDays : 0
    const projectedMonthly = averageDailyProfit * 30

    // ROI promedio simple del rango
    const averageROI = totalDays > 0
      ? dailyBalances.reduce((sum, d) => sum + d.averageROI, 0) / totalDays
      : 0

    const bestDay = dailyBalances.reduce(
      (max, d) => (d.totalNetProfit > max ? d.totalNetProfit : max),
      0
    )
    const worstDay = dailyBalances.reduce(
      (min, d) => (d.totalNetProfit < min ? d.totalNetProfit : min),
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        dailyBalances,
        summary: {
          totalTransactions,
          totalUsdtAmount,
          totalGrossProfit,
          totalNetProfit,
          totalCosts,
          averageROI,
          averageDailyProfit,
          projectedMonthly,
          bestDay,
          worstDay,
          totalDays
        }
      }
    })

  } catch (error: unknown) {
    if (!isBuildTimeDynamicError(error)) {
      console.error('Error fetching balance:', error)
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener el balance',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

