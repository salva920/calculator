export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

/**
 * GET /api/binance/balance
 * Endpoint deshabilitado temporalmente para evitar consultas de saldo.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Consulta de saldo deshabilitada temporalmente',
    },
    { status: 410 }
  )
}
