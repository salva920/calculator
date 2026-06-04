export { dynamic } from '@/lib/route-config'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fileToDataUrl } from '@/lib/store-upload-image'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const transactionId = String(formData.get('transactionId') || '')
    const bankNameRaw = formData.get('bankName')
    const accountNumberRaw = formData.get('accountNumber')
    const fullNameRaw = formData.get('fullName')
    const idNumberRaw = formData.get('idNumber')
    const bankName = typeof bankNameRaw === 'string' ? bankNameRaw.trim() || undefined : undefined
    const accountNumber =
      typeof accountNumberRaw === 'string' ? accountNumberRaw.trim() || undefined : undefined
    const fullName = typeof fullNameRaw === 'string' ? fullNameRaw.trim() || undefined : undefined
    const idNumber = typeof idNumberRaw === 'string' ? idNumberRaw.trim() || undefined : undefined

    const idCardImage = formData.get('idCardImage') as File | null
    const swornDeclarationImage = formData.get('swornDeclarationImage') as File | null
    const sourceOfFundsImage = formData.get('sourceOfFundsImage') as File | null

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'transactionId es requerido',
        },
        { status: 400 }
      )
    }

    const transaction = await prisma.binanceP2PTransaction.findUnique({
      where: { id: transactionId },
      select: { id: true, tradeType: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transacción no encontrada' },
        { status: 404 }
      )
    }

    if (transaction.tradeType !== 'SELL') {
      return NextResponse.json(
        { success: false, error: 'El registro KYC solo aplica a transacciones de venta' },
        { status: 400 }
      )
    }

    const existingKyc = await prisma.sellTransactionKyc.findUnique({
      where: { transactionId },
    })

    const idCardImageUrl = idCardImage ? await fileToDataUrl(idCardImage) : undefined
    const swornDeclarationImageUrl = swornDeclarationImage
      ? await fileToDataUrl(swornDeclarationImage)
      : undefined
    const sourceOfFundsImageUrl = sourceOfFundsImage
      ? await fileToDataUrl(sourceOfFundsImage)
      : undefined

    const createData: Record<string, unknown> = {
      transactionId,
      bankName,
      accountNumber,
      fullName,
      idNumber,
      idCardImageUrl,
      swornDeclarationImageUrl,
      sourceOfFundsImageUrl,
    }

    const updateData: Record<string, unknown> = {
      ...(bankName !== undefined && { bankName }),
      ...(accountNumber !== undefined && { accountNumber }),
      ...(fullName !== undefined && { fullName }),
      ...(idNumber !== undefined && { idNumber }),
      ...(idCardImageUrl !== undefined && { idCardImageUrl }),
      ...(swornDeclarationImageUrl !== undefined && { swornDeclarationImageUrl }),
      ...(sourceOfFundsImageUrl !== undefined && { sourceOfFundsImageUrl }),
    }

    if (existingKyc && Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        kyc: existingKyc,
        message: 'Sin cambios para guardar',
      })
    }

    const kyc = await prisma.sellTransactionKyc.upsert({
      where: { transactionId },
      create: createData as any,
      update: updateData as any,
    })

    return NextResponse.json({
      success: true,
      kyc,
      message: existingKyc ? 'KYC actualizado correctamente' : 'KYC registrado correctamente',
    })
  } catch (error: any) {
    console.error('Error guardando KYC de venta:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al guardar KYC de venta',
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
          error: 'transactionId es requerido',
        },
        { status: 400 }
      )
    }

    const kyc = await prisma.sellTransactionKyc.findUnique({
      where: { transactionId },
    })

    return NextResponse.json({
      success: true,
      kyc,
    })
  } catch (error: any) {
    console.error('Error obteniendo KYC de venta:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener KYC de venta',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
