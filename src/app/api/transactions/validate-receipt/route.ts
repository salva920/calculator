export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractAmountFromImage } from '@/lib/receipt-ocr'
import { fileToDataUrl } from '@/lib/store-upload-image'

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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const imageUrl = await fileToDataUrl(file)

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

