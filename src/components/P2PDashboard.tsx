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
  Divider,
} from '@chakra-ui/react'
import { FaArrowUp, FaArrowDown, FaSync, FaWallet, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import axios from 'axios'
import { requestBinanceSync } from '@/lib/binance-sync-client'
import { useBinanceMetrics, useRefreshBinanceMetrics } from '@/hooks/useBinanceMetrics'
import { useBinanceBalance, useInvalidateBinanceBalance } from '@/hooks/useBinanceBalance'
import InsightPanel from '@/components/ui/InsightPanel'

const WALLET_BANNER_STORAGE_KEY = 'p2p-show-wallet-banner'

function formatVes(value: number, fractionDigits = 0) {
  return value.toLocaleString('es-VE', {
    style: 'currency',
    currency: 'VES',
    maximumFractionDigits: fractionDigits,
  })
}

export default function P2PDashboard() {
  const { data: metrics, isLoading } = useBinanceMetrics()
  const refreshMetrics = useRefreshBinanceMetrics()
  const { data: balance, isLoading: isBalanceLoading, error: balanceError, refetch: refetchBalance } =
    useBinanceBalance()
  const invalidateBalance = useInvalidateBinanceBalance()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false)
  const [showManualAdjustments, setShowManualAdjustments] = useState(false)
  const [showWalletBanner, setShowWalletBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT'>('BUY_EXTERNAL')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const isSyncingRef = useRef(false)
  const toast = useToast()

  useEffect(() => {
    try {
      setShowWalletBanner(localStorage.getItem(WALLET_BANNER_STORAGE_KEY) === '1')
    } catch {
      // ignore
    }
  }, [])

  const toggleWalletBanner = () => {
    setShowWalletBanner((prev) => {
      const next = !prev
      try {
        localStorage.setItem(WALLET_BANNER_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  useEffect(() => {
    const handleSync = () => {
      setTimeout(() => {
        void refreshMetrics(true)
        invalidateBalance()
      }, 1000)
    }
    window.addEventListener('binance-sync-completed', handleSync)
    return () => window.removeEventListener('binance-sync-completed', handleSync)
  }, [refreshMetrics, invalidateBalance])

  const handleSync = async () => {
    setIsSyncing(true)
    isSyncingRef.current = true
    try {
      const response = await requestBinanceSync({ force: true })
      if (response.code === 'BINANCE_GEO_RESTRICTED') {
        toast({
          title: 'Binance bloqueado en Vercel',
          description:
            response.hint ||
            'Sincroniza desde tu PC con npm run dev o configura BINANCE_HTTP_PROXY en Vercel.',
          status: 'warning',
          duration: 12000,
          isClosable: true,
        })
        return
      }
      if (response.success) {
        if (response.skipped) {
          toast({
            title: 'Datos al día',
            description: 'La última sincronización con Binance fue hace poco.',
            status: 'info',
            duration: 2500,
            isClosable: true,
          })
        } else {
          toast({
            title: 'Sincronización completada',
            description: `${response.newTransactions || 0} nuevas transacciones sincronizadas`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }
        setTimeout(() => {
          void refreshMetrics(true)
          invalidateBalance()
        }, 800)
      } else if (response.error) {
        toast({
          title: 'Error de sincronización',
          description: response.error,
          status: 'error',
          duration: 6000,
          isClosable: true,
        })
      }
    } catch {
      toast({
        title: 'Error de sincronización',
        description: 'No se pudo sincronizar las transacciones',
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
        await refreshMetrics(true)
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
        await refreshMetrics(true)
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
  const liveCycleVisible =
    Boolean(metrics.liveCycleActive) &&
    (metrics.liveCycleSoldUsdt ?? 0) + (metrics.liveCycleBoughtUsdt ?? 0) > 0
  const hasRates = metrics.latestBuyPrice > 0 && metrics.latestSellPrice > 0
  const netToday = metrics.todayEstimatedNetBs ?? 0
  const netTodayUsdt = metrics.todayEstimatedNetUsdt ?? 0

  return (
    <Card>
      <CardHeader pb={3} borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
        <HStack justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="700" color="gray.700">
              Hoy
            </Text>
            <Box as="span" className="live-dot" w="8px" h="8px" bg="green.400" borderRadius="full" />
            {metrics.isGapTooSmall && hasRates && (
              <Badge colorScheme="red" fontSize="10px">
                Brecha baja
              </Badge>
            )}
          </HStack>
          <HStack spacing={1}>
            <Tooltip label={showWalletBanner ? 'Ocultar billetera' : 'Mostrar billetera'}>
              <IconButton
                aria-label={showWalletBanner ? 'Ocultar billetera' : 'Mostrar billetera'}
                icon={<FaWallet />}
                size="sm"
                colorScheme={showWalletBanner ? 'blue' : 'gray'}
                variant={showWalletBanner ? 'solid' : 'ghost'}
                onClick={toggleWalletBanner}
              />
            </Tooltip>
            <Tooltip label="Sincronizar ahora">
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
        </HStack>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
          <Stat>
            <StatLabel fontSize="xs" color="gray.500">
              Ganancia
            </StatLabel>
            <StatNumber
              fontSize={{ base: 'lg', md: 'xl' }}
              color={metrics.totalProfit >= 0 ? 'green.500' : 'red.500'}
              lineHeight="1.2"
            >
              {formatVes(metrics.totalProfit)}
            </StatNumber>
            <StatHelpText fontSize="xs" mt={1} mb={0}>
              <StatArrow type={metrics.totalProfitToday >= 0 ? 'increase' : 'decrease'} />
              Hoy {formatVes(metrics.totalProfitToday)}
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel fontSize="xs" color="gray.500">
              Neta hoy
            </StatLabel>
            <StatNumber
              fontSize={{ base: 'lg', md: 'xl' }}
              color={netToday >= 0 ? 'green.500' : 'red.500'}
              lineHeight="1.2"
            >
              {(metrics.todayMatchedUsdt ?? 0) > 0 ? formatVes(netToday) : '—'}
            </StatNumber>
            <StatHelpText fontSize="xs" mt={1} mb={0}>
              {(metrics.todayMatchedUsdt ?? 0) > 0 && (metrics.todayAvgBuyPrice ?? 0) > 0
                ? `~${netTodayUsdt.toFixed(1)} USDT`
                : 'Sin match hoy'}
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel fontSize="xs" color="gray.500">
              Brecha
            </StatLabel>
            <StatNumber
              fontSize={{ base: 'lg', md: 'xl' }}
              color={hasRates ? (metrics.isGapTooSmall ? 'orange.500' : 'green.500') : 'gray.400'}
              lineHeight="1.2"
            >
              {hasRates ? `${metrics.currentGapPercent.toFixed(2)}%` : '—'}
            </StatNumber>
            <StatHelpText fontSize="xs" mt={1} mb={0}>
              {hasRates
                ? `${metrics.latestBuyPrice.toFixed(0)} → ${metrics.latestSellPrice.toFixed(0)}`
                : 'Sin tasas'}
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel fontSize="xs" color="gray.500">
              Volumen
            </StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: 'xl' }} lineHeight="1.2">
              {metrics.todayVolume.toFixed(0)}
              <Text as="span" fontSize="sm" fontWeight="500" color="gray.500" ml={1}>
                USDT
              </Text>
            </StatNumber>
            <StatHelpText fontSize="xs" mt={1} mb={0}>
              {metrics.todayCompletedCount} completadas
            </StatHelpText>
          </Stat>
        </SimpleGrid>
      </CardHeader>

      <CardBody pt={4}>
        <VStack spacing={4} align="stretch">
          <Collapse in={showWalletBanner} animateOpacity>
            <InsightPanel accent="blue" p={{ base: 2, md: 3 }}>
              <HStack justify="space-between" mb={2} flexWrap="wrap" align="center">
                <HStack spacing={2}>
                  <FaWallet size={14} />
                  <Text fontSize="sm" fontWeight="bold" color="blue.800">
                    Billetera
                  </Text>
                </HStack>
                <HStack spacing={1}>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => void refetchBalance()}
                    isLoading={isBalanceLoading}
                  >
                    Actualizar
                  </Button>
                  <Button size="xs" variant="outline" onClick={toggleWalletBanner}>
                    Ocultar
                  </Button>
                </HStack>
              </HStack>

              {balance ? (
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">
                      USDT total
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="blue.700">
                      {(balance.usdtTotal ?? balance.usdt.total).toFixed(2)}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">
                      Funding
                    </Text>
                    <Text fontSize="md" fontWeight="bold">
                      {(balance.funding?.total ?? 0).toFixed(2)}
                    </Text>
                  </VStack>
                  {balance.history?.highUsdtTotal != null && (
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.600">
                        Máx. mes
                      </Text>
                      <Text fontSize="md" fontWeight="bold" color="green.600">
                        {balance.history.highUsdtTotal.toFixed(2)}
                      </Text>
                    </VStack>
                  )}
                </SimpleGrid>
              ) : isBalanceLoading ? (
                <Text fontSize="sm" color="gray.500">
                  Consultando saldo...
                </Text>
              ) : (
                <Text fontSize="sm" color="orange.600">
                  {(balanceError as any)?.code === 'BINANCE_GEO_RESTRICTED'
                    ? 'Binance bloqueado desde este servidor.'
                    : (balanceError as Error)?.message || 'No se pudo cargar el saldo.'}
                </Text>
              )}
            </InsightPanel>
          </Collapse>

          {/* Ventas vs Compras */}
          <SimpleGrid columns={2} spacing={3}>
            <Box
              p={3}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="red.100"
              bg="red.50"
            >
              <HStack justify="space-between" mb={1}>
                <HStack spacing={1.5}>
                  <FaArrowUp size={11} color="#C53030" />
                  <Text fontSize="xs" fontWeight="600" color="red.700">
                    Ventas
                  </Text>
                </HStack>
              </HStack>
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700" color="red.600">
                {metrics.todaySellAmount.toFixed(2)} USDT
              </Text>
              <Text fontSize="xs" color="gray.600" mt={0.5}>
                {formatVes(metrics.todaySellValue)}
              </Text>
              {metrics.todayPendingSellAmount > 0 && (
                <Text fontSize="xs" color="orange.600" mt={1}>
                  {metrics.todayPendingSellAmount.toFixed(2)} pendiente
                </Text>
              )}
            </Box>

            <Box
              p={3}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="green.100"
              bg="green.50"
            >
              <HStack justify="space-between" mb={1}>
                <HStack spacing={1.5}>
                  <FaArrowDown size={11} color="#276749" />
                  <Text fontSize="xs" fontWeight="600" color="green.700">
                    Compras
                  </Text>
                </HStack>
              </HStack>
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700" color="green.600">
                {metrics.todayBuyAmount.toFixed(2)} USDT
              </Text>
              <Text fontSize="xs" color="gray.600" mt={0.5}>
                {formatVes(metrics.todayBuyValue)}
              </Text>
              {metrics.todayPendingBuyAmount > 0 && (
                <Text fontSize="xs" color="orange.600" mt={1}>
                  {metrics.todayPendingBuyAmount.toFixed(2)} pendiente
                </Text>
              )}
            </Box>
          </SimpleGrid>

          {/* Ciclo en vivo compacto */}
          {liveCycleVisible && (
            <Box>
              <HStack justify="space-between" mb={1.5} flexWrap="wrap" gap={1}>
                <Text fontSize="xs" fontWeight="600" color="gray.600">
                  Ciclo en vivo
                </Text>
                <Badge
                  colorScheme={(metrics.liveCycleNetUsdtAfterAd ?? 0) >= 0 ? 'green' : 'red'}
                  fontSize="xs"
                >
                  {(metrics.liveCycleNetUsdtAfterAd ?? 0).toFixed(1)} USDT neto
                </Badge>
              </HStack>
              {(metrics.liveCycleSoldUsdt ?? 0) > 0 && (
                <>
                  <Progress
                    value={metrics.liveCycleProgressPercent ?? 0}
                    colorScheme={
                      (metrics.liveCycleProgressPercent ?? 0) >= 99
                        ? 'green'
                        : (metrics.liveCycleProgressPercent ?? 0) >= 50
                          ? 'blue'
                          : 'orange'
                    }
                    size="sm"
                    borderRadius="full"
                    mb={1}
                  />
                  <Text fontSize="xs" color="gray.500">
                    Recompra {(metrics.liveCycleBoughtUsdt ?? 0).toFixed(2)} /{' '}
                    {(metrics.liveCycleSoldUsdt ?? 0).toFixed(2)} USDT
                    {(metrics.liveCycleRemainingToBuyUsdt ?? 0) >= 0.01 && (
                      <> · faltan {(metrics.liveCycleRemainingToBuyUsdt ?? 0).toFixed(2)}</>
                    )}
                  </Text>
                </>
              )}
            </Box>
          )}

          <Button
            size="sm"
            variant="ghost"
            colorScheme="gray"
            alignSelf="center"
            rightIcon={showDetails ? <FaChevronUp /> : <FaChevronDown />}
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? 'Ocultar detalle' : 'Ver detalle'}
          </Button>

          <Collapse in={showDetails} animateOpacity>
            <VStack spacing={3} align="stretch" pt={1}>
              {/* Desglose del día */}
              {((metrics.todayMatchedUsdt ?? 0) > 0 || hasRates) && (
                <Box
                  p={3}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="surface.border"
                  bg="surface.muted"
                >
                  <Text fontSize="xs" fontWeight="700" color="gray.700" mb={2}>
                    Desglose del día
                  </Text>
                  {hasRates && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={3}>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.500">
                          Compra
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          {metrics.latestBuyPrice.toFixed(2)}
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.500">
                          Venta
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          {metrics.latestSellPrice.toFixed(2)}
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.500">
                          Brecha
                        </Text>
                        <Text fontSize="sm" fontWeight="600" color="green.600">
                          {metrics.currentGap.toFixed(2)} Bs ({metrics.currentGapPercent.toFixed(2)}%)
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.500">
                          Est./USDT
                        </Text>
                        <Text fontSize="sm" fontWeight="600" color="green.600">
                          {metrics.estimatedProfitPerUsdt.toFixed(2)} Bs
                        </Text>
                      </VStack>
                    </SimpleGrid>
                  )}
                  {(metrics.todayMatchedUsdt ?? 0) > 0 && (
                    <>
                      <Divider mb={2} />
                      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="10px" color="gray.500">
                            Emparejados
                          </Text>
                          <Text fontSize="sm" fontWeight="600">
                            {(metrics.todayMatchedUsdt ?? 0).toFixed(2)} USDT
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="10px" color="gray.500">
                            Spread
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="green.600">
                            {(metrics.todaySpread ?? 0).toFixed(2)} Bs
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="10px" color="gray.500">
                            Bruta
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="green.600">
                            {formatVes(metrics.todayEstimatedGrossBs ?? 0)}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="10px" color="gray.500">
                            Fee PM
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="orange.600">
                            −{formatVes(metrics.todayPagoMovilFeeBs ?? 0)}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="10px" color="gray.500">
                            Fee Binance
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="orange.600">
                            −{formatVes(metrics.todayBinanceFeeBs ?? 0)}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="10px" color="gray.500">
                            Neta
                          </Text>
                          <Text
                            fontSize="sm"
                            fontWeight="700"
                            color={netToday >= 0 ? 'green.600' : 'red.600'}
                          >
                            {formatVes(netToday)}
                            {(metrics.todayAvgBuyPrice ?? 0) > 0 && (
                              <Text as="span" fontSize="10px" color="gray.500" ml={1}>
                                (~{netTodayUsdt.toFixed(1)} USDT)
                              </Text>
                            )}
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </>
                  )}
                  {metrics.isGapTooSmall && hasRates && (
                    <Text fontSize="xs" color="orange.700" mt={2}>
                      Brecha solo {metrics.currentGapPercent.toFixed(2)}%. ROI est.{' '}
                      {metrics.estimatedROI.toFixed(2)}%.
                    </Text>
                  )}
                </Box>
              )}

              {/* Ciclo detalle */}
              {liveCycleVisible && (
                <Box
                  p={3}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="surface.border"
                  bg="surface.muted"
                >
                  <Text fontSize="xs" fontWeight="700" color="gray.700" mb={2}>
                    Detalle del ciclo
                  </Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={2}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.500">
                        Matched
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        {(metrics.liveCycleMatchedUsdt ?? 0).toFixed(2)} USDT
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.500">
                        Spread
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="green.600">
                        {(metrics.liveCycleSpread ?? 0).toFixed(2)} Bs
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.500">
                        Media V / C
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        {(metrics.liveCycleAvgSellPrice ?? 0).toFixed(1)} /{' '}
                        {(metrics.liveCycleAvgBuyPrice ?? 0).toFixed(1)}
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.500">
                        % neto
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color={(metrics.liveCycleProfitPercent ?? 0) >= 0 ? 'green.600' : 'red.600'}
                      >
                        {(metrics.liveCycleProfitPercent ?? 0).toFixed(2)}%
                      </Text>
                    </VStack>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.500">
                        Bruta
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="green.600">
                        {formatVes(metrics.liveCycleGrossBs ?? 0)}
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.500">
                        − PM − Binance
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="orange.600">
                        −
                        {formatVes(
                          (metrics.liveCyclePagoMovilFeeBs ?? 0) +
                            (metrics.liveCycleBinanceFeeBs ?? 0)
                        )}
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.500">
                        Neta
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color={(metrics.liveCycleNetUsdtAfterAd ?? 0) >= 0 ? 'green.600' : 'red.600'}
                      >
                        {formatVes(metrics.liveCycleNetBs ?? 0)} (~
                        {(metrics.liveCycleNetUsdtAfterAd ?? 0).toFixed(1)} USDT)
                      </Text>
                    </VStack>
                  </SimpleGrid>
                  {(metrics.currentCycleSoldUsdt ?? 0) >= 0.01 && (
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Ciclo abierto ventas: {(metrics.currentCycleSoldUsdt ?? 0).toFixed(2)} USDT
                      {metrics.latestSellPrice > 0 && (
                        <> · ~{formatVes(metrics.remainingToSellBs ?? 0)}</>
                      )}
                    </Text>
                  )}
                  {(metrics.currentCycleBoughtUsdt ?? 0) >= 0.01 && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Ciclo abierto compras: {(metrics.currentCycleBoughtUsdt ?? 0).toFixed(2)} USDT
                      {metrics.latestBuyPrice > 0 && (
                        <> · ~{formatVes(metrics.remainingToBuyBs ?? 0)}</>
                      )}
                    </Text>
                  )}
                </Box>
              )}

              {/* Ganancia por ciclos FIFO */}
              {metrics.todayCyclesSummary && metrics.todayCyclesSummary.cycles.length > 0 && (
                <Box
                  p={3}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="surface.border"
                  bg="surface.muted"
                >
                  <HStack justify="space-between" flexWrap="wrap">
                    <Text fontSize="xs" fontWeight="700" color="gray.700">
                      Ciclos FIFO hoy ({metrics.todayCyclesSummary.cycles.length})
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="700"
                      color={
                        metrics.todayCyclesSummary.totalProfitFromCycles >= 0
                          ? 'green.600'
                          : 'red.600'
                      }
                    >
                      {metrics.todayCyclesSummary.totalProfitFromCycles.toLocaleString('es-VE', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{' '}
                      Bs
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Desbalances */}
              {metrics.pendingToBuy > 0 && (
                <Box
                  p={3}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="orange.200"
                  bg="orange.50"
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="700" color="orange.700">
                      Falta comprar
                    </Text>
                    <Badge colorScheme="orange">{metrics.pendingToBuy.toFixed(2)} USDT</Badge>
                  </HStack>
                  <Progress
                    value={
                      adjustedBuy > 0
                        ? Math.min((adjustedBuy / (adjustedBuy + metrics.pendingToBuy)) * 100, 100)
                        : 0
                    }
                    colorScheme="orange"
                    size="sm"
                    borderRadius="full"
                  />
                </Box>
              )}

              {metrics.pendingToSell > 0 && (
                <Box
                  p={3}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="purple.200"
                  bg="purple.50"
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="700" color="purple.700">
                      Falta vender
                    </Text>
                    <Badge colorScheme="purple">{metrics.pendingToSell.toFixed(2)} USDT</Badge>
                  </HStack>
                  <Progress
                    value={
                      adjustedSell > 0
                        ? Math.min(
                            (adjustedSell / (adjustedSell + metrics.pendingToSell)) * 100,
                            100
                          )
                        : 0
                    }
                    colorScheme="purple"
                    size="sm"
                    borderRadius="full"
                  />
                </Box>
              )}

              {metrics.pendingToBuy === 0 &&
                metrics.pendingToSell === 0 &&
                metrics.todayBuyAmount > 0 &&
                metrics.todaySellAmount > 0 && (
                  <Text fontSize="xs" fontWeight="600" color="green.600" textAlign="center">
                    Balance equilibrado
                  </Text>
                )}

              {/* Ajustes manuales */}
              <Box
                p={3}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="surface.border"
                bg="surface.muted"
              >
                <HStack justify="space-between" align="center">
                  <Text fontSize="xs" fontWeight="700" color="gray.700">
                    Ajustes manuales
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
                      <FormLabel fontSize="xs" mb={1}>
                        Tipo
                      </FormLabel>
                      <Select
                        size="sm"
                        value={adjustmentType}
                        onChange={(e) =>
                          setAdjustmentType(
                            e.target.value as 'BUY_EXTERNAL' | 'SELL_EXTERNAL' | 'SETTLEMENT'
                          )
                        }
                      >
                        <option value="BUY_EXTERNAL">Compra externa (+BUY)</option>
                        <option value="SETTLEMENT">Liquidación manual (+BUY)</option>
                        <option value="SELL_EXTERNAL">Venta externa (+SELL)</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" mb={1}>
                        USDT
                      </FormLabel>
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
                      <FormLabel fontSize="xs" mb={1}>
                        Nota
                      </FormLabel>
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
                        <HStack
                          key={adj.id}
                          justify="space-between"
                          fontSize="xs"
                          color="gray.700"
                        >
                          <Text>
                            {new Date(adj.createdAt).toLocaleString('es-VE')} · {adj.type} ·{' '}
                            {adj.usdtAmount.toFixed(2)} USDT
                            {adj.note ? ` · ${adj.note}` : ''}
                          </Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteAdjustment(adj.id)}
                          >
                            Eliminar
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Collapse>
              </Box>
            </VStack>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  )
}
