export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTodayBoundsCaracas } from '@/utils/caracas-date'

/**
 * GET /api/binance/debug-compras-hoy
 *
 * Prueba de diagnóstico: aplica la misma lógica que las métricas para
 * "compras hoy" y devuelve el desglose (fechas, transacciones, totales por estado).
 * Útil para ver por qué el total de compras no se actualiza.
 *
 * Uso: abre en el navegador http://localhost:3000/api/binance/debug-compras-hoy
 *      o: curl http://localhost:3000/api/binance/debug-compras-hoy
 */
export async function GET() {
  try {
    const { start: todayStart, end: todayEnd } = getTodayBoundsCaracas()

    // Misma lógica que en metrics: cargar transacciones (últimos 60 días para no traer todo)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const transactions = await prisma.binanceP2PTransaction.findMany({
      where: { createTime: { gte: sixtyDaysAgo } },
      orderBy: { createTime: 'desc' },
      select: {
        id: true,
        binanceOrderId: true,
        tradeType: true,
        amount: true,
        orderStatus: true,
        createTime: true,
        completedAt: true,
        fiatAmount: true,
      },
    })

    const isCompleted = (status: string) =>
      (status || '').toString().toUpperCase() === 'COMPLETED'
    const cancelledList = ['CANCELLED', 'CANCELLED_BY_SYSTEM']
    const isCancelled = (status: string) =>
      cancelledList.includes((status || '').toString().toUpperCase())
    const inProgressList = ['TRADING', 'BUYER_PAYED', 'APPEALING', 'PARTIAL_COMPLETED']
    const isInProgress = (status: string) =>
      inProgressList.includes((status || '').toString().toUpperCase())

    const instantInCaracasToday = (d: Date) => {
      const t = new Date(d).getTime()
      return t >= todayStart.getTime() && t <= todayEnd.getTime()
    }

    const effectiveCompletion = (tx: { createTime: Date; completedAt: Date | null }) =>
      tx.completedAt != null ? new Date(tx.completedAt) : new Date(tx.createTime)

    const todayByCreateTime = transactions.filter((tx) => instantInCaracasToday(new Date(tx.createTime)))

    const todayCompletedBuys = transactions.filter(
      (tx) =>
        tx.tradeType === 'BUY' &&
        isCompleted(tx.orderStatus) &&
        instantInCaracasToday(effectiveCompletion(tx))
    )
    const todayBuys = todayByCreateTime.filter((tx) => tx.tradeType === 'BUY')
    const todayPendingBuys = todayBuys.filter(
      (tx) =>
        !isCompleted(tx.orderStatus) &&
        !isCancelled(tx.orderStatus) &&
        isInProgress(tx.orderStatus)
    )
    const todayOtherBuys = todayBuys.filter(
      (tx) =>
        !isCompleted(tx.orderStatus) &&
        !isCancelled(tx.orderStatus) &&
        !isInProgress(tx.orderStatus)
    )

    const todayBuyAmount = todayCompletedBuys.reduce((s, tx) => s + tx.amount, 0)
    const todayPendingBuyAmount = todayPendingBuys.reduce((s, tx) => s + tx.amount, 0)
    const todayOtherBuyAmount = todayOtherBuys.reduce((s, tx) => s + tx.amount, 0)

    // Agrupar por orderStatus para ver qué estados hay
    const byStatus: Record<string, { count: number; amount: number; orderIds: string[] }> = {}
    for (const tx of todayBuys) {
      const status = (tx.orderStatus || '(vacío)').toString()
      if (!byStatus[status]) byStatus[status] = { count: 0, amount: 0, orderIds: [] }
      byStatus[status].count += 1
      byStatus[status].amount += tx.amount
      byStatus[status].orderIds.push(tx.binanceOrderId)
    }

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico de "compras hoy" (COMPLETED por cierre Caracas; pendientes por creación)',
      hoy: {
        timezone: 'America/Caracas',
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
        startLocal: todayStart.toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
        endLocal: todayEnd.toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
      },
      resumen: {
        totalTransaccionesEnVentana: transactions.length,
        transaccionesHoyPorCreacion: todayByCreateTime.length,
        comprasHoyPorCreacion: todayBuys.length,
        ventasHoyPorCreacion: todayByCreateTime.filter((t) => t.tradeType === 'SELL').length,
      },
      comprasHoy: {
        completadas: {
          cantidad: todayCompletedBuys.length,
          usdt: Math.round(todayBuyAmount * 100) / 100,
        },
        pendientes: {
          cantidad: todayPendingBuys.length,
          usdt: Math.round(todayPendingBuyAmount * 100) / 100,
        },
        otrosEstados: {
          cantidad: todayOtherBuys.length,
          usdt: Math.round(todayOtherBuyAmount * 100) / 100,
          nota: 'Ni COMPLETED ni canceladas ni en progreso; no se suman en el dashboard.',
        },
        totalUsdtCompletadasMasPendientes: Math.round((todayBuyAmount + todayPendingBuyAmount) * 100) / 100,
        porEstado: byStatus,
      },
      listaComprasHoy: todayBuys.map((tx) => ({
        orderId: tx.binanceOrderId,
        amount: tx.amount,
        orderStatus: tx.orderStatus,
        createTime: tx.createTime,
        completedAt: tx.completedAt,
        createTimeLocal: new Date(tx.createTime).toLocaleString('es-VE', {
          timeZone: 'America/Caracas',
        }),
        completedAtLocal:
          tx.completedAt != null
            ? new Date(tx.completedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas' })
            : null,
      })),
    })
  } catch (error: any) {
    console.error('Error en debug-compras-hoy:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
