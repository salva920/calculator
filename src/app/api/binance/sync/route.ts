export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decryptWithMeta, encrypt } from '@/lib/crypto'
import { BinanceAPI } from '@/lib/binance'
import { BinanceGeoRestrictedError } from '@/lib/binance-errors'
import { processAndSaveCycles } from '@/utils/cycle-processor'
import { getTodayBoundsCaracas, parseDayBoundsCaracas } from '@/utils/caracas-date'
import { invalidateMetricsCache } from '@/lib/metrics-cache'
import { BINANCE_SYNC_SERVER_MIN_GAP_MS } from '@/lib/sync-constants'
import { upsertBinanceOrder } from '@/lib/sync-order-upsert'
import { Prisma } from '@prisma/client'

const DEFAULT_BACKFILL_DAYS = 7
const SYNC_OVERLAP_MINUTES = 360 // 6 horas para cubrir retrasos y desfases
const MAX_P2034_RETRIES = 3
const BASE_RETRY_DELAY_MS = 150

function isWriteConflictError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  )
}

async function withWriteConflictRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0

  while (true) {
    try {
      return await operation()
    } catch (error) {
      if (!isWriteConflictError(error) || attempt >= MAX_P2034_RETRIES) {
        throw error
      }

      const delay = BASE_RETRY_DELAY_MS * 2 ** attempt
      await new Promise((resolve) => setTimeout(resolve, delay))
      attempt++
    }
  }
}

// Sincronizar transacciones P2P desde Binance
export async function POST(request: NextRequest) {
  try {
    let backfillFromYmd: string | null = null
    let forceSync = request.headers.get('x-force-sync') === '1'
    try {
      const body = await request.json()
      if (body?.backfillFrom && /^\d{4}-\d{2}-\d{2}$/.test(String(body.backfillFrom))) {
        backfillFromYmd = String(body.backfillFrom)
      }
      if (body?.force === true) forceSync = true
    } catch {
      // POST sin body (sync automático)
    }

    // Obtener credenciales activas
    const credentials = await prisma.binanceCredentials.findFirst({
      where: { isActive: true },
    })

    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay credenciales de Binance configuradas',
        },
        { status: 400 }
      )
    }

    if (!credentials.syncEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'La sincronización está deshabilitada',
        },
        { status: 400 }
      )
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
      return NextResponse.json(
        {
          success: false,
          code: 'CREDENTIALS_DECRYPT_FAILED',
          error:
            'No se pudieron leer las credenciales de Binance. En Vercel, ENCRYPTION_KEY debe ser exactamente la misma que en tu .env local al guardar las claves (o vuelve a guardar las credenciales en Conexión Binance).',
        },
        { status: 400 }
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

    if (!forceSync && !backfillFromYmd && credentials.lastSync) {
      const elapsed = Date.now() - new Date(credentials.lastSync).getTime()
      if (elapsed < BINANCE_SYNC_SERVER_MIN_GAP_MS) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: 'Sync omitida: intervalo mínimo',
          newTransactions: 0,
          updatedTransactions: 0,
        })
      }
    }

    const binanceAPI = new BinanceAPI(apiKey, apiSecret)

    // Sincronización incremental:
    // - Si existe lastSync: usar lastSync con solapamiento de seguridad.
    // - Si no existe: traer varios días hacia atrás (backfill inicial).
    // Esto evita perder transacciones cuando el sistema no se ejecuta por días.
    const { start: todayStart, end: todayEnd } = getTodayBoundsCaracas()
    const endTime = Date.now()
    const fallbackDays = Number(process.env.SYNC_BACKFILL_DAYS || DEFAULT_BACKFILL_DAYS)
    const overlapMs = SYNC_OVERLAP_MINUTES * 60 * 1000
    const fallbackMs = (Number.isFinite(fallbackDays) && fallbackDays > 0 ? fallbackDays : DEFAULT_BACKFILL_DAYS) * 24 * 60 * 60 * 1000
    // Re-consultar al menos 3 días hacia atrás (órdenes creadas antes pero cerradas en días recientes)
    const minSyncStartMs = todayStart.getTime() - 3 * 24 * 60 * 60 * 1000
    const incrementalStart = credentials.lastSync
      ? new Date(credentials.lastSync).getTime() - overlapMs
      : endTime - fallbackMs
    let startTime = Math.min(incrementalStart, minSyncStartMs)
    if (backfillFromYmd) {
      const { start: backfillStart } = parseDayBoundsCaracas(backfillFromYmd)
      startTime = Math.min(startTime, backfillStart.getTime())
    }

    // Obtener órdenes de compra y venta
    let buyOrders: any[] = []
    let sellOrders: any[] = []
    let geoRestricted = false

    try {
      buyOrders = await binanceAPI.getUserP2PHistory('BUY', startTime, endTime)
    } catch (error: any) {
      if (error instanceof BinanceGeoRestrictedError) {
        geoRestricted = true
      } else {
        console.error('Error obteniendo órdenes de compra:', error)
      }
    }

    try {
      sellOrders = await binanceAPI.getUserP2PHistory('SELL', startTime, endTime)
    } catch (error: any) {
      if (error instanceof BinanceGeoRestrictedError) {
        geoRestricted = true
      } else {
        console.error('Error obteniendo órdenes de venta:', error)
      }
    }

    if (geoRestricted && buyOrders.length === 0 && sellOrders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'BINANCE_GEO_RESTRICTED',
          error:
            'Binance bloquea las peticiones desde el servidor de Vercel (ubicación restringida). El historial de hoy no se puede traer desde la nube.',
          hint:
            'Opciones: (1) Abre la app en local con npm run dev desde Venezuela para sincronizar, (2) configura BINANCE_HTTP_PROXY en Vercel con un proxy en región permitida, o (3) ejecuta npm run sync:local en tu PC.',
        },
        { status: 503 }
      )
    }

    let syncedCount = 0
    let newTransactions = 0
    let updatedTransactions = 0

    for (const order of [...buyOrders, ...sellOrders]) {
      const result = await upsertBinanceOrder(order)
      if (result.synced) syncedCount++
      if (result.wasNew) newTransactions++
      else if (result.updated) updatedTransactions++
    }

    const cycleWindowStart = new Date()
    cycleWindowStart.setMonth(cycleWindowStart.getMonth() - 6)

    processAndSaveCycles(cycleWindowStart, todayStart, todayEnd).catch((err) =>
      console.error('Error procesando ciclos después de sync:', err)
    )

    // Actualizar última sincronización
    await withWriteConflictRetry(() =>
      prisma.binanceCredentials.update({
        where: { id: credentials.id },
        data: {
          lastSync: new Date(),
        },
      })
    )

    // Invalidar caché de métricas para que el dashboard muestre compras/ventas actualizadas
    invalidateMetricsCache()

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      synced: syncedCount,
      newTransactions,
      updatedTransactions,
    })
  } catch (error: any) {
    if (error instanceof BinanceGeoRestrictedError) {
      return NextResponse.json(
        {
          success: false,
          code: 'BINANCE_GEO_RESTRICTED',
          error: error.message,
          hint:
            'Sincroniza desde tu PC (npm run dev o npm run sync:local) o usa BINANCE_HTTP_PROXY en Vercel.',
        },
        { status: 503 }
      )
    }

    console.error('Error sincronizando transacciones:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al sincronizar transacciones',
        details: error.message,
      },
      { status: 503 }
    )
  }
}

