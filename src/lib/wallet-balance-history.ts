import { prisma } from '@/lib/prisma'
import { formatDateYmdCaracas, getTodayBoundsCaracas } from '@/utils/caracas-date'

const prismaAny = prisma as any

export type WalletSnapshotInput = {
  fundingFree: number
  fundingLocked: number
  fundingFreeze: number
  fundingTotal: number
  spotUsdtTotal: number
  usdtTotal: number
  estimatedTotalUsdt: number
}

/**
 * Guarda / actualiza el historial diario de fondos (día Caracas).
 * Actualiza high/low del día en cada lectura.
 */
export async function upsertWalletBalanceDaily(input: WalletSnapshotInput) {
  const { start: todayStart } = getTodayBoundsCaracas()
  const dateYmd = formatDateYmdCaracas(todayStart)
  const now = new Date()

  const existing = await prismaAny.walletBalanceDaily.findUnique({
    where: { date: todayStart },
  })

  if (!existing) {
    return prismaAny.walletBalanceDaily.create({
      data: {
        date: todayStart,
        dateYmd,
        fundingFree: input.fundingFree,
        fundingLocked: input.fundingLocked,
        fundingFreeze: input.fundingFreeze,
        fundingTotal: input.fundingTotal,
        spotUsdtTotal: input.spotUsdtTotal,
        usdtTotal: input.usdtTotal,
        estimatedTotalUsdt: input.estimatedTotalUsdt,
        highUsdtTotal: input.usdtTotal,
        lowUsdtTotal: input.usdtTotal,
        samples: 1,
        lastCapturedAt: now,
      },
    })
  }

  return prismaAny.walletBalanceDaily.update({
    where: { id: existing.id },
    data: {
      fundingFree: input.fundingFree,
      fundingLocked: input.fundingLocked,
      fundingFreeze: input.fundingFreeze,
      fundingTotal: input.fundingTotal,
      spotUsdtTotal: input.spotUsdtTotal,
      usdtTotal: input.usdtTotal,
      estimatedTotalUsdt: input.estimatedTotalUsdt,
      highUsdtTotal: Math.max(existing.highUsdtTotal, input.usdtTotal),
      lowUsdtTotal: Math.min(existing.lowUsdtTotal, input.usdtTotal),
      samples: (existing.samples || 0) + 1,
      lastCapturedAt: now,
    },
  })
}

/** Máximo consolidado USDT en el mes calendario Caracas (yyyy-mm). */
export async function getMonthWalletHigh(ref: Date = new Date()) {
  const ymd = formatDateYmdCaracas(ref)
  const [y, m] = ymd.split('-')
  const prefix = `${y}-${m}-`

  const rows = await prismaAny.walletBalanceDaily.findMany({
    where: { dateYmd: { startsWith: prefix } },
    select: {
      dateYmd: true,
      highUsdtTotal: true,
      lowUsdtTotal: true,
      usdtTotal: true,
      fundingTotal: true,
      lastCapturedAt: true,
    },
    orderBy: { dateYmd: 'asc' },
  })

  if (!rows.length) {
    return {
      month: `${y}-${m}`,
      highUsdtTotal: null as number | null,
      highDateYmd: null as string | null,
      lowUsdtTotal: null as number | null,
      lowDateYmd: null as string | null,
      daysTracked: 0,
      days: [] as typeof rows,
    }
  }

  let high = rows[0]
  let low = rows[0]
  for (const row of rows) {
    if (row.highUsdtTotal > high.highUsdtTotal) high = row
    if (row.lowUsdtTotal < low.lowUsdtTotal) low = row
  }

  return {
    month: `${y}-${m}`,
    highUsdtTotal: high.highUsdtTotal as number,
    highDateYmd: high.dateYmd as string,
    lowUsdtTotal: low.lowUsdtTotal as number,
    lowDateYmd: low.dateYmd as string,
    daysTracked: rows.length,
    days: rows,
  }
}
