/**
 * Diagnóstico ventas hoy: BD vs filtro API (createTime / completedAt)
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

function matchesApiFilter(tx, start, end) {
  const st = (tx.orderStatus || '').toUpperCase()
  if (st === 'COMPLETED') {
    if (tx.completedAt && tx.completedAt >= start && tx.completedAt <= end) return true
    if (!tx.completedAt && tx.createTime >= start && tx.createTime <= end) return true
    return false
  }
  return tx.createTime >= start && tx.createTime <= end
}

function matchesByCreateTime(tx, start, end) {
  return tx.createTime >= start && tx.createTime <= end
}

async function main() {
  const { start, end } = getTodayBoundsCaracas()
  console.log('\n=== Ventas hoy (Caracas) ===')
  console.log(start.toISOString(), '->', end.toISOString())

  const allSells = await prisma.binanceP2PTransaction.findMany({
    where: { tradeType: 'SELL' },
    orderBy: { createTime: 'desc' },
    take: 500,
    select: {
      binanceOrderId: true,
      amount: true,
      orderStatus: true,
      createTime: true,
      completedAt: true,
    },
  })

  const byCreate = allSells.filter((t) => matchesByCreateTime(t, start, end))
  const byApi = allSells.filter((t) => matchesApiFilter(t, start, end))
  const completedByCreate = byCreate.filter((t) => (t.orderStatus || '').toUpperCase() === 'COMPLETED')
  const missingFromApi = byCreate.filter((t) => !matchesApiFilter(t, start, end))

  console.log('\nCOMPLETED por createTime hoy:', completedByCreate.length)
  console.log('Filtro API actual (lista):', byApi.filter((t) => (t.orderStatus || '').toUpperCase() === 'COMPLETED').length)
  console.log('En BD por createTime pero EXCLUIDAS por filtro API:', missingFromApi.length)

  if (missingFromApi.length) {
    console.log('\n--- Excluidas (createTime hoy, completedAt fuera de rango) ---')
    missingFromApi.forEach((t) => {
      console.log(
        t.binanceOrderId,
        '|',
        t.amount,
        'USDT |',
        t.orderStatus,
        '| create:',
        t.createTime.toISOString(),
        '| completed:',
        t.completedAt ? t.completedAt.toISOString() : 'null'
      )
    })
  }

  console.log('\n--- Todas ventas COMPLETED con createTime hoy ---')
  completedByCreate.forEach((t, i) => {
    console.log(
      `${i + 1}. ${t.binanceOrderId} | ${t.amount} USDT | create ${t.createTime.toLocaleString('es-VE', { timeZone: 'America/Caracas' })} | completed ${t.completedAt ? t.completedAt.toLocaleString('es-VE', { timeZone: 'America/Caracas' }) : 'null'}`
    )
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
