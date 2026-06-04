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
