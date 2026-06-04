/**
 * Diagnóstico: verificar si Binance devuelve nombre de banco/método de pago
 * para órdenes P2P del usuario.
 *
 * Uso:
 *   node scripts/check-binance-bank-field.js
 *
 * Requisitos:
 *   - DATABASE_URL configurada
 *   - ENCRYPTION_KEY correcta (la misma usada para guardar credenciales)
 */

const crypto = require('crypto')
const axios = require('axios')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY debe tener al menos 32 caracteres')
  }
  return crypto.scryptSync(key, 'salt', 32)
}

function decrypt(encryptedText) {
  const key = getEncryptionKey()
  const parts = (encryptedText || '').split(':')
  if (parts.length !== 3) {
    throw new Error('Formato de texto encriptado inválido')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function generateSignature(queryString, apiSecret) {
  return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex')
}

async function getServerTime() {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/time', { timeout: 10000 })
    return response.data.serverTime
  } catch {
    return Date.now()
  }
}

async function fetchUserP2PHistory(apiKey, apiSecret, tradeType) {
  const serverTime = await getServerTime()
  const params = {
    recvWindow: '10000',
    timestamp: String(serverTime),
    tradeType,
    page: '1',
    rows: '20',
  }

  const queryString = new URLSearchParams(
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  ).toString()
  const signature = generateSignature(queryString, apiSecret)
  const url = `https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory?${queryString}&signature=${signature}`

  const response = await axios.get(url, {
    headers: { 'X-MBX-APIKEY': apiKey },
    timeout: 15000,
  })

  if (!response.data?.success) {
    return []
  }
  return response.data?.data || []
}

function pickBankValue(order) {
  return (
    order.paymentMethod ||
    order.payMethodName ||
    order.payType ||
    order.payTypes ||
    order.paymentMethodName ||
    ''
  )
}

async function main() {
  console.log('\n=== Diagnóstico Binance P2P: banco/método ===\n')

  const credentials = await prisma.binanceCredentials.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (!credentials) {
    console.log('No hay credenciales activas en la base de datos.')
    return
  }

  const apiKey = decrypt(credentials.apiKey)
  const apiSecret = decrypt(credentials.apiSecret)

  for (const tradeType of ['BUY', 'SELL']) {
    console.log(`\n--- ${tradeType} ---`)
    const orders = await fetchUserP2PHistory(apiKey, apiSecret, tradeType)
    console.log(`Órdenes recibidas: ${orders.length}`)

    if (!orders.length) {
      continue
    }

    const first = orders[0]
    const keys = Object.keys(first).sort()
    console.log('\nCampos del primer registro:')
    console.log(keys.join(', '))

    const sample = orders.slice(0, 5).map((o) => ({
      orderNumber: o.orderNumber || o.orderNo,
      orderStatus: o.orderStatus,
      paymentMethod: o.paymentMethod || null,
      payMethodName: o.payMethodName || null,
      payTypes: o.payTypes || null,
      bankDetected: pickBankValue(o) || null,
    }))

    console.log('\nMuestra (primeras 5 órdenes):')
    console.table(sample)

    const uniqueBanks = Array.from(
      new Set(orders.map((o) => pickBankValue(o)).filter(Boolean))
    )
    console.log(`Valores únicos detectados (${uniqueBanks.length}):`)
    console.log(uniqueBanks.length ? uniqueBanks.join(' | ') : '(ninguno)')
  }
}

main()
  .catch((error) => {
    const details = error?.response?.data || error?.message || error
    console.error('\nError ejecutando diagnóstico:')
    console.error(details)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
