/**
 * Migra imágenes KYC de public/uploads a data URLs en MongoDB.
 * Uso (desde la carpeta p2p, con .env y public/uploads en tu PC):
 *   node scripts/migrate-kyc-images.js
 */
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

const { PrismaClient } = require('@prisma/client')

const MAX_BYTES = 1_500_000
const FIELDS = ['idCardImageUrl', 'swornDeclarationImageUrl', 'sourceOfFundsImageUrl']

function isLegacy(ref) {
  return ref && (ref.startsWith('/uploads/') || ref.startsWith('uploads/'))
}

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  return 'image/jpeg'
}

function toDataUrl(ref, publicRoot) {
  const rel = ref.startsWith('/') ? ref.slice(1) : ref
  const abs = path.join(publicRoot, rel)
  if (!fs.existsSync(abs)) return null
  const buf = fs.readFileSync(abs)
  if (buf.length > MAX_BYTES) {
    console.warn('  omitida (muy grande):', rel)
    return null
  }
  const mime = guessMime(abs)
  return `data:${mime};base64,${buf.toString('base64')}`
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en .env')
    process.exit(1)
  }

  const publicRoot = path.join(__dirname, '..', 'public')
  const uploadsDir = path.join(publicRoot, 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    console.error('No existe public/uploads en este proyecto.')
    console.error('Copia aquí las imágenes que tenías en tu PC al usar la app en local.')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  const all = await prisma.sellTransactionKyc.findMany({
    include: { transaction: { select: { orderNumber: true } } },
  })

  const pending = all.filter((k) => FIELDS.some((f) => isLegacy(k[f])))
  console.log(`KYC con rutas legacy: ${pending.length}`)

  let migrated = 0
  let failed = 0

  for (const kyc of pending) {
    const updates = {}
    for (const field of FIELDS) {
      const ref = kyc[field]
      if (!isLegacy(ref)) continue
      const dataUrl = toDataUrl(ref, publicRoot)
      if (dataUrl) updates[field] = dataUrl
    }
    const order = kyc.transaction?.orderNumber ?? kyc.transactionId
    if (Object.keys(updates).length === 0) {
      console.log(`  sin archivos en disco: orden ${order}`)
      failed++
      continue
    }
    await prisma.sellTransactionKyc.update({
      where: { transactionId: kyc.transactionId },
      data: updates,
    })
    console.log(`  OK orden ${order} (${Object.keys(updates).length} imagen/es)`)
    migrated++
  }

  console.log(`\nListo: ${migrated} registros migrados, ${failed} sin archivos locales.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
