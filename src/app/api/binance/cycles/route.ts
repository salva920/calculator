export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDateYmdCaracas, getTodayBoundsCaracas, parseDayBoundsCaracas } from '@/utils/caracas-date'
import { isBuildTimeDynamicError } from '@/lib/api-route'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // Formato: YYYY-MM-DD o 'today'

    let dayStart: Date
    let dayEnd: Date

    if (dateParam === 'today' || !dateParam) {
      const b = getTodayBoundsCaracas()
      dayStart = b.start
      dayEnd = b.end
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const b = parseDayBoundsCaracas(dateParam)
      dayStart = b.start
      dayEnd = b.end
    } else {
      return NextResponse.json(
        { success: false, error: 'Parámetro date inválido (use today o YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const txInDayWindow = (tx: {
      createTime: Date
      orderStatus: string
      completedAt: Date | null
    }) => {
      const isComp = (tx.orderStatus || '').toUpperCase() === 'COMPLETED'
      const t =
        isComp && tx.completedAt != null ? new Date(tx.completedAt) : new Date(tx.createTime)
      return t >= dayStart && t <= dayEnd
    }

    const cycles = await prisma.p2PCycle.findMany({
      where: {
        completedAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    })

    const enrichedCycles = await Promise.all(
      cycles.map(async (cycle) => {
        const sellTxs = await prisma.binanceP2PTransaction.findMany({
          where: { id: { in: cycle.sellTransactions } },
        })
        const buyTxs = await prisma.binanceP2PTransaction.findMany({
          where: { id: { in: cycle.buyTransactions } },
        })

        return {
          ...cycle,
          sellTransactionsDetails: sellTxs.filter((tx) => txInDayWindow(tx)),
          buyTransactionsDetails: buyTxs.filter((tx) => txInDayWindow(tx)),
        }
      })
    )

    return NextResponse.json({
      success: true,
      cycles: enrichedCycles,
      count: enrichedCycles.length,
      date: formatDateYmdCaracas(dayStart),
    })
  } catch (error: unknown) {
    if (!isBuildTimeDynamicError(error)) {
      console.error('Error obteniendo ciclos:', error)
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener ciclos',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
