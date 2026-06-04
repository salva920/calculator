export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_TYPES = ['BUY_EXTERNAL', 'SELL_EXTERNAL', 'SETTLEMENT'] as const
const prismaAny = prisma as any

export async function GET() {
  try {
    const adjustments = await prismaAny.manualBalanceAdjustment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    return NextResponse.json({
      success: true,
      adjustments,
    })
  } catch (error: any) {
    console.error('Error obteniendo ajustes manuales:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener ajustes manuales',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, usdtAmount, note } = await request.json()

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de ajuste inválido',
        },
        { status: 400 }
      )
    }

    const parsedAmount = Number(usdtAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El monto USDT debe ser mayor a 0',
        },
        { status: 400 }
      )
    }

    const adjustment = await prismaAny.manualBalanceAdjustment.create({
      data: {
        type,
        usdtAmount: parsedAmount,
        note: typeof note === 'string' ? note.trim() || null : null,
      },
    })

    return NextResponse.json({
      success: true,
      adjustment,
      message: 'Ajuste manual guardado',
    })
  } catch (error: any) {
    console.error('Error creando ajuste manual:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear ajuste manual',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'id es requerido',
        },
        { status: 400 }
      )
    }

    await prismaAny.manualBalanceAdjustment.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Ajuste eliminado',
    })
  } catch (error: any) {
    console.error('Error eliminando ajuste manual:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar ajuste manual',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
