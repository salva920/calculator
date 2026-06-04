/** Compara suma ventas hoy: lógica vieja (solo completedAt) vs nueva (createTime o completedAt) */
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

function isCompleted(s) {
  return (s || '').toUpperCase() === 'COMPLETED'
}

function inRange(d, start, end) {
  const t = d.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function oldLogic(tx, start, end) {
  if (!isCompleted(tx.orderStatus)) return false
  const instant = tx.completedAt || tx.createTime
  return inRange(new Date(instant), start, end)
}

function newLogic(tx, start, end) {
  if (!isCompleted(tx.orderStatus)) return false
  if (inRange(new Date(tx.createTime), start, end)) return true
  if (tx.completedAt && inRange(new Date(tx.completedAt), start, end)) return true
  return false
}

async function main() {
  const { start, end } = getTodayBoundsCaracas()
  const sells = await prisma.binanceP2PTransaction.findMany({
    where: { tradeType: 'SELL', orderStatus: 'COMPLETED' },
    select: { amount: true, createTime: true, completedAt: true, orderStatus: true },
  })

  const oldSum = sells.filter((t) => oldLogic(t, start, end)).reduce((s, t) => s + t.amount, 0)
  const newSum = sells.filter((t) => newLogic(t, start, end)).reduce((s, t) => s + t.amount, 0)
  const onlyNew = sells.filter((t) => newLogic(t, start, end) && !oldLogic(t, start, end))
  const onlyOld = sells.filter((t) => oldLogic(t, start, end) && !newLogic(t, start, end))

  console.log('Viejo (solo completedAt):', oldSum.toFixed(2), 'USDT')
  console.log('Nuevo (createTime o completedAt):', newSum.toFixed(2), 'USDT')
  console.log('Solo en nuevo:', onlyNew.length, '| Solo en viejo:', onlyOld.length)
}

main().finally(() => prisma.$disconnect())
