import { isLegacyFilesystemImageRef } from '@/lib/store-upload-image'

export const KYC_IMAGE_FIELDS = [
  'idCardImageUrl',
  'swornDeclarationImageUrl',
  'sourceOfFundsImageUrl',
] as const

export type KycImageUrlField = (typeof KYC_IMAGE_FIELDS)[number]

export type SellKycImageFields = Pick<
  Record<KycImageUrlField, string | null>,
  KycImageUrlField
>

export function getLegacyFields(kyc: SellKycImageFields): KycImageUrlField[] {
  return KYC_IMAGE_FIELDS.filter((f) => isLegacyFilesystemImageRef(kyc[f]))
}

export function kycHasLegacyImages(kyc: SellKycImageFields | null | undefined): boolean {
  if (!kyc) return false
  return getLegacyFields(kyc).length > 0
}
