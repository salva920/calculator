export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    // Tasa de cambio actual basada en Binance P2P (actualizada manualmente)
    // Esta tasa debe actualizarse regularmente para reflejar el mercado real
    const currentVesRate = 254.99 // Tasa actual de Binance P2P según el usuario
    
    // Intentar obtener datos de Binance para ajustar la tasa
    let adjustmentFactor = 1.0
    
    try {
      // Obtener el precio de BTC/USDT para tener una referencia del mercado
      const btcResponse = await axios.get(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'Binance-P2P-Calculator/1.0.0'
          }
        }
      )
      
      const btcPrice = parseFloat(btcResponse.data.price)
      
      // Ajustar la tasa basada en la volatilidad del mercado crypto
      // Si BTC está alto, el mercado crypto está activo, ajustar VES ligeramente
      if (btcPrice > 100000) { // Si BTC > $100k
        adjustmentFactor = 1.01 // Aumentar 1%
      } else if (btcPrice < 50000) { // Si BTC < $50k
        adjustmentFactor = 0.99 // Reducir 1%
      }
      
    } catch {
      adjustmentFactor = 1.0
    }
    
    // Aplicar el ajuste a la tasa base
    const usdToVesRate = currentVesRate * adjustmentFactor
    
    // USDT siempre vale aproximadamente $1 USD
    const usdtPrice = 1.0
    const vesPrice = usdtPrice * usdToVesRate
    
    return NextResponse.json({
      symbol: 'USDTUSDT',
      usdPrice: usdtPrice,
      vesPrice: vesPrice,
      usdToVesRate: usdToVesRate,
      timestamp: Date.now(),
      source: 'binance-p2p-manual',
      baseRate: currentVesRate,
      adjustmentFactor: adjustmentFactor
    })
    
  } catch (error) {
    console.error('Error fetching USDT/VES price:', error)
    
    // Fallback a un precio realista basado en Binance P2P
    const fallbackPrice = 1.0 // USDT = $1 USD
    const usdToVesRate = 254.99 // Tasa actual de Binance P2P
    const vesPrice = fallbackPrice * usdToVesRate
    
    return NextResponse.json({
      symbol: 'USDTUSDT',
      usdPrice: fallbackPrice,
      vesPrice: vesPrice,
      usdToVesRate: usdToVesRate,
      timestamp: Date.now(),
      fallback: true,
      source: 'binance-p2p-fallback'
    })
  }
}
