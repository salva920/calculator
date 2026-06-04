import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { BinanceAPI } from '@/lib/binance'
import { calculateProfits } from '@/utils/calculations'
import { calculateBankCommission, getPaymentCommission } from '@/lib/payment-commissions'
import { processAndSaveCycles } from '@/utils/cycle-processor'
import { getTodayBoundsCaracas, parseDayBoundsCaracas } from '@/utils/caracas-date'
import { invalidateMetricsCache } from '@/lib/metrics-cache'
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

/** Momento contable de cierre COMPLETED (sync / Binance). */
function resolveCompletedAt(
  orderStatus: string,
  existing: { orderStatus: string; completedAt: Date | null } | null,
  createTimeMs: number,
  completionTimeMs: number | null | undefined
): Date | null {
  const st = (orderStatus || '').toString().toUpperCase()
  if (st !== 'COMPLETED') return null

  const apiMs =
    completionTimeMs != null && Number.isFinite(Number(completionTimeMs)) ? Number(completionTimeMs) : null
  if (apiMs != null) return new Date(apiMs)

  const prevSt = (existing?.orderStatus || '').toString().toUpperCase()
  if (existing?.completedAt && prevSt === 'COMPLETED') {
    return existing.completedAt
  }
  if (existing && prevSt !== 'COMPLETED') {
    return new Date()
  }
  return new Date(createTimeMs)
}

// Sincronizar transacciones P2P desde Binance
export async function POST(request: NextRequest) {
  try {
    let backfillFromYmd: string | null = null
    try {
      const body = await request.json()
      if (body?.backfillFrom && /^\d{4}-\d{2}-\d{2}$/.test(String(body.backfillFrom))) {
        backfillFromYmd = String(body.backfillFrom)
      }
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

    // Desencriptar credenciales
    const apiKey = decrypt(credentials.apiKey)
    const apiSecret = decrypt(credentials.apiSecret)

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
    
    try {
      buyOrders = await binanceAPI.getUserP2PHistory('BUY', startTime, endTime)
    } catch (error: any) {
      console.error('Error obteniendo órdenes de compra:', error)
      // Continuar con órdenes de venta aunque falle compra
    }
    
    try {
      sellOrders = await binanceAPI.getUserP2PHistory('SELL', startTime, endTime)
    } catch (error: any) {
      console.error('Error obteniendo órdenes de venta:', error)
    }

    let syncedCount = 0
    let newTransactions = 0
    let updatedTransactions = 0

    // Procesar órdenes de compra
    for (const order of buyOrders) {
      const existing = await prisma.binanceP2PTransaction.findUnique({
        where: { binanceOrderId: order.orderNumber },
      })

      // Normalizar estado a mayúsculas para que COMPLETED/Completed coincidan con las métricas
      const orderStatus = (order.orderStatus || 'COMPLETED').toString().toUpperCase()
      const createTimeMs = Number(order.createTime) || Date.now()
      const completedAt = resolveCompletedAt(orderStatus, existing, createTimeMs, order.completionTimeMs ?? null)
      const orderData = {
        binanceOrderId: order.orderNumber,
        orderNumber: order.orderNumber,
        advNo: order.advNo || '',
        tradeType: order.tradeType,
        asset: order.asset || 'USDT',
        fiat: order.fiat || 'VES',
        fiatAmount: parseFloat(order.fiatAmount || '0'),
        amount: parseFloat(order.amount || '0'),
        totalPrice: parseFloat(order.totalPrice || '0'),
        unitPrice: parseFloat(order.unitPrice || '0'),
        orderStatus: orderStatus,
        createTime: new Date(createTimeMs),
        completedAt,
        commission: parseFloat(order.commission || '0'),
        counterPartName: order.counterPartName || '',
        paymentMethod: order.paymentMethod || '',
        bankCommission: 0,
        bankCommissionType: 'percentage' as const,
      }

      // Usar upsert para evitar errores de restricción única
      const wasNew = !existing
      const statusChanged = existing?.orderStatus !== orderStatus
      const completedAtChanged =
        existing?.completedAt?.getTime() !== (completedAt?.getTime() ?? null)

      const needsUpdate = wasNew || statusChanged || completedAtChanged ||
                         (existing && (
                           existing.commission !== orderData.commission ||
                           existing.fiatAmount !== orderData.fiatAmount ||
                           existing.amount !== orderData.amount ||
                           existing.paymentMethod !== orderData.paymentMethod ||
                           (existing.completedAt == null && orderStatus === 'COMPLETED')
                         ))

      if (needsUpdate) {
        await prisma.binanceP2PTransaction.upsert({
          where: { binanceOrderId: order.orderNumber },
          create: orderData,
          update: {
            orderStatus: orderStatus,
            commission: orderData.commission,
            fiatAmount: orderData.fiatAmount,
            amount: orderData.amount,
            unitPrice: orderData.unitPrice,
            totalPrice: orderData.totalPrice,
            counterPartName: orderData.counterPartName,
            paymentMethod: orderData.paymentMethod,
            bankCommission: orderData.bankCommission,
            bankCommissionType: orderData.bankCommissionType,
            completedAt: orderData.completedAt,
            // Si el estado cambió a COMPLETED y antes no estaba sincronizado, resetear isSynced
            ...(statusChanged && orderStatus === 'COMPLETED' && existing && !existing.isSynced ? { isSynced: false } : {}),
          },
        })
        
        if (wasNew) {
          newTransactions++
        } else {
          updatedTransactions++
        }
        
        // Si cambió a COMPLETED, puede que necesite reprocesarse
        if (statusChanged && orderStatus === 'COMPLETED' && existing && existing.orderStatus !== 'COMPLETED') {
          // Marcar para reprocesar si estaba marcado como sincronizado
          if (existing.isSynced) {
            await prisma.binanceP2PTransaction.update({
              where: { binanceOrderId: order.orderNumber },
              data: { isSynced: false },
            })
          }
        }
      }
      syncedCount++
    }

    // Procesar órdenes de venta
    for (const order of sellOrders) {
      const existing = await prisma.binanceP2PTransaction.findUnique({
        where: { binanceOrderId: order.orderNumber },
      })

      const orderStatus = (order.orderStatus || 'COMPLETED').toString().toUpperCase()
      const fiatAmount = parseFloat(order.fiatAmount || '0')
      const paymentMethod = order.paymentMethod || ''
      
      // Calcular comisión bancaria según el método de pago
      const paymentConfig = getPaymentCommission(paymentMethod)
      const bankCommissionAmount = calculateBankCommission(fiatAmount, paymentMethod)

      const createTimeMs = Number(order.createTime) || Date.now()
      const completedAt = resolveCompletedAt(orderStatus, existing, createTimeMs, order.completionTimeMs ?? null)
      
      const orderData = {
        binanceOrderId: order.orderNumber,
        orderNumber: order.orderNumber,
        advNo: order.advNo || '',
        tradeType: order.tradeType,
        asset: order.asset || 'USDT',
        fiat: order.fiat || 'VES',
        fiatAmount: fiatAmount,
        amount: parseFloat(order.amount || '0'),
        totalPrice: parseFloat(order.totalPrice || '0'),
        unitPrice: parseFloat(order.unitPrice || '0'),
        orderStatus: orderStatus,
        createTime: new Date(createTimeMs),
        completedAt,
        commission: parseFloat(order.commission || '0'),
        counterPartName: order.counterPartName || '',
        paymentMethod: paymentMethod,
        bankCommission: bankCommissionAmount,
        bankCommissionType: paymentConfig.commissionType as 'percentage' | 'fixed',
      }

      // Usar upsert para evitar errores de restricción única
      const wasNew = !existing
      const statusChanged = existing?.orderStatus !== orderStatus
      const completedAtChanged =
        existing?.completedAt?.getTime() !== (completedAt?.getTime() ?? null)

      const needsUpdate = wasNew || statusChanged || completedAtChanged ||
                         (existing && (
                           existing.commission !== orderData.commission ||
                           existing.fiatAmount !== orderData.fiatAmount ||
                           existing.amount !== orderData.amount ||
                           existing.paymentMethod !== orderData.paymentMethod ||
                           (existing.completedAt == null && orderStatus === 'COMPLETED')
                         ))

      if (needsUpdate) {
        await prisma.binanceP2PTransaction.upsert({
          where: { binanceOrderId: order.orderNumber },
          create: orderData,
          update: {
            orderStatus: orderStatus,
            commission: orderData.commission,
            fiatAmount: orderData.fiatAmount,
            amount: orderData.amount,
            unitPrice: orderData.unitPrice,
            totalPrice: orderData.totalPrice,
            counterPartName: orderData.counterPartName,
            paymentMethod: orderData.paymentMethod,
            bankCommission: orderData.bankCommission,
            bankCommissionType: orderData.bankCommissionType,
            completedAt: orderData.completedAt,
            // Si el estado cambió a COMPLETED y antes no estaba sincronizado, resetear isSynced
            ...(statusChanged && orderStatus === 'COMPLETED' && existing && !existing.isSynced ? { isSynced: false } : {}),
          },
        })
        
        if (wasNew) {
          newTransactions++
        } else {
          updatedTransactions++
        }
        
        // Si cambió a COMPLETED, puede que necesite reprocesarse
        if (statusChanged && orderStatus === 'COMPLETED' && existing && existing.orderStatus !== 'COMPLETED') {
          // Marcar para reprocesar si estaba marcado como sincronizado
          if (existing.isSynced) {
            await prisma.binanceP2PTransaction.update({
              where: { binanceOrderId: order.orderNumber },
              data: { isSynced: false },
            })
          }
        }
      }
      syncedCount++
    }

    // Procesar ciclos de compra-venta para calcular ganancias (función antigua, mantener por compatibilidad)
    await processP2PCycles()
    
    // Procesar y guardar ciclos detallados (nueva función optimizada)
    // Ejecutar en background para no bloquear la respuesta de sync
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
    console.error('Error sincronizando transacciones:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al sincronizar transacciones',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Función para procesar ciclos de compra-venta y calcular ganancias
async function processP2PCycles() {
  try {
    // Obtener transacciones no procesadas O que cambiaron recientemente a COMPLETED
    // Incluimos transacciones que:
    // 1. No están sincronizadas Y están completadas
    // 2. O están completadas y fueron actualizadas recientemente (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const unprocessedTransactions = await prisma.binanceP2PTransaction.findMany({
      where: {
        orderStatus: 'COMPLETED',
        OR: [
          { isSynced: false },
          { 
            updatedAt: { gte: fiveMinutesAgo },
            isSynced: true // Reprocesar si fue actualizada recientemente
          }
        ]
      },
      orderBy: {
        createTime: 'asc',
      },
    })

    // Agrupar por fecha y procesar ciclos
    const transactionsByDate = new Map<string, typeof unprocessedTransactions>()

    for (const transaction of unprocessedTransactions) {
      const dateKey = transaction.createTime.toISOString().split('T')[0]
      if (!transactionsByDate.has(dateKey)) {
        transactionsByDate.set(dateKey, [])
      }
      transactionsByDate.get(dateKey)!.push(transaction)
    }

    // Procesar cada día
    for (const [dateKey, transactions] of Array.from(transactionsByDate.entries())) {
      const buyTransactions = transactions.filter((t: typeof transactions[0]) => t.tradeType === 'BUY')
      const sellTransactions = transactions.filter((t: typeof transactions[0]) => t.tradeType === 'SELL')

      // Emparejar compras con ventas para calcular ganancias
      for (const buy of buyTransactions) {
        // Buscar venta correspondiente (misma cantidad o similar)
        const matchingSell = sellTransactions.find(
          (sell: typeof transactions[0]) =>
            Math.abs(sell.amount - buy.amount) < 0.01 && // Misma cantidad de USDT
            sell.createTime > buy.createTime && // Venta después de compra
            !sell.isSynced
        )

        if (matchingSell) {
          // Calcular ganancias
          const formData = {
            usdtAmount: buy.amount,
            buyPrice: buy.unitPrice,
            sellPrice: matchingSell.unitPrice,
            buyPriceType: 'fixed' as const,
            sellPriceType: 'fixed' as const,
            buyPriceMargin: 100,
            sellPriceMargin: 100,
            bankCommission: buy.bankCommission || 2,
            bankCommissionType: (buy.bankCommissionType || 'percentage') as 'percentage' | 'fixed',
            binanceCommission: buy.commission + matchingSell.commission,
            cyclesPerDay: 1,
            workingDaysPerMonth: 30,
            currentOrders: 0,
            targetOrders: 0,
            currentBtc30Days: 0,
            targetBtc30Days: 0,
            currentBtcTotal: 0,
            targetBtcTotal: 0,
          }

          const results = calculateProfits(formData)

          // Crear transacción diaria
          await prisma.dailyTransaction.create({
            data: {
              date: new Date(dateKey),
              usdtAmount: formData.usdtAmount,
              buyPrice: formData.buyPrice,
              sellPrice: formData.sellPrice,
              buyPriceType: formData.buyPriceType,
              sellPriceType: formData.sellPriceType,
              bankCommission: formData.bankCommission,
              bankCommissionType: formData.bankCommissionType,
              binanceCommission: formData.binanceCommission,
              grossProfit: results.grossProfit,
              netProfit: results.netProfit,
              totalCosts: results.totalCosts,
              profitMargin: results.profitMargin,
              roi: results.roi,
              cyclesPerDay: formData.cyclesPerDay,
              workingDaysPerMonth: formData.workingDaysPerMonth,
              currentOrders: formData.currentOrders,
              targetOrders: formData.targetOrders,
              currentBtc30Days: formData.currentBtc30Days,
              targetBtc30Days: formData.targetBtc30Days,
              currentBtcTotal: formData.currentBtcTotal,
              targetBtcTotal: formData.targetBtcTotal,
              source: 'binance_sync',
              binanceOrderId: `${buy.binanceOrderId}-${matchingSell.binanceOrderId}`,
            },
          })

          // Marcar como procesadas
          await prisma.binanceP2PTransaction.update({
            where: { id: buy.id },
            data: { isSynced: true, syncedAt: new Date() },
          })

          await prisma.binanceP2PTransaction.update({
            where: { id: matchingSell.id },
            data: { isSynced: true, syncedAt: new Date() },
          })
        }
      }
    }
  } catch (error) {
    console.error('Error procesando ciclos P2P:', error)
  }
}

