import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Nota: Para OCR en producción, considera usar un servicio como:
// - Google Cloud Vision API
// - AWS Textract
// - Tesseract.js (más pesado pero gratuito)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const transactionId = formData.get('transactionId') as string
    const file = formData.get('file') as File

    if (!transactionId || !file) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de transacción y archivo son requeridos',
        },
        { status: 400 }
      )
    }

    // Verificar que la transacción existe
    const transaction = await prisma.binanceP2PTransaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transacción no encontrada',
        },
        { status: 404 }
      )
    }

    // Guardar la imagen
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear directorio si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'receipts')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const filename = `${transactionId}-${timestamp}.${file.name.split('.').pop()}`
    const filepath = join(uploadsDir, filename)
    const imageUrl = `/uploads/receipts/${filename}`

    // Guardar archivo
    await writeFile(filepath, buffer)

    // Extraer monto de la imagen usando OCR
    // Por ahora, usaremos una aproximación simple
    // En producción, deberías usar un servicio de OCR real
    const extractedAmount = await extractAmountFromImage(buffer)
    const expectedAmount = transaction.fiatAmount
    const isValid = extractedAmount !== null && 
                   Math.abs(extractedAmount - expectedAmount) < 1.0 // Tolerancia de 1 VES
    const confidence = extractedAmount !== null ? 0.85 : 0 // Simulado

    // Guardar validación
    const validation = await prisma.receiptValidation.create({
      data: {
        transactionId,
        imageUrl,
        extractedAmount: extractedAmount || 0,
        expectedAmount,
        isValid,
        confidence,
        ocrText: extractedAmount ? `Monto detectado: ${extractedAmount}` : null,
      },
    })

    return NextResponse.json({
      success: true,
      validation,
      message: isValid 
        ? 'Comprobante válido: El monto coincide con la orden'
        : extractedAmount !== null
        ? `Comprobante inválido: Monto detectado (${extractedAmount.toFixed(2)}) no coincide con el esperado (${expectedAmount.toFixed(2)})`
        : 'No se pudo extraer el monto de la imagen. Verifica que la imagen sea clara y contenga el monto visible.',
    })
  } catch (error: any) {
    console.error('Error validando comprobante:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al validar comprobante',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Función para extraer monto de la imagen usando OCR
// NOTA: Esta implementación usa una aproximación básica
// Para mejor precisión, instala tesseract.js: npm install tesseract.js
export async function extractAmountFromImage(buffer: Buffer): Promise<number | null> {
  try {
    // Intentar usar Tesseract.js si está disponible
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('spa') // Español
      
      const { data: { text } } = await worker.recognize(buffer)
      await worker.terminate()
      
      // Buscar montos en el texto usando regex
      // Patrones comunes: Bs.S 1.234,56 | 1.234,56 Bs.S | 1234.56 | etc.
      const amountPatterns = [
        /Bs\.?\s*S\.?\s*([\d.,]+)/gi, // Bs.S 1.234,56
        /([\d.,]+)\s*Bs\.?\s*S\.?/gi, // 1.234,56 Bs.S
        /([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g, // Números con formato de moneda
      ]
      
      const amounts: number[] = []
      
      for (const pattern of amountPatterns) {
        const matches = text.matchAll(pattern)
        for (const match of matches) {
          const amountStr = match[1] || match[0]
          // Convertir formato venezolano (1.234,56) a número
          const normalized = amountStr.replace(/\./g, '').replace(',', '.')
          const amount = parseFloat(normalized)
          if (!isNaN(amount) && amount > 0 && amount < 100000000) {
            amounts.push(amount)
          }
        }
      }
      
      // Retornar el monto más grande encontrado (probablemente el total)
      if (amounts.length > 0) {
        return Math.max(...amounts)
      }
      
      return null
    } catch (tesseractError) {
      // Si Tesseract no está disponible, retornar null
      // El usuario puede ingresar el monto manualmente
      console.log('Tesseract.js no disponible, usando validación manual')
      return null
    }
  } catch (error) {
    console.error('Error extrayendo monto de imagen:', error)
    return null
  }
}

// Obtener validaciones de una transacción
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de transacción es requerido',
        },
        { status: 400 }
      )
    }

    const validations = await prisma.receiptValidation.findMany({
      where: { transactionId },
      orderBy: { validatedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      validations,
    })
  } catch (error: any) {
    console.error('Error obteniendo validaciones:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener validaciones',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

