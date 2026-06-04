/**
 * Script de prueba: total de compras hoy (misma lógica que el dashboard).
 *
 * Ejecutar con el servidor parado o en otra terminal, desde la raíz del proyecto (p2p):
 *
 *   node scripts/check-compras-hoy.js
 *
 * Requiere: npm run db:generate (o haber ejecutado el proyecto antes) para que Prisma esté generado.
 * Usa la misma DATABASE_URL que la app.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function getTodayBoundsCaracas() {
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return {
    start: new Date(dateStr + 'T00:00:00.000-04:00'),
    end: new Date(dateStr + 'T23:59:59.999-04:00'),
  }
}

function isCompleted(status) {
  return (status || '').toString().toUpperCase() === 'COMPLETED'
}
function isCancelled(status) {
  return ['CANCELLED', 'CANCELLED_BY_SYSTEM'].includes((status || '').toString().toUpperCase())
}
function isInProgress(status) {
  return ['TRADING', 'BUYER_PAYED', 'APPEALING', 'PARTIAL_COMPLETED'].includes(
    (status || '').toString().toUpperCase()
  )
}

async function main() {
  const { start: todayStart, end: todayEnd } = getTodayBoundsCaracas()

  console.log('\n=== Diagnóstico: Compras hoy (America/Caracas) ===\n')
  console.log('Hoy (Caracas):', todayStart.toLocaleString('es-VE', { timeZone: 'America/Caracas' }), '->', todayEnd.toLocaleString('es-VE', { timeZone: 'America/Caracas' }))
  console.log('ISO:', todayStart.toISOString(), '->', todayEnd.toISOString())

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const transactions = await prisma.binanceP2PTransaction.findMany({
    where: { createTime: { gte: sixtyDaysAgo } },
    orderBy: { createTime: 'desc' },
    select: {
      binanceOrderId: true,
      tradeType: true,
      amount: true,
      orderStatus: true,
      createTime: true,
    },
  })

  const todayTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.createTime)
    return txDate >= todayStart && txDate <= todayEnd
  })

  const todayBuys = todayTransactions.filter((t) => t.tradeType === 'BUY')
  const todayCompletedBuys = todayBuys.filter((t) => isCompleted(t.orderStatus))
  const todayPendingBuys = todayBuys.filter(
    (t) => !isCompleted(t.orderStatus) && !isCancelled(t.orderStatus) && isInProgress(t.orderStatus)
  )
  const todayOtherBuys = todayBuys.filter(
    (t) =>
      !isCompleted(t.orderStatus) &&
      !isCancelled(t.orderStatus) &&
      !isInProgress(t.orderStatus)
  )

  const todayBuyAmount = todayCompletedBuys.reduce((s, t) => s + t.amount, 0)
  const todayPendingBuyAmount = todayPendingBuys.reduce((s, t) => s + t.amount, 0)
  const todayOtherAmount = todayOtherBuys.reduce((s, t) => s + t.amount, 0)

  console.log('\n--- Resumen ---')
  console.log('Transacciones en ventana (60 días):', transactions.length)
  console.log('Transacciones hoy (todas):', todayTransactions.length)
  console.log('Compras hoy (BUY):', todayBuys.length)

  console.log('\n--- Compras hoy por estado ---')
  console.log('Completadas (COMPLETED):', todayCompletedBuys.length, '->', todayBuyAmount.toFixed(2), 'USDT')
  console.log('Pendientes (TRADING, etc.):', todayPendingBuys.length, '->', todayPendingBuyAmount.toFixed(2), 'USDT')
  if (todayOtherBuys.length > 0) {
    console.log('Otros estados (no se suman en dashboard):', todayOtherBuys.length, '->', todayOtherAmount.toFixed(2), 'USDT')
    const byStatus = {}
    todayOtherBuys.forEach((t) => {
      const s = (t.orderStatus || '(vacío)').toString()
      byStatus[s] = (byStatus[s] || 0) + 1
    })
    console.log('  Estados:', byStatus)
  }

  console.log('\n--- Total que debería mostrar el dashboard ---')
  console.log('Completadas:', todayBuyAmount.toFixed(2), 'USDT')
  console.log('+ Pendientes:', todayPendingBuyAmount.toFixed(2), 'USDT')
  console.log('= Total compras hoy:', (todayBuyAmount + todayPendingBuyAmount).toFixed(2), 'USDT')

  if (todayBuys.length > 0) {
    console.log('\n--- Listado de compras hoy ---')
    todayBuys.forEach((t, i) => {
      console.log(
        `${i + 1}. ${t.binanceOrderId} | ${t.amount} USDT | ${(t.orderStatus || '').toString()} | ${new Date(t.createTime).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`
      )
    })
  }

  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
