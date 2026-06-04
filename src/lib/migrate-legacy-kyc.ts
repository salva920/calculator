import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import {
  isInlineImageRef,
  guessMimeFromFilename,
  bufferToDataUrl,
  MAX_IMAGE_BYTES,
} from '@/lib/store-upload-image'
import {
  KYC_IMAGE_FIELDS,
  getLegacyFields,
  type KycImageUrlField,
} from '@/lib/kyc-image-utils'

export { KYC_IMAGE_FIELDS, getLegacyFields, type KycImageUrlField }

export type SellKycRecord = {
  id: string
  transactionId: string
  idCardImageUrl: string | null
  swornDeclarationImageUrl: string | null
  sourceOfFundsImageUrl: string | null
  transaction?: { orderNumber: string } | null
}

export function normalizeLegacyUploadPath(ref: string): string {
  return ref.startsWith('/') ? ref.slice(1) : ref
}

export function getLegacyFileAbsolutePath(ref: string, publicRoot?: string): string {
  const root = publicRoot || path.join(process.cwd(), 'public')
  return path.join(root, normalizeLegacyUploadPath(ref))
}

export function readLegacyFileAsDataUrl(ref: string, publicRoot?: string): string | null {
  try {
    const abs = getLegacyFileAbsolutePath(ref, publicRoot)
    if (!fs.existsSync(abs)) return null
    const buf = fs.readFileSync(abs)
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      console.warn(`Imagen demasiado grande para migrar: ${ref}`)
      return null
    }
    return bufferToDataUrl(buf, guessMimeFromFilename(abs))
  } catch (err) {
    console.warn(`No se pudo leer ${ref}:`, err)
    return null
  }
}

export async function listKycWithLegacyImages() {
  const all = await prisma.sellTransactionKyc.findMany({
    include: {
      transaction: { select: { orderNumber: true, tradeType: true } },
    },
  })
  return all.filter((k) => getLegacyFields(k).length > 0)
}

export async function migrateKycImagesFromDisk(
  kyc: SellKycRecord,
  publicRoot?: string
): Promise<{ migrated: number; missing: KycImageUrlField[] }> {
  const updates: Partial<Record<KycImageUrlField, string>> = {}
  const missing: KycImageUrlField[] = []

  for (const field of getLegacyFields(kyc)) {
    const ref = kyc[field]!
    const dataUrl = readLegacyFileAsDataUrl(ref, publicRoot)
    if (dataUrl) {
      updates[field] = dataUrl
    } else {
      missing.push(field)
    }
  }

  if (Object.keys(updates).length === 0) {
    return { migrated: 0, missing }
  }

  await prisma.sellTransactionKyc.update({
    where: { transactionId: kyc.transactionId },
    data: updates,
  })

  return { migrated: Object.keys(updates).length, missing }
}

export async function migrateAllKycFromDisk(publicRoot?: string) {
  const pending = await listKycWithLegacyImages()
  let totalMigrated = 0
  let recordsOk = 0
  const recordsPartial: { transactionId: string; orderNumber: string; missing: string[] }[] = []
  const recordsFailed: { transactionId: string; orderNumber: string }[] = []

  for (const kyc of pending) {
    const result = await migrateKycImagesFromDisk(kyc, publicRoot)
    totalMigrated += result.migrated
    const orderNumber = kyc.transaction?.orderNumber ?? kyc.transactionId
    if (result.migrated > 0 && result.missing.length === 0) {
      recordsOk++
    } else if (result.migrated > 0) {
      recordsPartial.push({
        transactionId: kyc.transactionId,
        orderNumber,
        missing: result.missing,
      })
    } else {
      recordsFailed.push({ transactionId: kyc.transactionId, orderNumber })
    }
  }

  return {
    pendingCount: pending.length,
    totalMigrated,
    recordsOk,
    recordsPartial,
    recordsFailed,
  }
}

export async function applyClientKycImageUpdates(
  transactionId: string,
  images: Partial<Record<KycImageUrlField, string>>
) {
  const sanitized: Partial<Record<KycImageUrlField, string>> = {}
  for (const field of KYC_IMAGE_FIELDS) {
    const val = images[field]
    if (val && isInlineImageRef(val)) {
      sanitized[field] = val
    }
  }
  if (Object.keys(sanitized).length === 0) {
    return { updated: 0 }
  }
  await prisma.sellTransactionKyc.update({
    where: { transactionId },
    data: sanitized,
  })
  return { updated: Object.keys(sanitized).length }
}
