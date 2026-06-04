/**
 * Compara ventas de ayer: BD vs Binance API (paginación completa)
 */
const crypto = require('crypto')
const axios = require('axios')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  return crypto.scryptSync(key.length >= 32 ? key : key.padEnd(32, '!'), 'salt', 32)
}

function decrypt(encryptedText) {
  const key = getEncryptionKey()
  const [ivHex, tagHex, enc] = encryptedText.split(':')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(enc, 'hex', 'utf8') + decipher.final('utf8')
}

function getYesterdayBoundsCaracas() {
  const now = new Date()
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const todayStart = new Date(todayStr + 'T00:00:00.000-04:00')
  const start = new Date(todayStart.getTime() - 86_400_000)
  const end = new Date(todayStart.getTime() - 1)
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(start)
  return { start, end, ymd }
}

async function getServerTime() {
  const r = await axios.get('https://api.binance.com/api/v3/time', { timeout: 10000 })
  return r.data.serverTime
}

async function fetchAllSells(apiKey, apiSecret, startMs, endMs) {
  const acc = []
  const serverTime = await getServerTime()
  for (let page = 1; page <= 500; page++) {
    const params = {
      recvWindow: '10000',
      timestamp: String(serverTime),
      tradeType: 'SELL',
      page: String(page),
      rows: '100',
    }
    if (startMs != null) params.startTimestamp = String(startMs)
    if (endMs != null) params.endTimestamp = String(endMs)
    const qs = new URLSearchParams(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))).toString()
    const sig = crypto.createHmac('sha256', apiSecret).update(qs).digest('hex')
    const url = `https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory?${qs}&signature=${sig}`
    const r = await axios.get(url, { headers: { 'X-MBX-APIKEY': apiKey }, timeout: 20000 })
    const rows = r.data?.data || []
    if (!rows.length) break
    acc.push(...rows)
    if (!rows.length) break
  }
  return acc
}

function inRange(ms, start, end) {
  return ms >= start.getTime() && ms <= end.getTime()
}

async function main() {
  const { start, end, ymd } = getYesterdayBoundsCaracas()
  console.log('\nAyer Caracas:', ymd)

  const dbSells = await prisma.binanceP2PTransaction.findMany({
    where: { tradeType: 'SELL', orderStatus: 'COMPLETED' },
    select: { binanceOrderId: true, amount: true, createTime: true, completedAt: true },
  })
  const dbYesterday = dbSells.filter((t) => {
    const ct = new Date(t.createTime).getTime()
    return inRange(ct, start, end)
  })
  const dbIds = new Set(dbYesterday.map((t) => t.binanceOrderId))

  const cred = await prisma.binanceCredentials.findFirst({ where: { isActive: true } })
  if (!cred) {
    console.log('Sin credenciales')
    return
  }

  const apiKey = decrypt(cred.apiKey)
  const apiSecret = decrypt(cred.apiSecret)

  // Ventana API: 3 días antes del fin de ayer hasta fin de ayer (captura creadas antes, cerradas ayer)
  const apiStart = start.getTime() - 3 * 86_400_000
  const apiEnd = end.getTime()
  console.log('Consultando Binance', new Date(apiStart).toISOString(), '->', new Date(apiEnd).toISOString())

  const orders = await fetchAllSells(apiKey, apiSecret, apiStart, apiEnd)
  console.log('Filas API (SELL ventana 3d con timestamps):', orders.length)

  // Sin filtro de fecha en API (solo paginación) — luego filtrar por createTime

  const completedCreateYesterday = orders.filter((o) => {
    const st = (o.orderStatus || '').toUpperCase()
    const ct = Number(o.createTime)
    return st === 'COMPLETED' && inRange(ct, start, end)
  })

  const missingInDb = completedCreateYesterday.filter(
    (o) => !dbIds.has(o.orderNumber || o.orderNo)
  )

  const usdtDb = dbYesterday.reduce((s, t) => s + t.amount, 0)
  const usdtBinance = completedCreateYesterday.reduce((s, o) => s + parseFloat(o.amount || 0), 0)

  console.log('\nCOMPLETED createTime ayer:')
  console.log('  BD:', dbYesterday.length, '|', usdtDb.toFixed(2), 'USDT')
  console.log('  Binance:', completedCreateYesterday.length, '|', usdtBinance.toFixed(2), 'USDT')
  console.log('  Faltan en BD:', missingInDb.length)

  // Paginación: ¿hay página 2?
  for (let pg = 1; pg <= 3; pg++) {
    const params = {
      recvWindow: '10000',
      timestamp: String(await getServerTime()),
      tradeType: 'SELL',
      page: String(pg),
      rows: '100',
      startTimestamp: String(start.getTime()),
      endTimestamp: String(end.getTime()),
    }
    const qs = new URLSearchParams(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))).toString()
    const sig = crypto.createHmac('sha256', apiSecret).update(qs).digest('hex')
    const url = `https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory?${qs}&signature=${sig}`
    const r = await axios.get(url, { headers: { 'X-MBX-APIKEY': apiKey }, timeout: 20000 })
    const rows = r.data?.data || []
    console.log(`Página ${pg} (ayer):`, rows.length, 'filas')
    if (!rows.length) break
  }

  if (missingInDb.length) {
    console.log('\nPrimeras órdenes en Binance que NO están en BD:')
    missingInDb.slice(0, 15).forEach((o) => {
      console.log(
        ' ',
        o.orderNumber || o.orderNo,
        parseFloat(o.amount || 0).toFixed(2),
        'USDT',
        new Date(Number(o.createTime)).toLocaleString('es-VE', { timeZone: 'America/Caracas' })
      )
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
