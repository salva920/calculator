/**
 * Uso: node scripts/ventas-por-dia.js 2026-05-22
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const ymd = process.argv[2] || '2026-05-22'
const start = new Date(ymd + 'T00:00:00.000-04:00')
const end = new Date(ymd + 'T23:59:59.999-04:00')

function inRange(d) {
  const t = d.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function countsCompleted(tx) {
  if ((tx.orderStatus || '').toUpperCase() !== 'COMPLETED') return false
  if (inRange(new Date(tx.createTime))) return true
  if (tx.completedAt && inRange(new Date(tx.completedAt))) return true
  return false
}

async function main() {
  const sells = await prisma.binanceP2PTransaction.findMany({
    where: { tradeType: 'SELL' },
    select: {
      amount: true,
      fiatAmount: true,
      orderStatus: true,
      createTime: true,
      completedAt: true,
      binanceOrderId: true,
    },
    orderBy: { createTime: 'asc' },
  })

  const day = sells.filter(countsCompleted)
  const usdt = day.reduce((s, t) => s + t.amount, 0)
  const bs = day.reduce((s, t) => s + t.fiatAmount, 0)

  console.log('\n=== Ventas completadas', ymd, '(hora Caracas) ===\n')
  console.log('Operaciones:', day.length)
  console.log('Total USDT:', usdt.toFixed(2))
  console.log('Total Bs.S:', bs.toLocaleString('es-VE', { maximumFractionDigits: 2 }))
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
