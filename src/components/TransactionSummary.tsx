'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Select,
  useToast,
} from '@chakra-ui/react'
import axios from 'axios'
import { UI_POLL_DATABASE_MS } from '@/lib/sync-constants'

interface TransactionSummaryMetrics {
  totalTransactions: number
  completedTransactions: number
  pendingBuy: number
  pendingSell: number
}

type DateFilter = 'week' | 'month' | 'threeMonths' | 'all'

export default function TransactionSummary() {
  const [metrics, setMetrics] = useState<TransactionSummaryMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const toast = useToast()

  useEffect(() => {
    loadMetrics()
    
    // Poll solo MongoDB (no Binance)
    const interval = setInterval(loadMetrics, UI_POLL_DATABASE_MS)
    
    // Escuchar eventos de sincronización
    const handleSync = () => {
      setTimeout(loadMetrics, 1000) // Esperar 1 segundo para que se procesen las transacciones
    }
    window.addEventListener('binance-sync-completed', handleSync)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('binance-sync-completed', handleSync)
    }
  }, [dateFilter])

  const loadMetrics = async () => {
    try {
      const response = await axios.get('/api/binance/metrics', {
        params: {
          dateFilter,
        },
      })
      if (response.data.success) {
        setMetrics({
          totalTransactions: response.data.metrics.totalTransactions,
          completedTransactions: response.data.metrics.completedTransactions,
          pendingBuy: response.data.metrics.pendingBuy,
          pendingSell: response.data.metrics.pendingSell,
        })
      }
    } catch (error) {
      console.error('Error cargando resumen de transacciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'week':
        return 'Última Semana'
      case 'month':
        return 'Último Mes'
      case 'threeMonths':
        return 'Últimos 3 Meses'
      case 'all':
      default:
        return 'Todos'
    }
  }

  if (isLoading && !metrics) {
    return (
      <Card>
        <CardBody>
          <Text>Cargando resumen...</Text>
        </CardBody>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center">
            No hay datos disponibles.
          </Text>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        pb={3}
        borderBottomWidth="1px"
        borderColor="surface.border"
        bg="surface.muted"
      >
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" color="gray.800">
              Resumen de transacciones
            </Text>
            <Text fontSize="xs" color="gray.500">
              {getFilterLabel(dateFilter)}
            </Text>
          </Box>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            size="sm"
            maxW="200px"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mes</option>
            <option value="threeMonths">Últimos 3 Meses</option>
            <option value="all">Todos</option>
          </Select>
        </HStack>
      </CardHeader>
      <CardBody pt={4}>
        <Box
          p={{ base: 3, md: 4 }}
          bg="surface.muted"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="surface.border"
        >
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
            <VStack align="start" spacing={0.5}>
              <Text fontSize="10px" color="gray.600">Transacciones</Text>
              <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                {metrics.totalTransactions}
              </Text>
            </VStack>
            <VStack align="start" spacing={0.5}>
              <Text fontSize="10px" color="gray.600">Completadas</Text>
              <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.600">
                {metrics.completedTransactions}
              </Text>
            </VStack>
            <VStack align="start" spacing={0.5}>
              <Text fontSize="10px" color="gray.600">Pendientes Compra</Text>
              <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="orange.600">
                {metrics.pendingBuy.toFixed(2)} USDT
              </Text>
            </VStack>
            <VStack align="start" spacing={0.5}>
              <Text fontSize="10px" color="gray.600">Pendientes Venta</Text>
              <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="purple.600">
                {metrics.pendingSell.toFixed(2)} USDT
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>
      </CardBody>
    </Card>
  )
}
