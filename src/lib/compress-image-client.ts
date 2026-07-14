const MAX_IMAGE_BYTES = 1_500_000

function replaceExt(filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  return `${base || 'imagen'}${ext}`
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

function renderToJpegBlob(
  img: HTMLImageElement,
  maxSide: number,
  quality: number
): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Promise.reject(new Error('No se pudo procesar la imagen'))
  }
  ctx.drawImage(img, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/jpeg',
      quality
    )
  })
}

/** Comprime imágenes grandes en el navegador antes de subirlas. */
export async function compressImageFile(
  file: File,
  maxBytes = MAX_IMAGE_BYTES
): Promise<File> {
  if (file.size <= maxBytes) return file
  if (!file.type.startsWith('image/')) return file

  const img = await loadImage(file)
  let maxSide = 2048
  let quality = 0.85

  for (let attempt = 0; attempt < 12; attempt++) {
    const blob = await renderToJpegBlob(img, maxSide, quality)
    if (blob.size <= maxBytes) {
      return new File([blob], replaceExt(file.name, '.jpg'), { type: 'image/jpeg' })
    }
    if (quality > 0.5) {
      quality -= 0.1
    } else {
      maxSide = Math.round(maxSide * 0.75)
      quality = 0.75
    }
  }

  const blob = await renderToJpegBlob(img, 1024, 0.4)
  if (blob.size <= maxBytes) {
    return new File([blob], replaceExt(file.name, '.jpg'), { type: 'image/jpeg' })
  }

  throw new Error('La imagen sigue siendo demasiado grande después de comprimirla')
}
