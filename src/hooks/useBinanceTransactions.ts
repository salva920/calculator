import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { UI_POLL_DATABASE_MS } from '@/lib/sync-constants'

export interface BinanceTransaction {
  id: string
  binanceOrderId: string
  orderNumber: string
  tradeType: 'BUY' | 'SELL'
  asset: string
  fiat: string
  fiatAmount: number
  amount: number
  unitPrice: number
  orderStatus: string
  createTime: string
  commission: number
  counterPartName: string
  paymentMethod: string
  isSynced: boolean
  sellKyc?: {
    bankName: string | null
  } | null
}

async function fetchTransactions(
  params: Record<string, string>
): Promise<BinanceTransaction[]> {
  const response = await axios.get('/api/binance/transactions', { params })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Error al cargar transacciones')
  }
  return (response.data.transactions ?? []) as BinanceTransaction[]
}

export function useBinanceTransactions(params: Record<string, string>) {
  return useQuery({
    queryKey: ['binance-transactions', params],
    queryFn: () => fetchTransactions(params),
    refetchInterval: UI_POLL_DATABASE_MS,
    staleTime: 5_000,
  })
}

export function useInvalidateBinanceTransactions() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['binance-transactions'] })
}
