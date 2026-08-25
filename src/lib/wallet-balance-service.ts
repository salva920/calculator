import { prisma } from '@/lib/prisma'
import { decryptWithMeta, encrypt } from '@/lib/crypto'
import { BinanceAPI } from '@/lib/binance'
import { BinanceGeoRestrictedError } from '@/lib/binance-errors'
import {
  getMonthWalletHigh,
  upsertWalletBalanceDaily,
} from '@/lib/wallet-balance-history'

export type WalletBalancePayload = {
  usdt: { free: number; locked: number; total: number }
  funding: { free: number; locked: number; freeze: number; total: number }
  spot: {
    usdt: { free: number; locked: number; total: number }
    estimatedTotalUsdt: number
    assets: Array<{
      asset: string
      free: number
      locked: number
      total: number
      usdtValue: number
    }>
  }
  estimatedTotalUsdt: number
  usdtTotal: number
  wallet: string
  fetchedAt: string
  history: {
    month: string
    highUsdtTotal: number | null
    highDateYmd: string | null
    lowUsdtTotal: number | null
    lowDateYmd: string | null
    daysTracked: number
  } | null
  saved: boolean
}

/**
 * Consulta Spot+Funding en Binance y persiste el snapshot diario.
 */
export async function fetchAndPersistWalletBalance(): Promise<WalletBalancePayload> {
  const credentials = await prisma.binanceCredentials.findFirst({
    where: { isActive: true },
  })

  if (!credentials) {
    throw Object.assign(new Error('No hay credenciales de Binance configuradas'), {
      status: 400,
      code: 'NO_CREDENTIALS',
    })
  }

  let apiKey: string
  let apiSecret: string
  let needsCredentialReencrypt = false
  try {
    const keyResult = decryptWithMeta(credentials.apiKey)
    const secretResult = decryptWithMeta(credentials.apiSecret)
    apiKey = keyResult.value
    apiSecret = secretResult.value
    needsCredentialReencrypt = keyResult.usedLegacySalt || secretResult.usedLegacySalt
  } catch {
    throw Object.assign(
      new Error(
        'No se pudieron leer las credenciales. Verifica ENCRYPTION_KEY o vuelve a guardarlas en Conexión Binance.'
      ),
      { status: 400, code: 'CREDENTIALS_DECRYPT_FAILED' }
    )
  }

  if (needsCredentialReencrypt) {
    await prisma.binanceCredentials.update({
      where: { id: credentials.id },
      data: {
        apiKey: encrypt(apiKey),
        apiSecret: encrypt(apiSecret),
      },
    })
  }

  const binanceAPI = new BinanceAPI(apiKey, apiSecret)
  let summary
  try {
    summary = await binanceAPI.getCombinedWalletSummary()
  } catch (error) {
    if (error instanceof BinanceGeoRestrictedError) {
      throw Object.assign(error, { status: 503, code: 'BINANCE_GEO_RESTRICTED' })
    }
    throw error
  }

  if (!summary) {
    throw Object.assign(new Error('No se pudo obtener el saldo de Binance'), {
      status: 502,
      code: 'BALANCE_FETCH_FAILED',
    })
  }

  const estimatedTotalUsdt =
    summary.usdtTotal + (summary.spot.estimatedTotalUsdt - summary.spot.usdt.total)

  let saved = false
  try {
    await upsertWalletBalanceDaily({
      fundingFree: summary.funding.free,
      fundingLocked: summary.funding.locked,
      fundingFreeze: summary.funding.freeze,
      fundingTotal: summary.funding.total,
      spotUsdtTotal: summary.spot.usdt.total,
      usdtTotal: summary.usdtTotal,
      estimatedTotalUsdt,
    })
    saved = true
  } catch (err) {
    console.error('Error guardando historial de fondos:', err)
  }

  const monthStats = await getMonthWalletHigh().catch(() => null)

  return {
    usdt: {
      free: summary.funding.free + summary.spot.usdt.free,
      locked: summary.funding.locked + summary.spot.usdt.locked,
      total: summary.usdtTotal,
    },
    funding: summary.funding,
    spot: {
      usdt: summary.spot.usdt,
      estimatedTotalUsdt: summary.spot.estimatedTotalUsdt,
      assets: summary.spot.assets.slice(0, 10),
    },
    estimatedTotalUsdt,
    usdtTotal: summary.usdtTotal,
    wallet: 'SPOT+FUNDING',
    fetchedAt: new Date().toISOString(),
    history: monthStats
      ? {
          month: monthStats.month,
          highUsdtTotal: monthStats.highUsdtTotal,
          highDateYmd: monthStats.highDateYmd,
          lowUsdtTotal: monthStats.lowUsdtTotal,
          lowDateYmd: monthStats.lowDateYmd,
          daysTracked: monthStats.daysTracked,
        }
      : null,
    saved,
  }
}

export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) return false

  const auth = request.headers.get('authorization') || ''
  if (auth === `Bearer ${cronSecret}`) return true

  const headerSecret = request.headers.get('x-cron-secret') || ''
  return headerSecret === cronSecret
}
