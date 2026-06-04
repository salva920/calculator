import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FormData } from '@/utils/calculations'

export async function POST(request: NextRequest) {
  try {
    const formData: FormData = await request.json()
    
    // Calcular la ganancia de esta transacción individual
    const grossProfit = (formData.sellPrice - formData.buyPrice) * formData.usdtAmount
    const bankCommissionAmount = formData.bankCommissionType === 'percentage' 
      ? (formData.buyPrice * formData.usdtAmount * formData.bankCommission) / 100
      : formData.bankCommission
    const totalCosts = bankCommissionAmount + formData.binanceCommission
    const netProfit = grossProfit - totalCosts
    const profitMargin = (netProfit / (formData.buyPrice * formData.usdtAmount)) * 100
    const roi = (netProfit / (formData.buyPrice * formData.usdtAmount)) * 100

    // Crear la transacción diaria
    const transaction = await prisma.dailyTransaction.create({
      data: {
        date: new Date(),
        usdtAmount: formData.usdtAmount,
        buyPrice: formData.buyPrice,
        sellPrice: formData.sellPrice,
        buyPriceType: formData.buyPriceType,
        sellPriceType: formData.sellPriceType,
        buyPriceMargin: formData.buyPriceMargin,
        sellPriceMargin: formData.sellPriceMargin,
        bankCommission: formData.bankCommission,
        bankCommissionType: formData.bankCommissionType,
        binanceCommission: formData.binanceCommission,
        grossProfit,
        netProfit,
        totalCosts,
        profitMargin,
        roi,
        cyclesPerDay: formData.cyclesPerDay,
        workingDaysPerMonth: formData.workingDaysPerMonth,
        currentOrders: formData.currentOrders,
        targetOrders: formData.targetOrders,
        currentBtc30Days: formData.currentBtc30Days,
        targetBtc30Days: formData.targetBtc30Days,
        currentBtcTotal: formData.currentBtcTotal,
        targetBtcTotal: formData.targetBtcTotal
      }
    })

    // Actualizar el balance diario
    await updateDailyBalance(new Date())

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transacción guardada exitosamente'
    })

  } catch (error: any) {
    console.error('Error saving transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al guardar la transacción',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = date ? {
      date: {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      }
    } : {}

    const transactions = await prisma.dailyTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      success: true,
      transactions
    })

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener las transacciones',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

async function updateDailyBalance(date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // Obtener todas las transacciones del día
  const dayTransactions = await prisma.dailyTransaction.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  })

  if (dayTransactions.length === 0) return

  // Calcular totales
  const totalTransactions = dayTransactions.length
  const totalUsdtAmount = dayTransactions.reduce((sum, t) => sum + t.usdtAmount, 0)
  const totalGrossProfit = dayTransactions.reduce((sum, t) => sum + t.grossProfit, 0)
  const totalNetProfit = dayTransactions.reduce((sum, t) => sum + t.netProfit, 0)
  const totalCosts = dayTransactions.reduce((sum, t) => sum + t.totalCosts, 0)
  const averageROI = dayTransactions.reduce((sum, t) => sum + t.roi, 0) / totalTransactions
  const bestTransaction = Math.max(...dayTransactions.map(t => t.netProfit))
  const worstTransaction = Math.min(...dayTransactions.map(t => t.netProfit))

  // Crear o actualizar el balance diario
  await prisma.dailyBalance.upsert({
    where: { date: startOfDay },
    update: {
      totalTransactions,
      totalUsdtAmount,
      totalGrossProfit,
      totalNetProfit,
      totalCosts,
      averageROI,
      bestTransaction,
      worstTransaction
    },
    create: {
      date: startOfDay,
      totalTransactions,
      totalUsdtAmount,
      totalGrossProfit,
      totalNetProfit,
      totalCosts,
      averageROI,
      bestTransaction,
      worstTransaction
    }
  })
}

