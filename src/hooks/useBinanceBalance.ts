import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export type SpotBalance = {
  usdt: { free: number; locked: number; total: number }
  funding?: { free: number; locked: number; freeze: number; total: number }
  spot?: {
    usdt: { free: number; locked: number; total: number }
    estimatedTotalUsdt: number
    assets: Array<{
      asset: string
      free: number
      locked: number
      total: number
      usdtValue: number
    }>
  }
  estimatedTotalUsdt: number
  usdtTotal?: number
  assets?: Array<{
    asset: string
    free: number
    locked: number
    total: number
    usdtValue: number
  }>
  wallet: string
  fetchedAt: string
  history?: {
    month: string
    highUsdtTotal: number | null
    highDateYmd: string | null
    lowUsdtTotal: number | null
    lowDateYmd: string | null
    daysTracked: number
  } | null
}

async function fetchBalance(): Promise<SpotBalance> {
  try {
    const response = await axios.get('/api/binance/balance')
    if (!response.data.success) {
      const err = new Error(response.data.error || 'Error al obtener saldo') as Error & {
        code?: string
        hint?: string
      }
      err.code = response.data.code
      err.hint = response.data.hint
      throw err
    }
    return response.data.balance as SpotBalance
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data
      const err = new Error(data.error || data.message || 'Error al obtener saldo') as Error & {
        code?: string
        hint?: string
      }
      err.code = data.code
      err.hint = data.hint
      throw err
    }
    throw error
  }
}

/** Saldo Spot+Funding: se consulta menos a menudo que métricas (llama a Binance). */
export function useBinanceBalance() {
  return useQuery({
    queryKey: ['binance-balance'],
    queryFn: fetchBalance,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useInvalidateBinanceBalance() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['binance-balance'] })
}
