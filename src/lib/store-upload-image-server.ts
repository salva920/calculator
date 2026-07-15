import 'server-only'
import sharp from 'sharp'

const MAX_IMAGE_BYTES = 1_500_000 // ~1.5 MB por imagen (límite documento MongoDB)

function formatMaxSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${Number(mb.toFixed(1))} MB` : `${Math.round(bytes / 1024)} KB`
}

function guessMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

async function compressImageBytes(bytes: Buffer): Promise<Buffer> {
  let quality = 85
  let maxSide = 2048

  for (let attempt = 0; attempt < 12; attempt++) {
    const output = await sharp(bytes)
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()

    if (output.byteLength <= MAX_IMAGE_BYTES) {
      return output
    }

    if (quality > 45) {
      quality -= 10
    } else {
      maxSide = Math.round(maxSide * 0.75)
      quality = 75
    }
  }

  const lastTry = await sharp(bytes)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 40, mozjpeg: true })
    .toBuffer()

  if (lastTry.byteLength <= MAX_IMAGE_BYTES) {
    return lastTry
  }

  throw new Error(
    `No se pudo comprimir la imagen por debajo de ${formatMaxSize(MAX_IMAGE_BYTES)}`
  )
}

/** Guarda la imagen como data URL en MongoDB (compatible con Vercel serverless). */
export async function fileToDataUrl(file: File): Promise<string> {
  const input = Buffer.from(await file.arrayBuffer())
  let mime = file.type || guessMime(file.name)

  let output: Buffer = input
  if (input.byteLength > MAX_IMAGE_BYTES) {
    if (!mime.startsWith('image/')) {
      throw new Error(`La imagen es demasiado grande (máx. ${formatMaxSize(MAX_IMAGE_BYTES)})`)
    }
    output = Buffer.from(await compressImageBytes(input))
    mime = 'image/jpeg'
  }

  const base64 = output.toString('base64')
  return `data:${mime};base64,${base64}`
}
