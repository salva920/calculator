export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { fetchAndPersistWalletBalance } from '@/lib/wallet-balance-service'
import { BinanceGeoRestrictedError } from '@/lib/binance-errors'

/**
 * GET /api/binance/balance
 * Spot + Funding, y guarda historial diario (high/low del día Caracas).
 */
export async function GET() {
  try {
    const balance = await fetchAndPersistWalletBalance()
    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error: any) {
    if (error instanceof BinanceGeoRestrictedError || error?.code === 'BINANCE_GEO_RESTRICTED') {
      return NextResponse.json(
        {
          success: false,
          code: 'BINANCE_GEO_RESTRICTED',
          error: error.message,
          hint:
            'Consulta el saldo desde tu PC (npm run dev) o configura BINANCE_HTTP_PROXY en Vercel.',
        },
        { status: 503 }
      )
    }

    const status = typeof error?.status === 'number' ? error.status : 500
    console.error('Error en /api/binance/balance:', error)
    return NextResponse.json(
      {
        success: false,
        code: error?.code,
        error: error?.message || 'Error al obtener saldo',
      },
      { status }
    )
  }
}
