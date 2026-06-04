/**
 * Límites del día calendario actual en UTC (00:00–23:59:59.999).
 * Preferir @/utils/caracas-date para métricas "hoy" y filtros del usuario en Venezuela.
 */
export function getTodayBoundsUtc(): { start: Date; end: Date } {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()
  return {
    start: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)),
    end: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)),
  }
}

/** yyyy-mm-dd del instante en UTC */
export function formatDateYmdUtc(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Binance limita el intervalo entre startTimestamp y endTimestamp (~30 días).
 * Pedimos ~29 días hacia atrás desde el instante de fin de consulta para incluir
 * órdenes creadas días antes pero completadas hoy (el filtro "hoy" UTC se aplica después).
 */
export function getTodayHistoryApiBoundsUtc(): {
  dayStart: Date
  dayEnd: Date
  apiStartMs: number
  apiEndMs: number
} {
  const { start: dayStart, end: dayEnd } = getTodayBoundsUtc()
  const apiEndMs = Math.min(Date.now(), dayEnd.getTime())
  const apiStartMs = apiEndMs - 29 * 86_400_000
  return { dayStart, dayEnd, apiStartMs, apiEndMs }
}
