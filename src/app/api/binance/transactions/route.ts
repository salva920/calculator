import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  buildTransactionWindowWhere,
  getPeriodBoundsCaracas,
  parseDayBoundsCaracas,
  type CaracasDatePeriod,
} from '@/utils/caracas-date'

const VALID_PERIODS = new Set<CaracasDatePeriod>(['today', 'yesterday', 'week', 'month', 'threeMonths'])

// Obtener transacciones P2P sincronizadas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawLimit = searchParams.get('limit')
    const parsedLimit = rawLimit ? parseInt(rawLimit, 10) : NaN
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    const period = searchParams.get('period') as CaracasDatePeriod | null
    const dateYmd = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const bankName = (searchParams.get('bankName') || '').trim()
    const tradeType = searchParams.get('tradeType') as 'BUY' | 'SELL' | null

    const conditions: any[] = []

    if (dateYmd && /^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
      const { start, end } = parseDayBoundsCaracas(dateYmd)
      conditions.push(buildTransactionWindowWhere(start, end))
    } else if (period && VALID_PERIODS.has(period)) {
      const { start, end } = getPeriodBoundsCaracas(period)
      conditions.push(buildTransactionWindowWhere(start, end))
    } else if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      conditions.push(buildTransactionWindowWhere(start, end))
    } else if (startDate && !endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      const { start, end } = parseDayBoundsCaracas(startDate)
      conditions.push(buildTransactionWindowWhere(start, end))
    } else if (startDate || endDate) {
      const ct: { gte?: Date; lte?: Date } = {}
      if (startDate) ct.gte = new Date(startDate)
      if (endDate) ct.lte = new Date(endDate)
      conditions.push({ createTime: ct })
    }

    if (tradeType) {
      conditions.push({ tradeType })
    }

    if (bankName) {
      conditions.push({
        OR: [
          {
            paymentMethod: {
              contains: bankName,
              mode: 'insensitive',
            },
          },
          {
            sellKyc: {
              is: {
                bankName: {
                  contains: bankName,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      })
    }

    const where =
      conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { AND: conditions }

    const transactions = await prisma.binanceP2PTransaction.findMany({
      where,
      include: {
        sellKyc: {
          select: {
            bankName: true,
          },
        },
      },
      orderBy: { createTime: 'desc' },
      ...(limit ? { take: limit } : {}),
    })

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    })
  } catch (error: any) {
    console.error('Error obteniendo transacciones P2P:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener transacciones',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
