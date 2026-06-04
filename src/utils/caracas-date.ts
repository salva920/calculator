/**
 * Límites del día actual en zona horaria Venezuela (America/Caracas, UTC-4).
 * Usado para que "hoy" en métricas y sync coincida con el día del usuario.
 */
export function getTodayBoundsCaracas(): { start: Date; end: Date } {
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return {
    start: new Date(dateStr + 'T00:00:00.000-04:00'),
    end: new Date(dateStr + 'T23:59:59.999-04:00'),
  }
}

/** yyyy-mm-dd en zona America/Caracas */
export function formatDateYmdCaracas(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Límites de un día calendario yyyy-mm-dd en America/Caracas */
export function parseDayBoundsCaracas(ymd: string): { start: Date; end: Date } {
  return {
    start: new Date(ymd + 'T00:00:00.000-04:00'),
    end: new Date(ymd + 'T23:59:59.999-04:00'),
  }
}

/**
 * Ventana API Binance (~29 días hacia atrás) con filtro "hoy" en Caracas.
 * COMPLETED se cuenta por hora de cierre dentro del día Caracas.
 */
export function getTodayHistoryApiBoundsCaracas(): {
  dayStart: Date
  dayEnd: Date
  apiStartMs: number
  apiEndMs: number
} {
  const { start: dayStart, end: dayEnd } = getTodayBoundsCaracas()
  const apiEndMs = Math.min(Date.now(), dayEnd.getTime())
  const apiStartMs = apiEndMs - 29 * 86_400_000
  return { dayStart, dayEnd, apiStartMs, apiEndMs }
}

export type CaracasDatePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'threeMonths'

/** Día anterior completo en America/Caracas */
export function getYesterdayBoundsCaracas(): { start: Date; end: Date } {
  const { start: todayStart } = getTodayBoundsCaracas()
  return {
    start: new Date(todayStart.getTime() - 86_400_000),
    end: new Date(todayStart.getTime() - 1),
  }
}

/** Ventana de fechas para filtros del dashboard (siempre en America/Caracas). */
export function getPeriodBoundsCaracas(period: CaracasDatePeriod): { start: Date; end: Date } {
  const { start: todayStart, end: todayEnd } = getTodayBoundsCaracas()
  switch (period) {
    case 'today':
      return { start: todayStart, end: todayEnd }
    case 'yesterday':
      return getYesterdayBoundsCaracas()
    case 'week': {
      const start = new Date(todayStart.getTime() - 7 * 86_400_000)
      return { start, end: todayEnd }
    }
    case 'month': {
      const start = new Date(todayStart)
      start.setMonth(start.getMonth() - 1)
      return { start, end: todayEnd }
    }
    case 'threeMonths': {
      const start = new Date(todayStart)
      start.setMonth(start.getMonth() - 3)
      return { start, end: todayEnd }
    }
  }
}

/**
 * Filtro Prisma: COMPLETED si createTime o completedAt cae en el rango;
 * pendientes por createTime. Coincide con la fecha mostrada en la tabla.
 */
/** COMPLETED cuenta si createTime o completedAt cae en [start, end] (Caracas). */
export function isCompletedInWindow(
  tx: { orderStatus: string; createTime: Date; completedAt?: Date | null },
  start: Date,
  end: Date
): boolean {
  const st = (tx.orderStatus || '').toString().toUpperCase()
  if (st !== 'COMPLETED') return false
  const startMs = start.getTime()
  const endMs = end.getTime()
  const inRange = (d: Date) => {
    const t = d.getTime()
    return t >= startMs && t <= endMs
  }
  if (inRange(new Date(tx.createTime))) return true
  if (tx.completedAt != null && inRange(new Date(tx.completedAt))) return true
  return false
}

export function buildTransactionWindowWhere(start: Date, end: Date) {
  return {
    OR: [
      {
        AND: [
          { orderStatus: 'COMPLETED' },
          {
            OR: [
              { completedAt: { gte: start, lte: end } },
              { createTime: { gte: start, lte: end } },
            ],
          },
        ],
      },
      {
        AND: [{ orderStatus: { not: 'COMPLETED' } }, { createTime: { gte: start, lte: end } }],
      },
    ],
  }
}

/**
 * Días calendario inclusivos desde entryYmd hasta ref (por defecto hoy), en Caracas.
 * entryYmd: "YYYY-MM-DD"
 */
export function inclusiveCalendarDaysCaracas(entryYmd: string, ref: Date = new Date()): number {
  const refYmd = formatDateYmdCaracas(ref)
  if (entryYmd > refYmd) return 1
  const parseUtcMidnight = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10))
    return Date.UTC(y, m - 1, d)
  }
  const a = parseUtcMidnight(entryYmd)
  const b = parseUtcMidnight(refYmd)
  const diff = Math.floor((b - a) / 86400000) + 1
  return Math.max(1, diff)
}
