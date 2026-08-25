export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchAndPersistWalletBalance,
  isAuthorizedCronRequest,
} from '@/lib/wallet-balance-service'
import { BinanceGeoRestrictedError } from '@/lib/binance-errors'

/**
 * GET/POST /api/cron/wallet-balance
 * Cron de Vercel (o script local) para guardar saldo sin abrir el dashboard.
 * Auth: Authorization: Bearer CRON_SECRET  o  x-cron-secret: CRON_SECRET
 */
async function handleCron(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET no configurado' },
      { status: 503 }
    )
  }

  try {
    const balance = await fetchAndPersistWalletBalance()
    return NextResponse.json({
      success: true,
      source: 'cron',
      saved: balance.saved,
      usdtTotal: balance.usdtTotal,
      fundingTotal: balance.funding.total,
      fetchedAt: balance.fetchedAt,
      history: balance.history,
    })
  } catch (error: any) {
    if (error instanceof BinanceGeoRestrictedError || error?.code === 'BINANCE_GEO_RESTRICTED') {
      return NextResponse.json(
        {
          success: false,
          code: 'BINANCE_GEO_RESTRICTED',
          error: error.message,
          hint:
            'El cron en Vercel no puede hablar con Binance. Usa BINANCE_HTTP_PROXY o el script local: npm run snapshot:wallet',
        },
        { status: 503 }
      )
    }

    const status = typeof error?.status === 'number' ? error.status : 500
    console.error('Error en cron wallet-balance:', error)
    return NextResponse.json(
      {
        success: false,
        code: error?.code,
        error: error?.message || 'Error en cron de saldo',
      },
      { status }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request)
}

export async function POST(request: NextRequest) {
  return handleCron(request)
}
