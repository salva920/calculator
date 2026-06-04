import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Obtener estadísticas de anuncios (agrupadas por advNo)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const todayOnly = searchParams.get('todayOnly') === 'true'

    // Obtener transacciones
    let where: any = {}
    
    if (todayOnly) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      
      where.createTime = {
        gte: today,
        lte: todayEnd,
      }
    }

    const transactions = await prisma.binanceP2PTransaction.findMany({
      where,
      orderBy: {
        createTime: 'desc',
      },
    })

    // Agrupar por advNo y tipo (BUY/SELL)
    const adsMap = new Map<string, {
      advNo: string
      tradeType: 'BUY' | 'SELL'
      totalAmount: number
      totalValue: number
      transactionCount: number
      completedCount: number
      pendingCount: number
      averagePrice: number
      totalBinanceCommission: number
      totalBankCommission: number
      completedAmount: number
      completedValue: number
      firstTransaction: Date
      lastTransaction: Date
      transactions: any[]
    }>()

    for (const tx of transactions) {
      if (!tx.advNo) continue // Saltar si no tiene advNo

      const key = `${tx.advNo}-${tx.tradeType}`
      
      if (!adsMap.has(key)) {
        adsMap.set(key, {
          advNo: tx.advNo,
          tradeType: tx.tradeType as 'BUY' | 'SELL',
          totalAmount: 0,
          totalValue: 0,
          transactionCount: 0,
          completedCount: 0,
          pendingCount: 0,
          averagePrice: 0,
          totalBinanceCommission: 0,
          totalBankCommission: 0,
          completedAmount: 0,
          completedValue: 0,
          firstTransaction: new Date(tx.createTime),
          lastTransaction: new Date(tx.createTime),
          transactions: [],
        })
      }

      const ad = adsMap.get(key)!
      ad.totalAmount += tx.amount
      ad.totalValue += tx.fiatAmount
      ad.transactionCount++
      ad.totalBinanceCommission += tx.commission || 0
      ad.totalBankCommission += tx.bankCommission || 0
      
      if (tx.orderStatus === 'COMPLETED') {
        ad.completedCount++
        ad.completedAmount += tx.amount
        ad.completedValue += tx.fiatAmount
      } else if (['TRADING', 'BUYER_PAYED', 'APPEALING'].includes(tx.orderStatus)) {
        ad.pendingCount++
      }

      if (new Date(tx.createTime) < ad.firstTransaction) {
        ad.firstTransaction = new Date(tx.createTime)
      }
      if (new Date(tx.createTime) > ad.lastTransaction) {
        ad.lastTransaction = new Date(tx.createTime)
      }

      ad.transactions.push({
        id: tx.id,
        orderNumber: tx.orderNumber,
        amount: tx.amount,
        fiatAmount: tx.fiatAmount,
        unitPrice: tx.unitPrice,
        orderStatus: tx.orderStatus,
        createTime: tx.createTime,
        counterPartName: tx.counterPartName,
        paymentMethod: tx.paymentMethod,
        commission: tx.commission || 0,
        bankCommission: tx.bankCommission || 0,
      })
    }

    // Agrupar por advNo para calcular balance y ganancias
    const advNoMap = new Map<string, {
      advNo: string
      buyAds: typeof adsMap extends Map<string, infer V> ? V : never
      sellAds: typeof adsMap extends Map<string, infer V> ? V : never
    }>()

    for (const [, ad] of Array.from(adsMap.entries())) {
      if (!advNoMap.has(ad.advNo)) {
        advNoMap.set(ad.advNo, {
          advNo: ad.advNo,
          buyAds: null as any,
          sellAds: null as any,
        })
      }
      
      const advGroup = advNoMap.get(ad.advNo)!
      if (ad.tradeType === 'BUY') {
        advGroup.buyAds = ad as any
      } else {
        advGroup.sellAds = ad as any
      }
    }

    // Calcular métricas por anuncio
    const ads = Array.from(adsMap.values()).map(ad => {
      const advGroup = advNoMap.get(ad.advNo)
      const buyAd = advGroup?.buyAds
      const sellAd = advGroup?.sellAds

      // Para cada anuncio, calcular métricas de balance y ganancias
      let balanceMetrics: any = {}
      
      if (ad.tradeType === 'SELL') {
        // Para anuncios de venta, calcular balance con el anuncio de compra correspondiente
        const completedBuyAmount = buyAd?.completedAmount || 0
        const completedSellAmount = sellAd?.completedAmount || 0
        const balanceDifference = completedSellAmount - completedBuyAmount
        const pendingToBuy = balanceDifference > 0 ? balanceDifference : 0
        const pendingToSell = balanceDifference < 0 ? Math.abs(balanceDifference) : 0

        // Calcular ganancias: necesitamos emparejar compras con ventas del mismo anuncio
        const completedBuyValue = buyAd?.completedValue || 0
        const completedSellValue = sellAd?.completedValue || 0
        
        // Obtener comisiones solo de transacciones completadas
        // Necesitamos buscar en las transacciones originales para obtener las comisiones
        const buyCompletedTxs = transactions.filter(tx => 
          tx.advNo === ad.advNo && 
          tx.tradeType === 'BUY' && 
          tx.orderStatus === 'COMPLETED'
        )
        const sellCompletedTxs = transactions.filter(tx => 
          tx.advNo === ad.advNo && 
          tx.tradeType === 'SELL' && 
          tx.orderStatus === 'COMPLETED'
        )
        
        // Comisiones de compras completadas
        const buyCommissions = buyCompletedTxs.reduce((sum, tx) => 
          sum + (tx.commission || 0) + (tx.bankCommission || 0), 0)
        
        // Comisiones de ventas completadas
        const sellCommissions = sellCompletedTxs.reduce((sum, tx) => 
          sum + (tx.commission || 0) + (tx.bankCommission || 0), 0)
        
        // Ganancia bruta (diferencia entre lo recibido por ventas y lo pagado por compras)
        const grossProfit = completedSellValue - completedBuyValue
        const totalCommissions = buyCommissions + sellCommissions
        const netProfit = grossProfit - totalCommissions

        balanceMetrics = {
          balanceDifference,
          pendingToBuy,
          pendingToSell,
          completedBuyAmount,
          completedSellAmount,
          grossProfit,
          netProfit,
          totalCommissions,
          buyCommissions,
          sellCommissions,
          hasMatchingBuy: !!buyAd,
        }
      }

      return {
        ...ad,
        averagePrice: ad.totalAmount > 0 ? ad.totalValue / ad.totalAmount : 0,
        totalBinanceCommission: ad.totalBinanceCommission,
        totalBankCommission: ad.totalBankCommission,
        ...balanceMetrics,
      }
    })

    // Ordenar por última transacción (más reciente primero)
    ads.sort((a, b) => b.lastTransaction.getTime() - a.lastTransaction.getTime())

    return NextResponse.json({
      success: true,
      ads,
      count: ads.length,
    })
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de anuncios:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadísticas de anuncios',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

