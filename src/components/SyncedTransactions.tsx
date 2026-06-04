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
  useToast,
  Button,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverCloseButton,
  Select,
  Input,
} from '@chakra-ui/react'
import { FaAddressCard, FaCheckCircle } from 'react-icons/fa'
import axios from 'axios'
import ReceiptValidator from './ReceiptValidator'
import SellKycForm from './SellKycForm'

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'threeMonths' | 'all'

function getYesterdayYmd(): string {
  const now = new Date()
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const todayStart = new Date(todayStr + 'T00:00:00.000-04:00')
  const yesterday = new Date(todayStart.getTime() - 86_400_000)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(yesterday)
}

interface BinanceTransaction {
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

export default function SyncedTransactions() {
  const [transactions, setTransactions] = useState<BinanceTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [bankFilter, setBankFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const toast = useToast()

  useEffect(() => {
    loadTransactions()

    // Al ver ayer u otra fecha pasada, forzar sync profundo de ese día
    if (dateFilter === 'yesterday') {
      axios.post('/api/binance/sync', { backfillFrom: getYesterdayYmd() }).catch(() => {})
    }
    
    // Actualizar cada 5 segundos para tiempo real
    const interval = setInterval(loadTransactions, 5000)
    
    // Escuchar eventos de sincronización
    const handleSync = () => {
      setTimeout(loadTransactions, 1000) // Esperar 1 segundo para que se procesen las transacciones
    }
    window.addEventListener('binance-sync-completed', handleSync)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('binance-sync-completed', handleSync)
    }
  }, [dateFilter, bankFilter, startDateFilter, endDateFilter])

  const completedSells = transactions.filter(
    (t) => t.tradeType === 'SELL' && (t.orderStatus || '').toUpperCase() === 'COMPLETED'
  )
  const sellTotalUsdt = completedSells.reduce((s, t) => s + t.amount, 0)
  const sellTotalBs = completedSells.reduce((s, t) => s + t.fiatAmount, 0)
  const showDaySummary = dateFilter !== 'all' || Boolean(startDateFilter || endDateFilter)

  const loadTransactions = async () => {
    try {
      const params: Record<string, string> = {}

      const hasManualDateRange = Boolean(startDateFilter || endDateFilter)
      if (hasManualDateRange) {
        if (startDateFilter) {
          params.startDate = new Date(`${startDateFilter}T00:00:00.000-04:00`).toISOString()
        }
        if (endDateFilter) {
          params.endDate = new Date(`${endDateFilter}T23:59:59.999-04:00`).toISOString()
        }
      } else if (dateFilter !== 'all') {
        // El servidor calcula "hoy" en America/Caracas (evita desfase UTC en el navegador)
        params.period = dateFilter
      }

      if (bankFilter.trim()) {
        params.bankName = bankFilter.trim()
      }
      
      const response = await axios.get('/api/binance/transactions', { params })
      if (response.data.success) {
        setTransactions(response.data.transactions)
      }
    } catch (error) {
      console.error('Error cargando transacciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Heading size="md">
              Transacciones Sincronizadas
              {!isLoading && transactions.length > 0 && (
                <Text as="span" fontSize="sm" fontWeight="normal" color="gray.500" ml={2}>
                  ({transactions.length})
                </Text>
              )}
            </Heading>
            <HStack spacing={2} flexWrap="wrap" justify="flex-end">
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                size="sm"
                maxW={{ base: '140px', md: '180px' }}
              >
                <option value="today">Hoy</option>
                <option value="yesterday">Ayer</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mes</option>
                <option value="threeMonths">Últimos 3 Meses</option>
                <option value="all">Todos</option>
              </Select>
              <Input
                size="sm"
                maxW={{ base: '140px', md: '180px' }}
                placeholder="Filtrar banco"
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
              />
              <Input
                type="date"
                size="sm"
                maxW={{ base: '130px', md: '150px' }}
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
              <Input
                type="date"
                size="sm"
                maxW={{ base: '130px', md: '150px' }}
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDateFilter('today')
                  setBankFilter('')
                  setStartDateFilter('')
                  setEndDateFilter('')
                }}
              >
                Limpiar
              </Button>
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
        </VStack>
      </CardHeader>
      <CardBody>
        {showDaySummary && !isLoading && (
          <Box
            mb={4}
            p={3}
            borderRadius="md"
            bg="red.50"
            borderWidth="1px"
            borderColor="red.100"
          >
            <Text fontSize="sm" fontWeight="bold" color="red.700" mb={1}>
              Resumen ventas completadas
            </Text>
            <HStack spacing={4} flexWrap="wrap">
              <Text fontSize="sm">
                <strong>{completedSells.length}</strong> operaciones
              </Text>
              <Text fontSize="sm">
                <strong>{sellTotalUsdt.toFixed(2)}</strong> USDT
              </Text>
              <Text fontSize="sm">
                <strong>
                  {sellTotalBs.toLocaleString('es-VE', {
                    style: 'currency',
                    currency: 'VES',
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </Text>
            </HStack>
          </Box>
        )}
        {isLoading ? (
          <Text>Cargando transacciones...</Text>
        ) : transactions.length === 0 ? (
          <VStack spacing={4} py={8}>
            <Text color="gray.500" textAlign="center">
              No hay transacciones sincronizadas
              <br />
              Conecta tu cuenta de Binance y sincroniza para ver tus transacciones
            </Text>
          </VStack>
        ) : (
          <TableContainer overflowX="auto">
            <Table variant="simple" size="sm" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <Thead>
                <Tr>
                  <Th w="110px">Fecha</Th>
                  <Th w="80px">Tipo</Th>
                  <Th w="120px">Cant.</Th>
                  <Th w="130px">P. Unit.</Th>
                  <Th w="130px">Total</Th>
                  <Th>Banco</Th>
                  <Th w="145px">Estado</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((tx) => (
                  <Tr key={tx.id}>
                    <Td fontSize="xs" whiteSpace="nowrap">
                      {new Date(tx.createTime).toLocaleString('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={tx.tradeType === 'BUY' ? 'green' : 'red'}
                      >
                        {tx.tradeType === 'BUY' ? 'Compra' : 'Venta'}
                      </Badge>
                    </Td>
                    <Td whiteSpace="nowrap">{tx.amount.toFixed(2)} {tx.asset}</Td>
                    <Td whiteSpace="nowrap">
                      {tx.unitPrice.toLocaleString('es-VE', {
                        style: 'currency',
                        currency: 'VES',
                        maximumFractionDigits: 0,
                      })}
                    </Td>
                    <Td whiteSpace="nowrap">
                      {tx.fiatAmount.toLocaleString('es-VE', {
                        style: 'currency',
                        currency: 'VES',
                        maximumFractionDigits: 0,
                      })}
                    </Td>
                    <Td maxW="220px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {tx.sellKyc?.bankName || tx.paymentMethod || 'N/A'}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Badge
                          colorScheme={
                            tx.orderStatus === 'COMPLETED' ? 'green' : 'yellow'
                          }
                        >
                          {tx.orderStatus}
                        </Badge>
                        {tx.tradeType === 'BUY' && (
                          <Popover>
                            <PopoverTrigger>
                              <IconButton
                                aria-label="Validar comprobante"
                                icon={<FaCheckCircle />}
                                size="xs"
                                colorScheme="blue"
                                variant="ghost"
                              />
                            </PopoverTrigger>
                            <PopoverContent maxW="400px">
                              <PopoverHeader fontWeight="bold">
                                Validar Comprobante
                              </PopoverHeader>
                              <PopoverCloseButton />
                              <PopoverBody>
                                <ReceiptValidator
                                  transactionId={tx.id}
                                  expectedAmount={tx.fiatAmount}
                                  orderNumber={tx.orderNumber}
                                />
                              </PopoverBody>
                            </PopoverContent>
                          </Popover>
                        )}
                        {tx.tradeType === 'SELL' && (
                          <Popover>
                            <PopoverTrigger>
                              <IconButton
                                aria-label="Registrar KYC de venta"
                                icon={<FaAddressCard />}
                                size="xs"
                                colorScheme="purple"
                                variant="ghost"
                              />
                            </PopoverTrigger>
                            <PopoverContent maxW="500px">
                              <PopoverHeader fontWeight="bold">
                                Registro KYC de Venta
                              </PopoverHeader>
                              <PopoverCloseButton />
                              <PopoverBody>
                                <SellKycForm
                                  transactionId={tx.id}
                                  orderNumber={tx.orderNumber}
                                />
                              </PopoverBody>
                            </PopoverContent>
                          </Popover>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </CardBody>
    </Card>
  )
}

