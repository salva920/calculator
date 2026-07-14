import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { UI_POLL_DATABASE_MS } from '@/lib/sync-constants'
import type { DashboardMetrics } from '@/types/metrics'

async function fetchMetrics(refresh = false): Promise<DashboardMetrics> {
  const url = refresh ? '/api/binance/metrics?refresh=1' : '/api/binance/metrics'
  const response = await axios.get(url)
  if (!response.data.success) {
    throw new Error(response.data.error || 'Error al cargar métricas')
  }
  return response.data.metrics as DashboardMetrics
}

export function useBinanceMetrics() {
  return useQuery({
    queryKey: ['binance-metrics'],
    queryFn: () => fetchMetrics(false),
    refetchInterval: UI_POLL_DATABASE_MS,
    staleTime: 5_000,
  })
}

export function useRefreshBinanceMetrics() {
  const queryClient = useQueryClient()
  return async (refresh = true) => {
    const metrics = await fetchMetrics(refresh)
    queryClient.setQueryData(['binance-metrics'], metrics)
    return metrics
  }
}

export function useInvalidateBinanceMetrics() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['binance-metrics'] })
}
