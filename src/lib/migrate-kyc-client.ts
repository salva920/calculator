import axios from 'axios'
import { MAX_IMAGE_BYTES } from '@/lib/store-upload-image'
import {
  KYC_IMAGE_FIELDS,
  getLegacyFields,
  kycHasLegacyImages,
  type KycImageUrlField,
  type SellKycImageFields,
} from '@/lib/kyc-image-utils'

function legacyUrlToFetch(ref: string): string {
  if (ref.startsWith('http://') || ref.startsWith('https://')) return ref
  const path = ref.startsWith('/') ? ref : `/${ref}`
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  return path
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Intenta cargar una imagen legacy desde el mismo origen (p. ej. localhost + public/uploads). */
export async function fetchLegacyImageAsDataUrl(ref: string): Promise<string | null> {
  try {
    const res = await fetch(legacyUrlToFetch(ref))
    if (!res.ok) return null
    const blob = await res.blob()
    if (blob.size > MAX_IMAGE_BYTES) return null
    const dataUrl = await blobToDataUrl(blob)
    if (!dataUrl.startsWith('data:')) return null
    return dataUrl
  } catch {
    return null
  }
}

export async function migrateKycRecordFromBrowser(
  kyc: { transactionId: string } & SellKycImageFields
): Promise<{ migrated: number; missing: KycImageUrlField[] }> {
  const images: Partial<Record<KycImageUrlField, string>> = {}
  const missing: KycImageUrlField[] = []

  for (const field of getLegacyFields(kyc)) {
    const ref = kyc[field]!
    const dataUrl = await fetchLegacyImageAsDataUrl(ref)
    if (dataUrl) {
      images[field] = dataUrl
    } else {
      missing.push(field)
    }
  }

  if (Object.keys(images).length === 0) {
    return { migrated: 0, missing }
  }

  await axios.post('/api/transactions/sell-kyc/migrate-legacy', {
    transactionId: kyc.transactionId,
    images,
  })

  return { migrated: Object.keys(images).length, missing }
}

export type PendingLegacyKyc = {
  transactionId: string
  orderNumber: string
  legacyFields: KycImageUrlField[]
  idCardImageUrl: string | null
  swornDeclarationImageUrl: string | null
  sourceOfFundsImageUrl: string | null
}

export async function fetchPendingLegacyKyc(): Promise<PendingLegacyKyc[]> {
  const res = await axios.get('/api/transactions/sell-kyc/migrate-legacy')
  if (!res.data?.success) return []
  return res.data.pending ?? []
}

export async function migrateAllKycFromBrowser(
  onProgress?: (done: number, total: number) => void
): Promise<{
  totalMigrated: number
  recordsOk: number
  recordsPartial: number
  recordsFailed: number
}> {
  const pending = await fetchPendingLegacyKyc()
  let totalMigrated = 0
  let recordsOk = 0
  let recordsPartial = 0
  let recordsFailed = 0

  for (let i = 0; i < pending.length; i++) {
    const row = pending[i]
    const result = await migrateKycRecordFromBrowser({
      transactionId: row.transactionId,
      idCardImageUrl: row.idCardImageUrl,
      swornDeclarationImageUrl: row.swornDeclarationImageUrl,
      sourceOfFundsImageUrl: row.sourceOfFundsImageUrl,
    })
    totalMigrated += result.migrated
    if (result.migrated > 0 && result.missing.length === 0) recordsOk++
    else if (result.migrated > 0) recordsPartial++
    else recordsFailed++
    onProgress?.(i + 1, pending.length)
  }

  return { totalMigrated, recordsOk, recordsPartial, recordsFailed }
}

export { kycHasLegacyImages }
