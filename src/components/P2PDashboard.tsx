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
import { FaArrowUp, FaArrowDown, FaSync, FaWallet } from 'react-icons/fa'
import axios from 'axios'
import { requestBinanceSync } from '@/lib/binance-sync-client'
import { useBinanceMetrics, useRefreshBinanceMetrics } from '@/hooks/useBinanceMetrics'
import { useBinanceBalance, useInvalidateBinanceBalance } from '@/hooks/useBinanceBalance'
import InsightPanel from '@/components/ui/InsightPanel'

const WALLET_BANNER_STORAGE_KEY = 'p2p-show-wallet-banner'

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
  const totalSellValue = metrics.totalSellValue ?? 0
  const totalBuyValue = metrics.totalBuyValue ?? 0

  return (
    <Card>
      <CardHeader pb={3} borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" flexWrap="wrap">
            <Text fontSize="sm" fontWeight="700" color="gray.700">
              Panel en vivo
            </Text>
            <HStack spacing={2}>
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
                className="live-dot"
                w="10px"
                h="10px"
                bg="green.400"
                borderRadius="full"
                display="inline-block"
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
          <Collapse in={showWalletBanner} animateOpacity>
            <InsightPanel accent="blue" p={{ base: 2, md: 3 }}>
              <HStack justify="space-between" mb={2} flexWrap="wrap" align="center">
                <HStack spacing={2}>
                  <FaWallet size={14} />
                  <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="blue.800">
                    Billetera Binance
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
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">
                      USDT total (P2P)
                    </Text>
                    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" color="blue.700">
                      {(balance.usdtTotal ?? balance.usdt.total).toFixed(2)}
                    </Text>
                    <Text fontSize="10px" color="gray.500">
                      Funding + Spot
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">
                      Funding (P2P)
                    </Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                      {(balance.funding?.total ?? 0).toFixed(2)} USDT
                    </Text>
                    <Text fontSize="10px" color="gray.500">
                      libre {(balance.funding?.free ?? 0).toFixed(2)}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">
                      Spot USDT
                    </Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                      {(balance.spot?.usdt.total ?? balance.usdt.total).toFixed(2)}
                    </Text>
                    <Text fontSize="10px" color="gray.500">
                      + polvo ~{(balance.spot?.estimatedTotalUsdt ?? 0).toFixed(2)}
                    </Text>
                  </VStack>
                  {metrics.latestSellPrice > 0 && (
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" color="gray.600">
                        ≈ en Bs (tasa venta)
                      </Text>
                      <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                        {(
                          (balance.usdtTotal ?? balance.usdt.total) * metrics.latestSellPrice
                        ).toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES',
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </VStack>
                  )}
                  {balance.history?.highUsdtTotal != null && (
                    <VStack align="start" spacing={0} gridColumn={{ base: '1 / -1', md: 'auto' }}>
                      <Text fontSize="10px" color="gray.600">
                        Máximo del mes ({balance.history.month})
                      </Text>
                      <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.600">
                        {balance.history.highUsdtTotal.toFixed(2)} USDT
                      </Text>
                      <Text fontSize="10px" color="gray.500">
                        {balance.history.highDateYmd
                          ? `día ${balance.history.highDateYmd}`
                          : ''}
                        {balance.history.daysTracked
                          ? ` · ${balance.history.daysTracked} día(s) registrados`
                          : ''}
                      </Text>
                    </VStack>
                  )}
                </SimpleGrid>
              ) : isBalanceLoading ? (
                <Text fontSize="sm" color="gray.500">
                  Consultando saldo en Binance...
                </Text>
              ) : (
                <Text fontSize="sm" color="orange.600">
                  {(balanceError as any)?.code === 'BINANCE_GEO_RESTRICTED'
                    ? 'Binance bloqueado desde este servidor. Prueba en local o con proxy.'
                    : (balanceError as Error)?.message ||
                      'No se pudo cargar el saldo. Revisa la conexión Binance.'}
                </Text>
              )}
            </InsightPanel>
          </Collapse>

          {/* Ordenes de HOY - Compacto */}
          <InsightPanel accent="brand" p={{ base: 2, md: 3 }}>
            <HStack justify="space-between" mb={2} flexWrap="wrap">
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="brand.800">
                Órdenes de hoy
              </Text>
              <Text fontSize="10px" color="gray.600">
                {metrics.todayTransactionsCount} ({metrics.todayCompletedCount} completadas)
              </Text>
            </HStack>

            {/* Resumen de ganancia por ciclos hoy (sin listar cada ciclo) */}
            {metrics.todayCyclesSummary && metrics.todayCyclesSummary.cycles.length > 0 && (
              <InsightPanel accent="green" mb={3} p={2}>
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="green.700" mb={1}>
                  Ganancia por ciclos hoy (FIFO)
                </Text>
                <HStack justify="space-between" flexWrap="wrap" align="center">
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700">
                    {metrics.todayCyclesSummary.cycles.length} ciclo{metrics.todayCyclesSummary.cycles.length !== 1 ? 's' : ''} completados
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={metrics.todayCyclesSummary.totalProfitFromCycles >= 0 ? 'green.600' : 'red.600'}>
                    Total: {metrics.todayCyclesSummary.totalProfitFromCycles.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.S
                  </Text>
                </HStack>
                <Text fontSize="10px" color="gray.500" mt={1}>
                  Empareja ventas antiguas con compras de hoy. Para P&amp;L del día mira la estimación bajo
                  “Brecha actual de tasas”.
                </Text>
              </InsightPanel>
            )}

            {(metrics.todayMatchedUsdt ?? 0) > 0 && (
              <InsightPanel accent="blue" mb={3} p={2}>
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="blue.700" mb={1}>
                  Estimación neta del día
                </Text>
                <HStack justify="space-between" flexWrap="wrap" align="center">
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700">
                    {(metrics.todayMatchedUsdt ?? 0).toFixed(2)} USDT × {(metrics.todaySpread ?? 0).toFixed(2)} − PM − Binance
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color={(metrics.todayEstimatedNetBs ?? 0) >= 0 ? 'green.600' : 'red.600'}
                  >
                    {(metrics.todayEstimatedNetBs ?? 0).toLocaleString('es-VE', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}{' '}
                    Bs.S
                    {(metrics.todayAvgBuyPrice ?? 0) > 0 && (
                      <> (~{(metrics.todayEstimatedNetUsdt ?? 0).toFixed(1)} USDT)</>
                    )}
                  </Text>
                </HStack>
              </InsightPanel>
            )}

            {metrics.liveCycleActive && (metrics.liveCycleSoldUsdt ?? 0) + (metrics.liveCycleBoughtUsdt ?? 0) > 0 && (
              <InsightPanel accent="green" mb={3} p={2}>
                <HStack justify="space-between" align="center" mb={1} flexWrap="wrap" gap={1}>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="green.700">
                    Ciclo en vivo (ganancia al comprar)
                  </Text>
                  <Badge
                    colorScheme={(metrics.liveCycleNetUsdtAfterAd ?? 0) >= 0 ? 'green' : 'red'}
                    fontSize={{ base: 'xs', md: 'sm' }}
                    px={2}
                    py={0.5}
                  >
                    {(metrics.liveCycleNetUsdtAfterAd ?? 0).toFixed(1)} USDT
                    {(metrics.liveCycleProfitPercent ?? 0) !== 0 && (
                      <> · {(metrics.liveCycleProfitPercent ?? 0).toFixed(2)}%</>
                    )}
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
                      borderRadius="md"
                      mb={1}
                    />
                    <Text fontSize="10px" color="gray.600" mb={2}>
                      Recompra {(metrics.liveCycleBoughtUsdt ?? 0).toFixed(2)} /{' '}
                      {(metrics.liveCycleSoldUsdt ?? 0).toFixed(2)} USDT (
                      {(metrics.liveCycleProgressPercent ?? 0).toFixed(0)}%)
                      {(metrics.liveCycleRemainingToBuyUsdt ?? 0) >= 0.01 && (
                        <>
                          {' '}
                          · faltan {(metrics.liveCycleRemainingToBuyUsdt ?? 0).toFixed(2)} USDT
                          {(metrics.liveCycleRemainingBuyBs ?? 0) > 0 && (
                            <>
                              {' '}
                              (~
                              {(metrics.liveCycleRemainingBuyBs ?? 0).toLocaleString('es-VE', {
                                maximumFractionDigits: 0,
                              })}{' '}
                              Bs)
                            </>
                          )}
                        </>
                      )}
                    </Text>
                  </>
                )}

                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={2}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Matched</Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {(metrics.liveCycleMatchedUsdt ?? 0).toFixed(2)} USDT
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Spread</Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.600">
                      {(metrics.liveCycleSpread ?? 0).toFixed(2)} Bs
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Media V / C</Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {(metrics.liveCycleAvgSellPrice ?? 0).toFixed(1)} /{' '}
                      {(metrics.liveCycleAvgBuyPrice ?? 0).toFixed(1)}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">% neto</Text>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={(metrics.liveCycleProfitPercent ?? 0) >= 0 ? 'green.600' : 'red.600'}
                    >
                      {(metrics.liveCycleProfitPercent ?? 0).toFixed(2)}%
                    </Text>
                  </VStack>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Bruta</Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.600">
                      {(metrics.liveCycleGrossBs ?? 0).toLocaleString('es-VE', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      Bs
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">− PM − Binance</Text>
                    <Text fontSize="sm" fontWeight="bold" color="orange.600">
                      −
                      {(
                        (metrics.liveCyclePagoMovilFeeBs ?? 0) +
                        (metrics.liveCycleBinanceFeeBs ?? 0)
                      ).toLocaleString('es-VE', { maximumFractionDigits: 0 })}{' '}
                      Bs
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" color="gray.600">Neta (tras anuncio)</Text>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={(metrics.liveCycleNetUsdtAfterAd ?? 0) >= 0 ? 'green.600' : 'red.600'}
                    >
                      {(metrics.liveCycleNetBs ?? 0).toLocaleString('es-VE', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      Bs (~{(metrics.liveCycleNetUsdtAfterAd ?? 0).toFixed(1)} USDT)
                    </Text>
                  </VStack>
                </SimpleGrid>

                <Text fontSize="10px" color="gray.500" mt={2}>
                  Solo la ola de los últimos 3 días (venta→recompra). Tope ~15k USDT; se
                  reinicia con hueco ≥10h o al cerrar ~95%.
                  {(metrics.liveCycleMatchedUsdt ?? 0) < 0.01 &&
                    (metrics.liveCycleSoldUsdt ?? 0) > 0 &&
                    ' Empieza a comprar para ver la ganancia crecer.'}
                  {(metrics.liveCycleInventoryUsdt ?? 0) !== 0 && (
                    <>
                      {' '}
                      Inv. {(metrics.liveCycleInventoryUsdt ?? 0) >= 0 ? '+' : ''}
                      {(metrics.liveCycleInventoryUsdt ?? 0).toFixed(2)} USDT · caja{' '}
                      {(metrics.liveCycleCashDiffBs ?? 0) >= 0 ? '+' : ''}
                      {(metrics.liveCycleCashDiffBs ?? 0).toLocaleString('es-VE', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      Bs.
                    </>
                  )}
                </Text>
              </InsightPanel>
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
                  <Text fontSize="10px" color="gray.500" mt={1} pt={1} borderTopWidth="1px" borderColor="surface.border">
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
                  <Text fontSize="10px" color="gray.500" mt={1} pt={1} borderTopWidth="1px" borderColor="surface.border">
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
          </InsightPanel>

          {/* Indicadores de Balance Acumulado - Compactos */}
          {metrics.pendingToBuy > 0 && (
            <InsightPanel accent="orange" p={{ base: 2, md: 3 }}>
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
            </InsightPanel>
          )}

          <InsightPanel accent="neutral" p={{ base: 2, md: 3 }}>
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
          </InsightPanel>

          {metrics.pendingToSell > 0 && (
            <InsightPanel accent="purple" p={{ base: 2, md: 3 }}>
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
            </InsightPanel>
          )}

          {metrics.pendingToBuy === 0 && metrics.pendingToSell === 0 && metrics.todayBuyAmount > 0 && metrics.todaySellAmount > 0 && (
            <InsightPanel accent="green" p={{ base: 2, md: 3 }}>
              <HStack>
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="green.700">
                  Balance equilibrado
                </Text>
              </HStack>
            </InsightPanel>
          )}

          {/* Alerta de Brecha de Tasas */}
          {metrics.isGapTooSmall && metrics.latestBuyPrice > 0 && (
            <InsightPanel accent="red" p={{ base: 2, md: 3 }}>
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
            </InsightPanel>
          )}

          {/* Información de Brecha Actual (siempre visible si hay datos) */}
          {!metrics.isGapTooSmall && metrics.latestBuyPrice > 0 && metrics.latestSellPrice > 0 && (
            <InsightPanel accent="blue" p={{ base: 2, md: 3 }}>
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="full" flexWrap="wrap">
                  <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color="blue.700">
                    Brecha actual de tasas
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
                {((metrics.todayMatchedUsdt ?? 0) > 0 || (metrics.todayCyclesVolumeUsdt ?? 0) > 0) && (
                  <Box w="full" pt={2} borderTopWidth="1px" borderColor="surface.border">
                    <Text fontSize="10px" color="gray.600" mb={1}>
                      Estimación del día (ops COMPLETED hoy)
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2} w="full" mb={2}>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">USDT emparejados</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                          {(metrics.todayMatchedUsdt ?? 0).toFixed(2)}
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Spread del día</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.600">
                          {(metrics.todaySpread ?? 0).toFixed(2)} Bs.S
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Bruta (matched × spread)</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.600">
                          {(metrics.todayEstimatedGrossBs ?? 0).toLocaleString('es-VE', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          Bs.S
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Fee PagoMóvil 0,30%</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="orange.600">
                          −{(metrics.todayPagoMovilFeeBs ?? 0).toLocaleString('es-VE', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          Bs.S
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Fee Binance</Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="orange.600">
                          −{(metrics.todayBinanceFeeBs ?? 0).toLocaleString('es-VE', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          Bs.S
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="gray.600">Neta estimada</Text>
                        <Text
                          fontSize={{ base: 'sm', md: 'md' }}
                          fontWeight="bold"
                          color={(metrics.todayEstimatedNetBs ?? 0) >= 0 ? 'green.600' : 'red.600'}
                        >
                          {(metrics.todayEstimatedNetBs ?? 0).toLocaleString('es-VE', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          Bs.S
                          {(metrics.todayAvgBuyPrice ?? 0) > 0 && (
                            <Text as="span" fontSize="10px" color="gray.500" ml={1}>
                              (~{(metrics.todayEstimatedNetUsdt ?? 0).toFixed(1)} USDT)
                            </Text>
                          )}
                        </Text>
                      </VStack>
                    </SimpleGrid>
                    {(metrics.todayMatchedUsdt ?? 0) < 0.01 && (
                      <Text fontSize="10px" color="gray.500">
                        Hoy solo hay un lado (compra o venta). La estimación neta aparece cuando hay
                        ambos lados COMPLETED el mismo día.
                      </Text>
                    )}
                    {metrics.todayCyclesSummary && (metrics.todayCyclesVolumeUsdt ?? 0) > 0 && (
                      <Text fontSize="10px" color="gray.500" mt={1}>
                        Nota: la “ganancia por ciclos” FIFO puede diferir (cierra ventas viejas con
                        compras de hoy). La estimación de arriba usa solo tasas y volumen de hoy.
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </InsightPanel>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

