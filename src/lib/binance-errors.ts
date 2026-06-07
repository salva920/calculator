export class BinanceGeoRestrictedError extends Error {
  readonly code = 'BINANCE_GEO_RESTRICTED' as const

  constructor(message?: string) {
    super(
      message ||
        'Binance bloquea las peticiones desde la ubicación del servidor (Vercel). Sincroniza desde tu PC o usa un proxy en región permitida.'
    )
    this.name = 'BinanceGeoRestrictedError'
  }
}

export function isBinanceGeoRestrictedMessage(msg: unknown): boolean {
  if (typeof msg !== 'string') return false
  const lower = msg.toLowerCase()
  return (
    lower.includes('restricted location') ||
    lower.includes('service unavailable from a restricted') ||
    lower.includes('eligibility')
  )
}

export function throwIfBinanceGeoRestricted(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return
  const data = payload as { msg?: string; message?: string; code?: number | string }
  const msg = data.msg || data.message || ''
  if (isBinanceGeoRestrictedMessage(msg)) {
    throw new BinanceGeoRestrictedError(msg)
  }
}
