'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  FormControl,
  FormLabel,
  Heading,
  VStack,
  HStack,
  Input,
  Select,
  Text,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  useToast,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { FaChartLine, FaDollarSign, FaShoppingCart, FaArrowUp, FaArrowDown, FaSync } from 'react-icons/fa'
import axios from 'axios'

interface DashboardMetrics {
  totalProfit: number
  totalProfitToday: number
  totalTransactions: number
  completedTransactions: number
  pendingBuy: number
  pendingSell: number
  totalBuyAmount: number
  totalSellAmount: number
  totalBuyValue: number
  totalSellValue: number
  averageBuyPrice: number
  averageSellPrice: number
  profitMargin: number
  roi: number
  totalVolume: number
  completedCycles: number
  pendingToBuy: number
  pendingToSell: number
  // Métricas de HOY
  todayBuyAmount: number
  todaySellAmount: number
  todayBuyValue: number
  todaySellValue: number
  todayPendingBuyAmount: number
  todayPendingSellAmount: number
  todayTransactionsCount: number
  todayCompletedCount: number
  todayVolume: number
  todayCompletedCycles: number
  cycleSizeUsdt?: number
  todayCyclesVolumeUsdt?: number
  todayCyclesVolumeBs?: number
  todayCyclesSummary?: {
    cycles: { cycleNumber: number; sellUsdtAmount: number; buyUsdtAmount: number; netProfit: number; cumulativeProfit: number }[]
    totalProfitFromCycles: number
  }
  currentCycleSoldUsdt?: number
  currentCycleBoughtUsdt?: number
  remainingToSellUsdt?: number
  remainingToBuyUsdt?: number
  remainingToSellBs?: number
  remainingToBuyBs?: number
  manualBuyEquivalent?: number
  manualSellEquivalent?: number
  adjustedTotalBuyAmount?: number
  adjustedTotalSellAmount?: number
  manualNetUsdt?: number
  closedCyclesProfitTotal?: number
  lastClosedCycleProfit?: number
  manualAdjustments?: {
    id: string
    type: 'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT'
    usdtAmount: number
    note: string | null
    createdAt: string
  }[]
  // Métricas de brecha y estimaciones
  latestBuyPrice: number
  latestSellPrice: number
  currentGap: number
  currentGapPercent: number
  estimatedProfitPerUsdt: number
  estimatedROI: number
  buyPriceTrend: 'increasing' | 'decreasing' | 'stable'
  isGapTooSmall: boolean
}

export default function P2PDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false)
  const [showManualAdjustments, setShowManualAdjustments] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT'>('BUY_EXTERNAL')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const isSyncingRef = useRef(false)
  const toast = useToast()

  // Sincronizar con Binance en segundo plano (actualiza la BD desde la API)
  const runBackgroundSync = async () => {
    if (isSyncingRef.current) return
    try {
      const res = await axios.post('/api/binance/sync')
      if (res.data?.success && (res.data.newTransactions > 0 || res.data.updatedTransactions > 0)) {
        window.dispatchEvent(new CustomEvent('binance-sync-completed'))
        setTimeout(() => loadMetrics(true), 800)
      }
    } catch {
      // Silencioso: no molestar al usuario si falla la sync en segundo plano
    }
  }

  useEffect(() => {
    loadMetrics(true)
    const interval = setInterval(() => loadMetrics(false), 5000)
    // Sincronizar con Binance cada 2 min para que la BD (y las compras hoy) se actualicen desde la API
    const syncInterval = setInterval(runBackgroundSync, 2 * 60 * 1000)
    const handleSync = () => {
      setTimeout(() => loadMetrics(true), 1000)
    }
    window.addEventListener('binance-sync-completed', handleSync)
    return () => {
      clearInterval(interval)
      clearInterval(syncInterval)
      window.removeEventListener('binance-sync-completed', handleSync)
    }
  }, [])

  const loadMetrics = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? '/api/binance/metrics?refresh=1' : '/api/binance/metrics'
      const response = await axios.get(url)
      if (response.data.success) {
        setMetrics(response.data.metrics)
      }
    } catch (error) {
      console.error('Error cargando métricas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    isSyncingRef.current = true
    try {
      const response = await axios.post('/api/binance/sync')
      if (response.data.success) {
        toast({
          title: 'Sincronización completada',
          description: `${response.data.newTransactions || 0} nuevas transacciones sincronizadas`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new CustomEvent('binance-sync-completed'))
        // Recargar métricas con refresh para que se actualicen las compras/ventas de hoy
        setTimeout(() => { loadMetrics(true) }, 800)
      }
    } catch (error: any) {
      toast({
        title: 'Error de sincronización',
        description: error.response?.data?.error || 'No se pudo sincronizar las transacciones',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSyncing(false)
      isSyncingRef.current = false
    }
  }

  const handleCreateAdjustment = async () => {
    const parsedAmount = Number(adjustmentAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Monto inválido',
        description: 'Ingresa un monto USDT mayor a 0',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSavingAdjustment(true)
    try {
      const response = await axios.post('/api/manual-adjustments', {
        type: adjustmentType,
        usdtAmount: parsedAmount,
        note: adjustmentNote,
      })

      if (response.data?.success) {
        toast({
          title: 'Ajuste guardado',
          description: 'El saldo acumulado fue actualizado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setAdjustmentAmount('')
        setAdjustmentNote('')
        loadMetrics(true)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo guardar el ajuste',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsSavingAdjustment(false)
    }
  }

  const handleDeleteAdjustment = async (id: string) => {
    try {
      const response = await axios.delete('/api/manual-adjustments', { params: { id } })
      if (response.data?.success) {
        loadMetrics(true)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo eliminar el ajuste',
        status: 'error',
        duration: 3500,
        isClosable: true,
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <Text>Cargando métricas...</Text>
        </CardBody>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center">
            No hay métricas disponibles. Sincroniza tus transacciones primero.
          </Text>
        </CardBody>
      </Card>
    )
  }

  const adjustedBuy = metrics.adjustedTotalBuyAmount ?? metrics.totalBuyAmount
  const adjustedSell = metrics.adjustedTotalSellAmount ?? metrics.totalSellAmount
  const totalSellValue = metrics.totalSellValue ?? 0
  const totalBuyValue = metrics.totalBuyValue ?? 0

  return (
    <Card>
      <CardHeader pb={3}>
        <VStack spacing={2} align="stretch">
          {/* Indicador de estado en línea - En la parte superior del header */}
          <HStack justify="space-between" flexWrap="wrap">
            <HStack spacing={2}>
              <Tooltip label="Sincronizar transacciones ahora">
                <IconButton
                  aria-label="Sincronizar"
                  icon={<FaSync />}
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  onClick={handleSync}
                  isLoading={isSyncing}
                  isDisabled={isSyncing}
                />
              </Tooltip>
            </HStack>
            <HStack spacing={3}>
              <Box
                as="span"
                w="10px"
                h="10px"
                bg="green.400"
                borderRadius="full"
                display="inline-block"
                animation="pulse 2s infinite"
                sx={{
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
            </HStack>
          </HStack>
          
          {/* Métricas Principales en el Header - Una Fila */}
          <SimpleGrid columns={{ base: 2, sm: 2, md: 3 }} spacing={{ base: 2, sm: 3, md: 4 }}>
            <Stat px={{ base: 1, md: 2 }}>
              <StatLabel fontSize={{ base: '10px', sm: 'xs', md: 'sm' }} mb={0.5}>Ganancia</StatLabel>
              <StatNumber fontSize={{ base: 'md', sm: 'lg', md: 'xl' }} color={metrics.totalProfit >= 0 ? 'green.400' : 'red.400'} lineHeight="1.2">
                {metrics.totalProfit.toLocaleString('es-VE', {
                  style: 'currency',
                  currency: 'VES',
                  maximumFractionDigits: 0,
                })}
              </StatNumber>
              <StatHelpText fontSize="10px" mt={0.5} mb={0}>
                <StatArrow type={metrics.totalProfitToday >= 0 ? 'increase' : 'decrease'} />
                Hoy: {metrics.totalProfitToday.toLocaleString('es-VE', {
                  style: 'currency',
                  currency: 'VES',
                  maximumFractionDigits: 0,
                })}
              </StatHelpText>
            </Stat>

            <Stat px={{ base: 1, md: 2 }}>
              <StatLabel fontSize={{ base: '10px', sm: 'xs', md: 'sm' }} mb={0.5}>(ROI)</StatLabel>
              <StatNumber fontSize={{ base: 'md', sm: 'lg', md: 'xl' }} color={metrics.roi >= 0 ? 'green.400' : 'red.400'} lineHeight="1.2">
                {metrics.roi.toFixed(2)}%
              </StatNumber>
              <StatHelpText fontSize="10px" mt={0.5} mb={0}>
                Margen: {metrics.profitMargin.toFixed(2)}%
              </StatHelpText>
            </Stat>

            <Stat px={{ base: 1, md: 2 }}>
              <StatLabel fontSize={{ base: '10px', sm: 'xs', md: 'sm' }} mb={0.5}>Volumen</StatLabel>
              <StatNumber fontSize={{ base: 'md', sm: 'lg', md: 'xl' }} lineHeight="1.2">
                {metrics.todayVolume.toFixed(2)} USDT
              </StatNumber>
              <StatHelpText fontSize="10px" mt={0.5} mb={0}>
                {metrics.todayCompletedCount} completadas
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </VStack>
      </CardHeader>
      <CardBody pt={4}>
        <VStack spacing={3} align="stretch">

          {/* Ordenes de HOY - Compacto */}
          <Box p={{ base: 2, md: 3 }} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
            <HStack justify="space-between" mb={2} flexWrap="wrap">
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="yellow.700">
                Ordenes
              </Text>
              <Text fontSize="10px" color="gray.600">
                {metrics.todayTransactionsCount} ({metrics.todayCompletedCount} completadas)
              </Text>
            </HStack>

            {/* Resumen de ganancia por ciclos hoy (sin listar cada ciclo) */}
            {metrics.todayCyclesSummary && metrics.todayCyclesSummary.cycles.length > 0 && (
              <Box mb={3} p={2} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="green.700" mb={1}>
                  Ganancia por ciclos hoy
                </Text>
                <HStack justify="space-between" flexWrap="wrap" align="center">
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700">
                    {metrics.todayCyclesSummary.cycles.length} ciclo{metrics.todayCyclesSummary.cycles.length !== 1 ? 's' : ''} completados
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={metrics.todayCyclesSummary.totalProfitFromCycles >= 0 ? 'green.600' : 'red.600'}>
                    Total: {metrics.todayCyclesSummary.totalProfitFromCycles.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.S
                  </Text>
                </HStack>
              </Box>
            )}

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
              <Box>
                <HStack justify="space-between" mb={0.5}>
                  <HStack spacing={1}>
                    <FaArrowUp size={12} color="red" />
                    <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="red.600">
                      Ventas
                    </Text>
                  </HStack>
                  <Badge colorScheme="red" fontSize={{ base: '10px', md: 'xs' }} px={1.5} py={0.5}>
                    {metrics.todaySellAmount.toFixed(2)} USDT
                  </Badge>
                </HStack>
                <Text fontSize="10px" color="gray.600">
                  Bs.S recibidos:{' '}
                  {metrics.todaySellValue.toLocaleString('es-VE', {
                    style: 'currency',
                    currency: 'VES',
                    maximumFractionDigits: 0,
                  })}
                </Text>
                {metrics.todayPendingSellAmount > 0 && (
                  <Text fontSize="10px" color="orange.600" mt={0.5}>
                    ⏳ {metrics.todayPendingSellAmount.toFixed(2)} USDT pendiente
                  </Text>
                )}
                {(metrics.currentCycleSoldUsdt ?? 0) >= 0.01 && (
                  <Text fontSize="10px" color="gray.500" mt={1} pt={1} borderTopWidth="1px" borderColor="yellow.200">
                    Ciclo abierto: {(metrics.currentCycleSoldUsdt ?? 0).toFixed(2)} USDT
                    {metrics.latestSellPrice > 0 && (
                      <>
                        {' '}
                        · ~{' '}
                        {(metrics.remainingToSellBs ?? 0).toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES',
                          maximumFractionDigits: 0,
                        })}
                      </>
                    )}
                  </Text>
                )}
              </Box>

              <Box>
                <HStack justify="space-between" mb={0.5}>
                  <HStack spacing={1}>
                    <FaArrowDown size={12} color="green" />
                    <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="green.600">
                      Compras
                    </Text>
                  </HStack>
                  <Badge colorScheme="green" fontSize={{ base: '10px', md: 'xs' }} px={1.5} py={0.5}>
                    {metrics.todayBuyAmount.toFixed(2)} USDT
                  </Badge>
                </HStack>
                <Text fontSize="10px" color="gray.600">
                  Bs.S pagados:{' '}
                  {metrics.todayBuyValue.toLocaleString('es-VE', {
                    style: 'currency',
                    currency: 'VES',
                    maximumFractionDigits: 0,
                  })}
                </Text>
                {metrics.todayPendingBuyAmount > 0 && (
                  <Text fontSize="10px" color="orange.600" mt={0.5}>
                    ⏳ {metrics.todayPendingBuyAmount.toFixed(2)} USDT pendiente
                  </Text>
                )}
                {(metrics.currentCycleBoughtUsdt ?? 0) >= 0.01 && (
                  <Text fontSize="10px" color="gray.500" mt={1} pt={1} borderTopWidth="1px" borderColor="yellow.200">
                    Ciclo abierto: {(metrics.currentCycleBoughtUsdt ?? 0).toFixed(2)} USDT
                    {metrics.latestBuyPrice > 0 && (
                      <>
                        {' '}
                        · ~{' '}
                        {(metrics.remainingToBuyBs ?? 0).toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES',
                          maximumFractionDigits: 0,
                        })}
                      </>
                    )}
                  </Text>
                )}
              </Box>
            </SimpleGrid>
          </Box>

          {/* Indicadores de Balance Acumulado - Compactos */}
          {metrics.pendingToBuy > 0 && (
            <Box p={{ base: 2, md: 3 }} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
              <HStack justify="space-between" mb={2} flexWrap="wrap">
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="orange.700" flex="1" minW="0">
                  Desbalance acumulado
                </Text>
                <Badge colorScheme="orange" fontSize={{ base: 'sm', md: 'md' }} px={2} py={1}>
                  {metrics.pendingToBuy.toFixed(2)} USDT
                </Badge>
              </HStack>
              <Progress
                value={adjustedBuy > 0
                  ? Math.min((adjustedBuy / (adjustedBuy + metrics.pendingToBuy)) * 100, 100)
                  : 0}
                colorScheme="orange"
                size="sm"
                borderRadius="md"
              />
              <Text fontSize="10px" color="gray.600" mt={1}>
                {adjustedBuy.toFixed(2)} / {(adjustedBuy + metrics.pendingToBuy).toFixed(2)} USDT
              </Text>
            </Box>
          )}

          <Box p={{ base: 2, md: 3 }} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
            <HStack justify="space-between" align="center">
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="gray.700">
                Ajustes manuales (BPay / gasto / fuera de Binance)
              </Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setShowManualAdjustments((prev) => !prev)}
              >
                {showManualAdjustments ? 'Ocultar' : 'Mostrar'}
              </Button>
            </HStack>

            <Collapse in={showManualAdjustments} animateOpacity>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2} mt={2} mb={2}>
                <FormControl>
                  <FormLabel fontSize="xs" mb={1}>Tipo</FormLabel>
                  <Select
                    size="sm"
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as 'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT')}
                  >
                    <option value="BUY_EXTERNAL">Compra externa (+BUY)</option>
                    <option value="SETTLEMENT">Liquidación manual (+BUY)</option>
                    <option value="SELL_EXTERNAL">Venta externa (+SELL)</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" mb={1}>USDT</FormLabel>
                  <Input
                    size="sm"
                    type="number"
                    min="0"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Ej: 100"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" mb={1}>Nota</FormLabel>
                  <Input
                    size="sm"
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    placeholder="Ej: Comprado por BPay"
                  />
                </FormControl>
              </SimpleGrid>
              <HStack justify="space-between" align="start" flexWrap="wrap">
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.600">
                    Manual +BUY: {(metrics.manualBuyEquivalent || 0).toFixed(2)} USDT
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Manual +SELL: {(metrics.manualSellEquivalent || 0).toFixed(2)} USDT
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Manual neto: {(metrics.manualNetUsdt || 0).toFixed(2)} USDT
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleCreateAdjustment}
                  isLoading={isSavingAdjustment}
                >
                  Guardar ajuste
                </Button>
              </HStack>

              {(metrics.manualAdjustments || []).length > 0 && (
                <VStack mt={2} align="stretch" spacing={1}>
                  {metrics.manualAdjustments?.map((adj) => (
                    <HStack key={adj.id} justify="space-between" fontSize="xs" color="gray.700">
                      <Text>
                        {new Date(adj.createdAt).toLocaleString('es-VE')} · {adj.type} · {adj.usdtAmount.toFixed(2)} USDT
                        {adj.note ? ` · ${adj.note}` : ''}
                      </Text>
                      <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDeleteAdjustment(adj.id)}>
                        Eliminar
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Collapse>
          </Box>

          {metrics.pendingToSell > 0 && (
            <Box p={{ base: 2, md: 3 }} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
              <HStack justify="space-between" mb={2} flexWrap="wrap">
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="purple.700" flex="1" minW="0">
                  Desbalance acumulado
                </Text>
                <Badge colorScheme="purple" fontSize={{ base: 'sm', md: 'md' }} px={2} py={1}>
                  {metrics.pendingToSell.toFixed(2)} USDT
                </Badge>
              </HStack>
              <Progress
                value={adjustedSell > 0
                  ? Math.min((adjustedSell / (adjustedSell + metrics.pendingToSell)) * 100, 100)
                  : 0}
                colorScheme="purple"
                size="sm"
                borderRadius="md"
              />
              <Text fontSize="10px" color="gray.600" mt={1}>
                {adjustedSell.toFixed(2)} / {(adjustedSell + metrics.pendingToSell).toFixed(2)} USDT
              </Text>
            </Box>
          )}

          {metrics.pendingToBuy === 0 && metrics.pendingToSell === 0 && metrics.todayBuyAmount > 0 && metrics.todaySellAmount > 0 && (
            <Box p={{ base: 2, md: 3 }} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
              <HStack>
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="green.700">
                  ✓ Balance Equilibrado
                </Text>
              </HStack>
            </Box>
          )}

          {/* Alerta de Brecha de Tasas */}
          {metrics.isGapTooSmall && metrics.latestBuyPrice > 0 && (
            <Box p={{ base: 2, md: 3 }} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
              <VStack align="start" spacing={2}>
                <HStack>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="red.700">
                    ⚠️ Brecha de Tasas Muy Pequeña
                  </Text>
                </HStack>
                <Text fontSize="10px" color="gray.700" lineHeight="1.4">
                  La diferencia entre tu tasa de venta ({metrics.latestSellPrice.toFixed(2)} Bs.S) y compra ({metrics.latestBuyPrice.toFixed(2)} Bs.S) es solo del {metrics.currentGapPercent.toFixed(2)}%.
                  {metrics.buyPriceTrend === 'increasing' && ' Estás subiendo la tasa de compra, considera ajustar tu tasa de venta también.'}
                  {metrics.buyPriceTrend === 'decreasing' && ' La tasa de compra está bajando, puede ser buen momento para comprar.'}
                </Text>
                <HStack spacing={4} flexWrap="wrap">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Ganancia Estimada/USDT</Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color={metrics.estimatedProfitPerUsdt > 0 ? 'green.600' : 'red.600'}>
                      {metrics.estimatedProfitPerUsdt.toFixed(2)} Bs.S
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">ROI Estimado</Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color={metrics.estimatedROI > 0 ? 'green.600' : 'red.600'}>
                      {metrics.estimatedROI.toFixed(2)}%
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* Información de Brecha Actual (siempre visible si hay datos) */}
          {!metrics.isGapTooSmall && metrics.latestBuyPrice > 0 && metrics.latestSellPrice > 0 && (
            <Box p={{ base: 2, md: 3 }} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="full" flexWrap="wrap">
                  <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="blue.700">
                    📊 Brecha Actual de Tasas
                  </Text>
                  {metrics.buyPriceTrend === 'increasing' && (
                    <Badge colorScheme="orange" fontSize="10px">Tasa Subiendo ↗️</Badge>
                  )}
                  {metrics.buyPriceTrend === 'decreasing' && (
                    <Badge colorScheme="green" fontSize="10px">Tasa Bajando ↘️</Badge>
                  )}
                </HStack>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} w="full">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Compra Reciente</Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                      {metrics.latestBuyPrice.toFixed(2)} Bs.S
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Venta Reciente</Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                      {metrics.latestSellPrice.toFixed(2)} Bs.S
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Brecha</Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.600">
                      {metrics.currentGap.toFixed(2)} Bs.S ({metrics.currentGapPercent.toFixed(2)}%)
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Ganancia Est./USDT</Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.600">
                      {metrics.estimatedProfitPerUsdt.toFixed(2)} Bs.S
                    </Text>
                  </VStack>
                </SimpleGrid>
                {metrics.todayCyclesSummary && (metrics.todayCyclesVolumeUsdt ?? 0) > 0 && (
                  <Box w="full" pt={2} borderTopWidth="1px" borderColor="blue.200">
                    <Text fontSize="10px" color="gray.600" mb={1}>
                      Ganancia real vs estimada (ciclos de hoy)
                    </Text>
                    <HStack spacing={4} flexWrap="wrap">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Real hoy</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color={metrics.todayCyclesSummary.totalProfitFromCycles >= 0 ? 'green.600' : 'red.600'}>
                          {metrics.todayCyclesSummary.totalProfitFromCycles.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.S
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Real /USDT (ciclos)</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color={metrics.todayCyclesSummary.totalProfitFromCycles >= 0 ? 'green.600' : 'red.600'}>
                          {(
                            metrics.todayCyclesSummary.totalProfitFromCycles /
                            (metrics.todayCyclesVolumeUsdt || 1)
                          ).toFixed(2)} Bs.S
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Estimada /USDT (brecha)</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.600">
                          {metrics.estimatedProfitPerUsdt.toFixed(2)} Bs.S
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

