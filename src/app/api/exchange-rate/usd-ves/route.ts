export { dynamic } from '@/lib/route-config'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener la tasa de cambio desde DolarToday
    const response = await axios.get(
      'https://api.dolartoday.com/v1/dolartoday',
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Binance-P2P-Calculator/1.0.0'
        }
      }
    )
    
    const usdToVesRate = response.data.USD.dolartoday
    
    return NextResponse.json({
      usdToVesRate: usdToVesRate,
      source: 'dolartoday',
      timestamp: Date.now()
    })
    
  } catch {
    
    // Fallback a una tasa simulada
    const fallbackRate = 36.5
    
    return NextResponse.json({
      usdToVesRate: fallbackRate,
      source: 'fallback',
      timestamp: Date.now(),
      fallback: true
    })
  }
}
