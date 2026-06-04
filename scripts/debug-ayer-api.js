/**
 * Diagnóstico: ventas de ayer en BD vs filtro API vs Binance
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
    ymd: dateStr,
  }
}

function getYesterdayBoundsCaracas() {
  const { start: todayStart } = getTodayBoundsCaracas()
  return {
    start: new Date(todayStart.getTime() - 86_400_000),
    end: new Date(todayStart.getTime() - 1),
    ymd: new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(todayStart.getTime() - 86_400_000)),
  }
}

function buildWhere(start, end) {
  return {
    OR: [
      {
        AND: [
          { orderStatus: 'COMPLETED' },
          {
            OR: [
              { completedAt: { gte: start, lte: end } },
              { createTime: { gte: start, lte: end } },
            ],
          },
        ],
      },
      {
        AND: [{ orderStatus: { not: 'COMPLETED' } }, { createTime: { gte: start, lte: end } }],
      },
    ],
  }
}

async function main() {
  const today = getTodayBoundsCaracas()
  const yesterday = getYesterdayBoundsCaracas()

  console.log('\n=== Fechas Caracas ===')
  console.log('Hoy:', today.ymd, today.start.toISOString(), '->', today.end.toISOString())
  console.log('Ayer:', yesterday.ymd, yesterday.start.toISOString(), '->', yesterday.end.toISOString())

  const apiWhere = {
    AND: [{ tradeType: 'SELL' }, buildWhere(yesterday.start, yesterday.end)],
  }

  const apiRows = await prisma.binanceP2PTransaction.findMany({
    where: apiWhere,
    select: {
      binanceOrderId: true,
      amount: true,
      orderStatus: true,
      createTime: true,
      completedAt: true,
    },
    orderBy: { createTime: 'desc' },
  })

  const completed = apiRows.filter((t) => (t.orderStatus || '').toUpperCase() === 'COMPLETED')
  const usdt = completed.reduce((s, t) => s + t.amount, 0)

  // Todas las ventas COMPLETED con createTime en ayer (sin importar completedAt)
  const allSells = await prisma.binanceP2PTransaction.findMany({
    where: { tradeType: 'SELL', orderStatus: 'COMPLETED' },
    select: { binanceOrderId: true, amount: true, createTime: true, completedAt: true },
  })

  const inRange = (d, start, end) => {
    const t = d.getTime()
    return t >= start.getTime() && t <= end.getTime()
  }

  const byCreateOnly = allSells.filter((t) => inRange(new Date(t.createTime), yesterday.start, yesterday.end))
  const byApiLogic = allSells.filter((t) => {
    if (inRange(new Date(t.createTime), yesterday.start, yesterday.end)) return true
    if (t.completedAt && inRange(new Date(t.completedAt), yesterday.start, yesterday.end)) return true
    return false
  })

  // Ventas con createTime ayer pero completedAt fuera (podrían faltar si filtro mal)
  const createAyerCompleteOtro = allSells.filter(
    (t) =>
      inRange(new Date(t.createTime), yesterday.start, yesterday.end) &&
      t.completedAt &&
      !inRange(new Date(t.completedAt), yesterday.start, yesterday.end)
  )

  // Ventas createTime NO ayer pero completedAt ayer
  const completeAyerCreateOtro = allSells.filter(
    (t) =>
      t.completedAt &&
      inRange(new Date(t.completedAt), yesterday.start, yesterday.end) &&
      !inRange(new Date(t.createTime), yesterday.start, yesterday.end)
  )

  console.log('\n=== Resultados ===')
  console.log('API where (period=yesterday, SELL):', apiRows.length, 'filas |', completed.length, 'COMPLETED |', usdt.toFixed(2), 'USDT')
  console.log('BD: COMPLETED createTime ayer:', byCreateOnly.length, '|', byCreateOnly.reduce((s, t) => s + t.amount, 0).toFixed(2), 'USDT')
  console.log('BD: lógica isCompletedInWindow:', byApiLogic.length)
  console.log('create ayer + completed otro día:', createAyerCompleteOtro.length)
  console.log('create otro día + completed ayer:', completeAyerCreateOtro.length)

  // Ventas createTime ayer que NO pasan el where Prisma
  const apiIds = new Set(apiRows.map((t) => t.binanceOrderId))
  const missingFromApi = byCreateOnly.filter((t) => !apiIds.has(t.binanceOrderId))
  if (missingFromApi.length) {
    console.log('\n!!! Faltan en query API:', missingFromApi.length)
    missingFromApi.slice(0, 5).forEach((t) => {
      console.log(' ', t.binanceOrderId, t.amount, t.createTime, t.completedAt)
    })
  }

  // Binance directo
  try {
    const { decrypt } = require('../src/lib/crypto')
    const { BinanceAPI } = require('../src/lib/binance')
    const cred = await prisma.binanceCredentials.findFirst({ where: { isActive: true } })
    if (cred) {
      const api = new BinanceAPI(decrypt(cred.apiKey), decrypt(cred.apiSecret))
      const apiStart = yesterday.start.getTime() - 48 * 3600 * 1000
      const apiEnd = yesterday.end.getTime()
      const orders = await api.getUserP2PHistory('SELL', apiStart, apiEnd)
      const dayStartMs = yesterday.start.getTime()
      const dayEndMs = yesterday.end.getTime()
      let binanceCount = 0
      let binanceUsdt = 0
      for (const o of orders) {
        const st = (o.orderStatus || '').toUpperCase()
        if (st !== 'COMPLETED') continue
        const ct = Number(o.createTime)
        const eventMs =
          o.completionTimeMs != null && o.completionTimeMs > 0 ? o.completionTimeMs : ct
        if (inRange(new Date(ct), yesterday.start, yesterday.end) || (eventMs >= dayStartMs && eventMs <= dayEndMs)) {
          binanceCount++
          binanceUsdt += parseFloat(o.amount || 0)
        }
      }
      const createdYesterday = orders.filter((o) => {
        const ct = Number(o.createTime)
        return ct >= dayStartMs && ct <= dayEndMs && (o.orderStatus || '').toUpperCase() === 'COMPLETED'
      })
      console.log('\n=== Binance API (historial ampliado) ===')
      console.log('Órdenes SELL en respuesta API:', orders.length)
      console.log('COMPLETED createTime ayer (Binance):', createdYesterday.length)
      console.log('COMPLETED contadas (create o cierre ayer):', binanceCount, '|', binanceUsdt.toFixed(2), 'USDT')
      if (createdYesterday.length > byCreateOnly.length) {
        console.log('>>> Binance tiene MÁS ventas ayer que BD. Falta sincronizar:', createdYesterday.length - byCreateOnly.length)
      }
    }
  } catch (e) {
    console.log('\nBinance API:', e.message)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
