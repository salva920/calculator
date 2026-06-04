'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import { FaShoppingCart, FaArrowDown, FaArrowUp } from 'react-icons/fa'
import axios from 'axios'
import { UI_POLL_DATABASE_MS } from '@/lib/sync-constants'

interface AdStats {
  advNo: string
  tradeType: 'BUY' | 'SELL'
  totalAmount: number
  totalValue: number
  transactionCount: number
  completedCount: number
  pendingCount: number
  averagePrice: number
  totalBinanceCommission?: number
  totalBankCommission?: number
  firstTransaction: string
  lastTransaction: string
  // Métricas de balance y ganancias (solo para anuncios de venta)
  balanceDifference?: number
  pendingToBuy?: number
  pendingToSell?: number
  completedBuyAmount?: number
  completedSellAmount?: number
  grossProfit?: number
  netProfit?: number
  totalCommissions?: number
  buyCommissions?: number
  sellCommissions?: number
  hasMatchingBuy?: boolean
  transactions: Array<{
    id: string
    orderNumber: string
    amount: number
    fiatAmount: number
    unitPrice: number
    orderStatus: string
    createTime: string
    counterPartName: string
    paymentMethod?: string
    commission?: number
    bankCommission?: number
  }>
}

export default function AdsPerformance() {
  const [ads, setAds] = useState<AdStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [todayOnly, setTodayOnly] = useState(true)
  const toast = useToast()

  useEffect(() => {
    loadAds()
    
    // Poll solo MongoDB (no Binance)
    const interval = setInterval(loadAds, UI_POLL_DATABASE_MS)
    
    // Escuchar eventos de sincronización
    const handleSync = () => {
      setTimeout(loadAds, 1000)
    }
    window.addEventListener('binance-sync-completed', handleSync)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('binance-sync-completed', handleSync)
    }
  }, [todayOnly])

  const loadAds = async () => {
    try {
      const response = await axios.get(`/api/binance/ads?todayOnly=${todayOnly}`)
      if (response.data.success) {
        setAds(response.data.ads)
      }
    } catch (error) {
      console.error('Error cargando estadísticas de anuncios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const buyAds = ads.filter(ad => ad.tradeType === 'BUY')
  const sellAds = ads.filter(ad => ad.tradeType === 'SELL')

  const totalBuyAmount = buyAds.reduce((sum, ad) => sum + ad.totalAmount, 0)
  const totalSellAmount = sellAds.reduce((sum, ad) => sum + ad.totalAmount, 0)

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <Text>Cargando estadísticas de anuncios...</Text>
        </CardBody>
      </Card>
    )
  }

  if (ads.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center">
            No hay transacciones con anuncios registrados
            {todayOnly ? ' hoy' : ''}
          </Text>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
        <HStack justify="space-between" flexWrap="wrap" spacing={4}>
          <Box>
            <Heading size="md" color="gray.800">Rendimiento de anuncios</Heading>
            <Text fontSize="sm" color="gray.500">Compra y venta por anuncio</Text>
          </Box>
          <HStack spacing={3}>
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.600">
                Solo hoy
              </Text>
              <Switch
                isChecked={todayOnly}
                onChange={(e) => setTodayOnly(e.target.checked)}
                colorScheme="brand"
              />
            </HStack>
            <Box as="span" className="live-dot" w="10px" h="10px" bg="green.400" borderRadius="full" display="inline-block" />
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Resumen */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Stat>
              <StatLabel>Anuncios de Compra</StatLabel>
              <StatNumber>{buyAds.length}</StatNumber>
              <StatHelpText>
                {totalBuyAmount.toFixed(2)} USDT vendidos
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Anuncios de Venta</StatLabel>
              <StatNumber>{sellAds.length}</StatNumber>
              <StatHelpText>
                {totalSellAmount.toFixed(2)} USDT vendidos
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Tabs para Compras y Ventas */}
          <Tabs>
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <FaArrowDown color="green" />
                  <Text>Anuncios de Compra ({buyAds.length})</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FaArrowUp color="red" />
                  <Text>Anuncios de Venta ({sellAds.length})</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Anuncios de Compra */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {buyAds.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={8}>
                      No hay anuncios de compra {todayOnly ? 'hoy' : ''}
                    </Text>
                  ) : (
                    <Accordion allowMultiple>
                      {buyAds.map((ad) => (
                        <AccordionItem key={ad.advNo} border="1px solid" borderColor="gray.200" borderRadius="md" mb={2}>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <HStack justify="space-between">
                                <VStack align="start" spacing={0}>
                                  <HStack>
                                    <Text fontWeight="bold">Anuncio #{ad.advNo}</Text>
                                    <Badge colorScheme="green">Compra</Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {ad.transactionCount} transacciones • {ad.completedCount} completadas • {ad.pendingCount} pendientes
                                  </Text>
                                </VStack>
                                <VStack align="end" spacing={0}>
                                  <Text fontWeight="bold" fontSize="lg">
                                    {ad.totalAmount.toFixed(2)} USDT
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    {ad.totalValue.toLocaleString('es-VE', {
                                      style: 'currency',
                                      currency: 'VES',
                                    })}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack spacing={3} align="stretch">
                              <SimpleGrid columns={3} spacing={4}>
                                <Box>
                                  <Text fontSize="xs" color="gray.600">Precio Promedio</Text>
                                  <Text fontWeight="bold">
                                    {ad.averagePrice.toLocaleString('es-VE', {
                                      style: 'currency',
                                      currency: 'VES',
                                    })}
                                  </Text>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="gray.600">Total Completado</Text>
                                  <Text fontWeight="bold" color="green.600">
                                    {ad.completedCount} órdenes
                                  </Text>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="gray.600">En Proceso</Text>
                                  <Text fontWeight="bold" color="orange.600">
                                    {ad.pendingCount} órdenes
                                  </Text>
                                </Box>
                              </SimpleGrid>

                              <TableContainer>
                                <Table size="sm">
                                  <Thead>
                                    <Tr>
                                      <Th>Orden</Th>
                                      <Th>Cantidad</Th>
                                      <Th>Precio</Th>
                                      <Th>Total</Th>
                                      <Th>Estado</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {ad.transactions.map((tx) => (
                                      <Tr key={tx.id}>
                                        <Td fontSize="xs">{tx.orderNumber.substring(0, 8)}...</Td>
                                        <Td>{tx.amount.toFixed(2)} USDT</Td>
                                        <Td>
                                          {tx.unitPrice.toLocaleString('es-VE', {
                                            style: 'currency',
                                            currency: 'VES',
                                          })}
                                        </Td>
                                        <Td>
                                          {tx.fiatAmount.toLocaleString('es-VE', {
                                            style: 'currency',
                                            currency: 'VES',
                                          })}
                                        </Td>
                                        <Td>
                                          <Badge
                                            colorScheme={
                                              tx.orderStatus === 'COMPLETED'
                                                ? 'green'
                                                : tx.orderStatus === 'BUYER_PAYED'
                                                ? 'blue'
                                                : 'yellow'
                                            }
                                            fontSize="xs"
                                          >
                                            {tx.orderStatus}
                                          </Badge>
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </VStack>
              </TabPanel>

              {/* Anuncios de Venta */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {sellAds.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={8}>
                      No hay anuncios de venta {todayOnly ? 'hoy' : ''}
                    </Text>
                  ) : (
                    <Accordion allowMultiple>
                      {sellAds.map((ad) => (
                        <AccordionItem key={ad.advNo} border="1px solid" borderColor="gray.200" borderRadius="md" mb={2}>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <HStack justify="space-between">
                                <VStack align="start" spacing={0}>
                                  <HStack>
                                    <Text fontWeight="bold">Anuncio #{ad.advNo}</Text>
                                    <Badge colorScheme="red">Venta</Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {ad.transactionCount} transacciones • {ad.completedCount} completadas • {ad.pendingCount} pendientes
                                  </Text>
                                </VStack>
                                <VStack align="end" spacing={0}>
                                  <Text fontWeight="bold" fontSize="lg">
                                    {ad.totalAmount.toFixed(2)} USDT
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    {ad.totalValue.toLocaleString('es-VE', {
                                      style: 'currency',
                                      currency: 'VES',
                                    })}
                                  </Text>
                                  {ad.netProfit !== undefined && (
                                    <Text 
                                      fontSize="xs" 
                                      color={ad.netProfit > 0 ? 'green.600' : 'red.600'}
                                      fontWeight="bold"
                                    >
                                      Ganancia: {ad.netProfit.toLocaleString('es-VE', {
                                        style: 'currency',
                                        currency: 'VES',
                                      })}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack spacing={4} align="stretch">
                              {/* Métricas de Balance y Ganancias */}
                              {ad.hasMatchingBuy !== undefined && (
                                <Box 
                                  p={4} 
                                  bg={ad.netProfit && ad.netProfit > 0 ? 'green.50' : ad.netProfit && ad.netProfit < 0 ? 'red.50' : 'gray.50'} 
                                  borderRadius="md"
                                  border="1px solid"
                                  borderColor={ad.netProfit && ad.netProfit > 0 ? 'green.200' : ad.netProfit && ad.netProfit < 0 ? 'red.200' : 'gray.200'}
                                >
                                  <VStack spacing={3} align="stretch">
                                    <Heading size="sm" color={ad.netProfit && ad.netProfit > 0 ? 'green.700' : ad.netProfit && ad.netProfit < 0 ? 'red.700' : 'gray.700'}>
                                      💰 Balance y Ganancias
                                    </Heading>
                                    
                                    <SimpleGrid columns={2} spacing={4}>
                                      <Box>
                                        <Text fontSize="xs" color="gray.600" mb={1}>Balance de USDT</Text>
                                        <HStack spacing={2}>
                                          <Text fontWeight="bold" fontSize="lg">
                                            {ad.balanceDifference !== undefined 
                                              ? (ad.balanceDifference > 0 ? '+' : '') + ad.balanceDifference.toFixed(2)
                                              : '0.00'
                                            } USDT
                                          </Text>
                                        </HStack>
                                        {ad.pendingToBuy !== undefined && ad.pendingToBuy > 0 && (
                                          <Text fontSize="xs" color="orange.600" mt={1}>
                                            ⚠️ Falta comprar {ad.pendingToBuy.toFixed(2)} USDT para equilibrar
                                          </Text>
                                        )}
                                        {ad.pendingToSell !== undefined && ad.pendingToSell > 0 && (
                                          <Text fontSize="xs" color="blue.600" mt={1}>
                                            ⚠️ Falta vender {ad.pendingToSell.toFixed(2)} USDT para equilibrar
                                          </Text>
                                        )}
                                        {ad.balanceDifference === 0 && (
                                          <Text fontSize="xs" color="green.600" mt={1}>
                                            ✅ Balance equilibrado
                                          </Text>
                                        )}
                                      </Box>

                                      <Box>
                                        <Text fontSize="xs" color="gray.600" mb={1}>Ganancia Neta</Text>
                                        <Text 
                                          fontWeight="bold" 
                                          fontSize="lg"
                                          color={ad.netProfit && ad.netProfit > 0 ? 'green.600' : ad.netProfit && ad.netProfit < 0 ? 'red.600' : 'gray.600'}
                                        >
                                          {ad.netProfit !== undefined 
                                            ? ad.netProfit.toLocaleString('es-VE', {
                                                style: 'currency',
                                                currency: 'VES',
                                              })
                                            : 'Bs.S 0,00'
                                          }
                                        </Text>
                                        {ad.grossProfit !== undefined && (
                                          <Text fontSize="xs" color="gray.500" mt={1}>
                                            Bruta: {ad.grossProfit.toLocaleString('es-VE', {
                                              style: 'currency',
                                              currency: 'VES',
                                            })}
                                          </Text>
                                        )}
                                      </Box>
                                    </SimpleGrid>

                                    {/* Desglose de Comisiones */}
                                    {ad.totalCommissions !== undefined && ad.totalCommissions > 0 && (
                                      <Box mt={2} pt={3} borderTop="1px solid" borderColor="gray.200">
                                        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                                          📋 Desglose de Comisiones
                                        </Text>
                                        <SimpleGrid columns={3} spacing={2}>
                                          <Box>
                                            <Text fontSize="xs" color="gray.600">Binance</Text>
                                            <Text fontWeight="bold" fontSize="sm">
                                              {(ad.totalBinanceCommission || 0).toLocaleString('es-VE', {
                                                style: 'currency',
                                                currency: 'VES',
                                              })}
                                            </Text>
                                          </Box>
                                          <Box>
                                            <Text fontSize="xs" color="gray.600">Bancaria</Text>
                                            <Text fontWeight="bold" fontSize="sm">
                                              {(ad.totalBankCommission || 0).toLocaleString('es-VE', {
                                                style: 'currency',
                                                currency: 'VES',
                                              })}
                                            </Text>
                                          </Box>
                                          <Box>
                                            <Text fontSize="xs" color="gray.600">Total</Text>
                                            <Text fontWeight="bold" fontSize="sm" color="red.600">
                                              {ad.totalCommissions.toLocaleString('es-VE', {
                                                style: 'currency',
                                                currency: 'VES',
                                              })}
                                            </Text>
                                          </Box>
                                        </SimpleGrid>
                                      </Box>
                                    )}
                                  </VStack>
                                </Box>
                              )}

                              <SimpleGrid columns={3} spacing={4}>
                                <Box>
                                  <Text fontSize="xs" color="gray.600">Precio Promedio</Text>
                                  <Text fontWeight="bold">
                                    {ad.averagePrice.toLocaleString('es-VE', {
                                      style: 'currency',
                                      currency: 'VES',
                                    })}
                                  </Text>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="gray.600">Total Completado</Text>
                                  <Text fontWeight="bold" color="green.600">
                                    {ad.completedCount} órdenes
                                  </Text>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="gray.600">En Proceso</Text>
                                  <Text fontWeight="bold" color="orange.600">
                                    {ad.pendingCount} órdenes
                                  </Text>
                                </Box>
                              </SimpleGrid>

                              <TableContainer>
                                <Table size="sm">
                                  <Thead>
                                    <Tr>
                                      <Th>Orden</Th>
                                      <Th>Cantidad</Th>
                                      <Th>Precio</Th>
                                      <Th>Total</Th>
                                      <Th>Método Pago</Th>
                                      <Th>Comisiones</Th>
                                      <Th>Estado</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {ad.transactions.map((tx) => {
                                      const totalCommission = (tx.commission || 0) + (tx.bankCommission || 0)
                                      return (
                                        <Tr key={tx.id}>
                                          <Td fontSize="xs">{tx.orderNumber.substring(0, 8)}...</Td>
                                          <Td>{tx.amount.toFixed(2)} USDT</Td>
                                          <Td>
                                            {tx.unitPrice.toLocaleString('es-VE', {
                                              style: 'currency',
                                              currency: 'VES',
                                            })}
                                          </Td>
                                          <Td>
                                            {tx.fiatAmount.toLocaleString('es-VE', {
                                              style: 'currency',
                                              currency: 'VES',
                                            })}
                                          </Td>
                                          <Td fontSize="xs">
                                            {tx.paymentMethod || 'N/A'}
                                          </Td>
                                          <Td fontSize="xs">
                                            {totalCommission > 0 ? (
                                              <VStack spacing={0} align="start">
                                                {(tx.commission || 0) > 0 && (
                                                  <Text fontSize="10px" color="blue.600">
                                                    Binance: {(tx.commission || 0).toLocaleString('es-VE', {
                                                      style: 'currency',
                                                      currency: 'VES',
                                                    })}
                                                  </Text>
                                                )}
                                                {(tx.bankCommission || 0) > 0 && (
                                                  <Text fontSize="10px" color="orange.600">
                                                    Banco: {(tx.bankCommission || 0).toLocaleString('es-VE', {
                                                      style: 'currency',
                                                      currency: 'VES',
                                                    })}
                                                  </Text>
                                                )}
                                              </VStack>
                                            ) : (
                                              <Text color="gray.400" fontSize="10px">Sin comisión</Text>
                                            )}
                                          </Td>
                                          <Td>
                                            <Badge
                                              colorScheme={
                                                tx.orderStatus === 'COMPLETED'
                                                  ? 'green'
                                                  : tx.orderStatus === 'BUYER_PAYED'
                                                  ? 'blue'
                                                  : 'yellow'
                                              }
                                              fontSize="xs"
                                            >
                                              {tx.orderStatus}
                                            </Badge>
                                          </Td>
                                        </Tr>
                                      )
                                    })}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </CardBody>
    </Card>
  )
}

