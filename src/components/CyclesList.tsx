'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  Collapse,
  IconButton,
  useDisclosure,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { FaChevronDown, FaChevronUp, FaDollarSign, FaChartLine } from 'react-icons/fa'
import axios from 'axios'

interface Cycle {
  id: string
  completedAt: string
  date: string
  usdtAmount: number
  sellUsdtAmount: number
  buyUsdtAmount: number
  sellFiatAmount: number
  buyFiatAmount: number
  averageSellPrice: number
  averageBuyPrice: number
  grossProfit: number
  netProfit: number
  totalCommissions: number
  profitMargin: number
  roi: number
  sellTransactions: string[]
  buyTransactions: string[]
  paymentMethods: string[]
  sellBanks: string[]
  buyBanks: string[]
  sellTransactionsDetails?: any[]
  buyTransactionsDetails?: any[]
}

export default function CyclesList() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCycles()
  }, [])

  const loadCycles = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/api/binance/cycles?date=today')
      if (response.data.success) {
        setCycles(response.data.cycles || [])
      }
    } catch (error) {
      console.error('Error cargando ciclos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Box p={4}>
        <Text>Cargando ciclos...</Text>
      </Box>
    )
  }

  if (cycles.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center">
            No hay ciclos completados hoy
          </Text>
        </CardBody>
      </Card>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Ciclos completados hoy ({cycles.length})</Heading>
      <Text fontSize="sm" color="gray.600" textAlign="center">
        Vendes una cantidad, compras esa misma cantidad; lo que te queda en Bs (menos comisiones) es tu ganancia.
      </Text>
      {cycles.map((cycle, index) => (
        <CycleCard key={cycle.id} cycle={cycle} cycleNumber={index + 1} />
      ))}
    </VStack>
  )
}

function CycleCard({ cycle, cycleNumber }: { cycle: Cycle; cycleNumber: number }) {
  const { isOpen, onToggle } = useDisclosure()

  const completedTime = new Date(cycle.completedAt).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Badge colorScheme="green" fontSize="md" px={2} py={1}>
              Ciclo {cycleNumber}
            </Badge>
            <Text fontSize="sm" color="gray.600">
              {completedTime}
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Badge colorScheme={cycle.netProfit >= 0 ? 'green' : 'red'} fontSize="sm">
              {cycle.netProfit >= 0 ? '+' : ''}
              {cycle.netProfit.toLocaleString('es-VE', {
                style: 'currency',
                currency: 'VES',
                maximumFractionDigits: 0,
              })}
            </Badge>
            <IconButton
              aria-label={isOpen ? 'Ocultar detalles' : 'Mostrar detalles'}
              icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
              size="sm"
              variant="ghost"
              onClick={onToggle}
            />
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Text fontSize="xs" color="gray.500" mb={2}>
          Vendiste {cycle.sellUsdtAmount.toFixed(0)} USDT → compraste {cycle.buyUsdtAmount.toFixed(0)} USDT → ganancia neta (Bs recibidos − Bs pagados − comisiones)
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={3}>
          <Stat>
            <StatLabel fontSize="xs">USDT Vendidos</StatLabel>
            <StatNumber fontSize="lg">{cycle.sellUsdtAmount.toFixed(2)}</StatNumber>
            <StatHelpText fontSize="xs">
              {cycle.sellFiatAmount.toLocaleString('es-VE', {
                style: 'currency',
                currency: 'VES',
                maximumFractionDigits: 0,
              })}
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs">USDT Comprados</StatLabel>
            <StatNumber fontSize="lg">{cycle.buyUsdtAmount.toFixed(2)}</StatNumber>
            <StatHelpText fontSize="xs">
              {cycle.buyFiatAmount.toLocaleString('es-VE', {
                style: 'currency',
                currency: 'VES',
                maximumFractionDigits: 0,
              })}
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs">Margen (sobre ventas)</StatLabel>
            <StatNumber fontSize="lg" color={cycle.roi >= 0 ? 'green.500' : 'red.500'}>
              {cycle.roi >= 0 ? '+' : ''}
              {cycle.roi.toFixed(2)}%
            </StatNumber>
            <StatHelpText fontSize="xs">De lo recibido por ventas, este % es ganancia neta</StatHelpText>
          </Stat>
        </SimpleGrid>

        <Collapse in={isOpen} animateOpacity>
          <Box pt={3} borderTopWidth="1px" borderColor="gray.200">
            <VStack align="stretch" spacing={3}>
              {/* Bancos/Métodos de pago */}
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                  Bancos/Métodos de pago:
                </Text>
                <HStack flexWrap="wrap" spacing={2}>
                  {cycle.paymentMethods.length > 0 ? (
                    cycle.paymentMethods.map((method, i) => (
                      <Badge key={i} colorScheme="blue" fontSize="xs">
                        {method}
                      </Badge>
                    ))
                  ) : (
                    <Text fontSize="xs" color="gray.500">
                      No especificado
                    </Text>
                  )}
                </HStack>
              </Box>

              {/* Detalles de precios */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                    Precio promedio venta:
                  </Text>
                  <Text fontSize="sm">
                    {cycle.averageSellPrice.toLocaleString('es-VE', {
                      style: 'currency',
                      currency: 'VES',
                      maximumFractionDigits: 2,
                    })}{' '}
                    por USDT
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                    Precio promedio compra:
                  </Text>
                  <Text fontSize="sm">
                    {cycle.averageBuyPrice.toLocaleString('es-VE', {
                      style: 'currency',
                      currency: 'VES',
                      maximumFractionDigits: 2,
                    })}{' '}
                    por USDT
                  </Text>
                </Box>
              </SimpleGrid>

              {/* Comisiones */}
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                  Comisiones totales:
                </Text>
                <Text fontSize="sm">
                  {cycle.totalCommissions.toLocaleString('es-VE', {
                    style: 'currency',
                    currency: 'VES',
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </Box>

              {/* Transacciones */}
              {cycle.sellTransactionsDetails && cycle.sellTransactionsDetails.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                    Ventas ({cycle.sellTransactionsDetails.length}):
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {cycle.sellTransactionsDetails.map((tx, i) => (
                      <Text key={i} fontSize="xs" color="gray.700">
                        • {tx.amount.toFixed(2)} USDT @{' '}
                        {tx.unitPrice.toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES',
                          maximumFractionDigits: 2,
                        })}{' '}
                        {tx.paymentMethod && `(${tx.paymentMethod})`}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              )}

              {cycle.buyTransactionsDetails && cycle.buyTransactionsDetails.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                    Compras ({cycle.buyTransactionsDetails.length}):
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {cycle.buyTransactionsDetails.map((tx, i) => (
                      <Text key={i} fontSize="xs" color="gray.700">
                        • {tx.amount.toFixed(2)} USDT @{' '}
                        {tx.unitPrice.toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES',
                          maximumFractionDigits: 2,
                        })}{' '}
                        {tx.paymentMethod && `(${tx.paymentMethod})`}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </Box>
        </Collapse>
      </CardBody>
    </Card>
  )
}
