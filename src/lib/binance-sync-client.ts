import axios from 'axios'
import { BINANCE_SYNC_INTERVAL_MS, BINANCE_SYNC_SERVER_MIN_GAP_MS } from '@/lib/sync-constants'

export type BinanceSyncResult = {
  success: boolean
  skipped?: boolean
  newTransactions?: number
  updatedTransactions?: number
  message?: string
}

let inFlight: Promise<BinanceSyncResult> | null = null
let lastRequestAt = 0

/**
 * Una sola cola de sync en el navegador: evita duplicar POST /api/binance/sync
 * (layout + dashboard + conexión disparaban lo mismo cada 2 min).
 */
export async function requestBinanceSync(options?: {
  force?: boolean
  backfillFrom?: string
}): Promise<BinanceSyncResult> {
  const now = Date.now()
  const force = options?.force === true
  const backfillFrom = options?.backfillFrom

  if (!force && !backfillFrom && now - lastRequestAt < BINANCE_SYNC_SERVER_MIN_GAP_MS) {
    return { success: true, skipped: true, message: 'Sync omitida (intervalo mínimo)' }
  }

  if (inFlight) {
    return inFlight
  }

  const body = backfillFrom ? { backfillFrom, force: force || undefined } : force ? { force: true } : {}

  inFlight = axios
    .post<BinanceSyncResult>('/api/binance/sync', body, {
      timeout: 120_000,
      headers: force ? { 'x-force-sync': '1' } : undefined,
    })
    .then((res) => {
      lastRequestAt = Date.now()
      const data = res.data
      if (data.success && !data.skipped) {
        window.dispatchEvent(new CustomEvent('binance-sync-completed'))
      }
      return data
    })
    .catch((err) => {
      if (axios.isAxiosError(err) && err.response?.data) {
        return err.response.data as BinanceSyncResult
      }
      return { success: false, message: 'Error de red al sincronizar' }
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

export function getBinanceSyncIntervalMs(): number {
  return BINANCE_SYNC_INTERVAL_MS
}
