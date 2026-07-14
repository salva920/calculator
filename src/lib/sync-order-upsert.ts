import { prisma } from '@/lib/prisma'
import { calculateBankCommission, getPaymentCommission } from '@/lib/payment-commissions'

export type BinanceOrderPayload = {
  orderNumber: string
  advNo?: string
  tradeType: string
  asset?: string
  fiat?: string
  fiatAmount?: string
  amount?: string
  totalPrice?: string
  unitPrice?: string
  orderStatus?: string
  createTime: number | string
  completionTimeMs?: number | null
  commission?: string
  counterPartName?: string
  paymentMethod?: string
}

type ExistingOrder = {
  orderStatus: string
  completedAt: Date | null
  commission: number
  fiatAmount: number
  amount: number
  paymentMethod: string | null
  isSynced: boolean
} | null

function resolveCompletedAt(
  orderStatus: string,
  existing: ExistingOrder,
  createTimeMs: number,
  completionTimeMs: number | null | undefined
): Date | null {
  const st = (orderStatus || '').toString().toUpperCase()
  if (st !== 'COMPLETED') return null

  const apiMs =
    completionTimeMs != null && Number.isFinite(Number(completionTimeMs))
      ? Number(completionTimeMs)
      : null
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

function buildOrderData(order: BinanceOrderPayload, existing: ExistingOrder) {
  const orderStatus = (order.orderStatus || 'COMPLETED').toString().toUpperCase()
  const createTimeMs = Number(order.createTime) || Date.now()
  const completedAt = resolveCompletedAt(
    orderStatus,
    existing,
    createTimeMs,
    order.completionTimeMs ?? null
  )
  const paymentMethod = order.paymentMethod || ''
  const fiatAmount = parseFloat(order.fiatAmount || '0')
  const isSell = (order.tradeType || '').toUpperCase() === 'SELL'

  let bankCommission = 0
  let bankCommissionType: 'percentage' | 'fixed' = 'percentage'
  if (isSell) {
    const paymentConfig = getPaymentCommission(paymentMethod)
    bankCommission = calculateBankCommission(fiatAmount, paymentMethod)
    bankCommissionType = paymentConfig.commissionType as 'percentage' | 'fixed'
  }

  return {
    binanceOrderId: order.orderNumber,
    orderNumber: order.orderNumber,
    advNo: order.advNo || '',
    tradeType: order.tradeType,
    asset: order.asset || 'USDT',
    fiat: order.fiat || 'VES',
    fiatAmount,
    amount: parseFloat(order.amount || '0'),
    totalPrice: parseFloat(order.totalPrice || '0'),
    unitPrice: parseFloat(order.unitPrice || '0'),
    orderStatus,
    createTime: new Date(createTimeMs),
    completedAt,
    commission: parseFloat(order.commission || '0'),
    counterPartName: order.counterPartName || '',
    paymentMethod,
    bankCommission,
    bankCommissionType,
  }
}

export type UpsertOrderResult = {
  synced: boolean
  wasNew: boolean
  updated: boolean
}

export async function upsertBinanceOrder(order: BinanceOrderPayload): Promise<UpsertOrderResult> {
  const existing = await prisma.binanceP2PTransaction.findUnique({
    where: { binanceOrderId: order.orderNumber },
    select: {
      orderStatus: true,
      completedAt: true,
      commission: true,
      fiatAmount: true,
      amount: true,
      paymentMethod: true,
      isSynced: true,
    },
  })

  const orderData = buildOrderData(order, existing)
  const wasNew = !existing
  const statusChanged = existing?.orderStatus !== orderData.orderStatus
  const completedAtChanged =
    existing?.completedAt?.getTime() !== (orderData.completedAt?.getTime() ?? null)

  const needsUpdate =
    wasNew ||
    statusChanged ||
    completedAtChanged ||
    (existing &&
      (existing.commission !== orderData.commission ||
        existing.fiatAmount !== orderData.fiatAmount ||
        existing.amount !== orderData.amount ||
        existing.paymentMethod !== orderData.paymentMethod ||
        (existing.completedAt == null && orderData.orderStatus === 'COMPLETED')))

  if (!needsUpdate) {
    return { synced: true, wasNew: false, updated: false }
  }

  await prisma.binanceP2PTransaction.upsert({
    where: { binanceOrderId: order.orderNumber },
    create: orderData,
    update: {
      orderStatus: orderData.orderStatus,
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
      ...(statusChanged &&
      orderData.orderStatus === 'COMPLETED' &&
      existing &&
      !existing.isSynced
        ? { isSynced: false }
        : {}),
    },
  })

  if (
    statusChanged &&
    orderData.orderStatus === 'COMPLETED' &&
    existing &&
    existing.orderStatus !== 'COMPLETED' &&
    existing.isSynced
  ) {
    await prisma.binanceP2PTransaction.update({
      where: { binanceOrderId: order.orderNumber },
      data: { isSynced: false },
    })
  }

  return { synced: true, wasNew, updated: !wasNew }
}
