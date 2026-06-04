const MAX_IMAGE_BYTES = 1_500_000 // ~1.5 MB por imagen (límite documento MongoDB)

function guessMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

/** Guarda la imagen como data URL en MongoDB (compatible con Vercel serverless). */
export async function fileToDataUrl(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(
      `La imagen es demasiado grande (máx. ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB)`
    )
  }
  const mime = file.type || guessMime(file.name)
  const base64 = Buffer.from(bytes).toString('base64')
  return `data:${mime};base64,${base64}`
}

export function isInlineImageRef(ref: string | null | undefined): boolean {
  return !!ref && ref.startsWith('data:')
}

/** Rutas antiguas en disco local; no se deben usar como src ni devolver al cliente. */
export function isLegacyFilesystemImageRef(ref: string | null | undefined): boolean {
  return !!ref && (ref.startsWith('/uploads/') || ref.startsWith('uploads/'))
}

/** Solo data URLs son visibles en la app web (Vercel no sirve /uploads). */
export function sanitizeImageRefForClient(ref: string | null | undefined): string | null {
  if (!ref || !isInlineImageRef(ref)) return null
  return ref
}

export type KycImagePayload = {
  idCardImageUrl?: string | null
  swornDeclarationImageUrl?: string | null
  sourceOfFundsImageUrl?: string | null
}

export type KycImageFieldKey = keyof KycImagePayload

export function getLegacyKycImageFields(kyc: KycImagePayload): KycImageFieldKey[] {
  const fields: KycImageFieldKey[] = []
  if (isLegacyFilesystemImageRef(kyc.idCardImageUrl)) fields.push('idCardImageUrl')
  if (isLegacyFilesystemImageRef(kyc.swornDeclarationImageUrl)) fields.push('swornDeclarationImageUrl')
  if (isLegacyFilesystemImageRef(kyc.sourceOfFundsImageUrl)) fields.push('sourceOfFundsImageUrl')
  return fields
}

export function sanitizeKycImagesForClient<T extends KycImagePayload>(kyc: T): T {
  return {
    ...kyc,
    idCardImageUrl: sanitizeImageRefForClient(kyc.idCardImageUrl ?? null),
    swornDeclarationImageUrl: sanitizeImageRefForClient(kyc.swornDeclarationImageUrl ?? null),
    sourceOfFundsImageUrl: sanitizeImageRefForClient(kyc.sourceOfFundsImageUrl ?? null),
  }
}
