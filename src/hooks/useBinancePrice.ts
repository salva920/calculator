import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BINANCE_PRICE_REFETCH_MS } from '@/lib/sync-constants'

interface BinancePriceResponse {
  symbol: string
  usdPrice: number
  vesPrice: number
  usdToVesRate: number
  timestamp: number
  fallback?: boolean
  source?: string
}

export function useBinancePrice() {
  return useQuery({
    queryKey: ['binance-price'],
    queryFn: async (): Promise<{ price: number; isFallback: boolean; timestamp: number; source?: string }> => {
      try {
        // Usar nuestra API route que obtiene USDT/VES
        const response = await axios.get<BinancePriceResponse>('/api/binance/price')
        
        return {
          price: response.data.vesPrice,
          isFallback: response.data.fallback || false,
          timestamp: response.data.timestamp,
          source: response.data.source
        }
      } catch (error) {
        console.error('Error fetching Binance price:', error)
        throw new Error('No se pudo obtener el precio de Binance')
      }
    },
    refetchInterval: BINANCE_PRICE_REFETCH_MS,
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1000,
  })
}

// Hook para obtener el precio real de USDT/VES desde una API venezolana
export function useVenezuelanPrice() {
  return useQuery({
    queryKey: ['venezuelan-price'],
    queryFn: async (): Promise<number> => {
      try {
        // Usar nuestra API route que hace el proxy a DolarToday
        const response = await axios.get('/api/exchange-rate/usd-ves')
        
        return response.data.usdToVesRate
      } catch (error) {
        console.error('Error fetching Venezuelan price:', error)
        // Fallback a un precio simulado
        return 36.5
      }
    },
    refetchInterval: 60000, // Refrescar cada minuto
    staleTime: 30000,
    retry: 2,
  })
}
