export async function extractAmountFromImage(buffer: Buffer): Promise<number | null> {
  try {
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('spa')

      const {
        data: { text },
      } = await worker.recognize(buffer)
      await worker.terminate()

      const amountPatterns = [
        /Bs\.?\s*S\.?\s*([\d.,]+)/gi,
        /([\d.,]+)\s*Bs\.?\s*S\.?/gi,
        /([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g,
      ]

      const amounts: number[] = []

      for (const pattern of amountPatterns) {
        const matches = text.matchAll(pattern)
        for (const match of matches) {
          const amountStr = match[1] || match[0]
          const normalized = amountStr.replace(/\./g, '').replace(',', '.')
          const amount = parseFloat(normalized)
          if (!isNaN(amount) && amount > 0 && amount < 100000000) {
            amounts.push(amount)
          }
        }
      }

      if (amounts.length > 0) {
        return Math.max(...amounts)
      }

      return null
    } catch {
      console.log('Tesseract.js no disponible, usando validación manual')
      return null
    }
  } catch (error) {
    console.error('Error extrayendo monto de imagen:', error)
    return null
  }
}
