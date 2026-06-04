import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { FormData } from '@/utils/calculations'

interface TransactionResponse {
  success: boolean
  transaction?: any
  message?: string
  error?: string
}

interface BalanceResponse {
  success: boolean
  data?: {
    dailyBalances: any[]
    summary: {
      totalTransactions: number
      totalUsdtAmount: number
      totalGrossProfit: number
      totalNetProfit: number
      totalCosts: number
      averageROI: number
      averageDailyProfit: number
      projectedMonthly: number
      bestDay: number
      worstDay: number
      totalDays: number
    }
  }
  error?: string
}

export function useSaveTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData): Promise<TransactionResponse> => {
      const response = await axios.post('/api/transactions', formData)
      return response.data
    },
    onSuccess: () => {
      // Invalidar las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    }
  })
}

export function useTransactions(date?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['transactions', date, limit],
    queryFn: async (): Promise<TransactionResponse> => {
      const params = new URLSearchParams()
      if (date) params.append('date', date)
      params.append('limit', limit.toString())
      
      const response = await axios.get(`/api/transactions?${params}`)
      return response.data
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000
  })
}

export function useBalance(date?: string, days: number = 7) {
  return useQuery({
    queryKey: ['balance', date, days],
    queryFn: async (): Promise<BalanceResponse> => {
      const params = new URLSearchParams()
      if (date) params.append('date', date)
      params.append('days', days.toString())
      
      const response = await axios.get(`/api/balance?${params}`)
      return response.data
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000
  })
}

