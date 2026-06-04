import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Obtener objetivos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
      where.isCompleted = false
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Calcular valores actuales basados en transacciones
    for (const goal of goals) {
      let currentValue = 0

      if (goal.type === 'orders') {
        // Contar total de transacciones
        const count = await prisma.dailyTransaction.count({
          where: {
            date: {
              gte: goal.startDate,
              ...(goal.endDate ? { lte: goal.endDate } : {}),
            },
          },
        })
        currentValue = count
      } else if (goal.type === 'profit') {
        // Sumar ganancias netas
        const result = await prisma.dailyTransaction.aggregate({
          where: {
            date: {
              gte: goal.startDate,
              ...(goal.endDate ? { lte: goal.endDate } : {}),
            },
          },
          _sum: {
            netProfit: true,
          },
        })
        currentValue = result._sum.netProfit || 0
      } else if (goal.type === 'volume') {
        // Sumar volumen de USDT
        const result = await prisma.dailyTransaction.aggregate({
          where: {
            date: {
              gte: goal.startDate,
              ...(goal.endDate ? { lte: goal.endDate } : {}),
            },
          },
          _sum: {
            usdtAmount: true,
          },
        })
        currentValue = result._sum.usdtAmount || 0
      }

      // Actualizar valor actual y verificar si está completado
      const isCompleted = currentValue >= goal.targetValue
      if (currentValue !== goal.currentValue || isCompleted !== goal.isCompleted) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            currentValue,
            isCompleted,
            ...(isCompleted && !goal.isCompleted ? { completedAt: new Date() } : {}),
          },
        })
        goal.currentValue = currentValue
        goal.isCompleted = isCompleted
      }
    }

    return NextResponse.json({
      success: true,
      goals,
    })
  } catch (error: any) {
    console.error('Error obteniendo objetivos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener objetivos',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Crear objetivo
export async function POST(request: NextRequest) {
  try {
    const { name, type, targetValue, endDate } = await request.json()

    if (!name || !type || !targetValue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre, tipo y valor objetivo son requeridos',
        },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        name,
        type,
        targetValue: parseFloat(targetValue),
        endDate: endDate ? new Date(endDate) : null,
        currentValue: 0,
        isActive: true,
        isCompleted: false,
      },
    })

    return NextResponse.json({
      success: true,
      goal,
      message: 'Objetivo creado exitosamente',
    })
  } catch (error: any) {
    console.error('Error creando objetivo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear objetivo',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Actualizar objetivo
export async function PUT(request: NextRequest) {
  try {
    const { id, name, targetValue, endDate, isActive } = await request.json()

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID del objetivo es requerido',
        },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (targetValue !== undefined) updateData.targetValue = parseFloat(targetValue)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      goal,
      message: 'Objetivo actualizado exitosamente',
    })
  } catch (error: any) {
    console.error('Error actualizando objetivo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar objetivo',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Eliminar objetivo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID del objetivo es requerido',
        },
        { status: 400 }
      )
    }

    await prisma.goal.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Objetivo eliminado exitosamente',
    })
  } catch (error: any) {
    console.error('Error eliminando objetivo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar objetivo',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

