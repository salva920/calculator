'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
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
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  Input,
  Show,
  Hide,
  SimpleGrid,
  Flex,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react'
import { FaAddressCard, FaCheckCircle } from 'react-icons/fa'
import { requestBinanceSync } from '@/lib/binance-sync-client'
import {
  useBinanceTransactions,
  useInvalidateBinanceTransactions,
  type BinanceTransaction,
} from '@/hooks/useBinanceTransactions'
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

function formatTxDate(createTime: string) {
  return new Date(createTime).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatVes(value: number) {
  return value.toLocaleString('es-VE', {
    style: 'currency',
    currency: 'VES',
    maximumFractionDigits: 0,
  })
}

function TradeTypeBadge({ type }: { type: string }) {
  const isBuy = type === 'BUY'
  return (
    <Badge
      colorScheme={isBuy ? 'green' : 'red'}
      variant="subtle"
      fontSize="10px"
      px={2}
      py={0.5}
      borderRadius="md"
      textTransform="uppercase"
      letterSpacing="0.02em"
    >
      {isBuy ? 'Compra' : 'Venta'}
    </Badge>
  )
}

function StatusDot({ status }: { status: string }) {
  const completed = (status || '').toUpperCase() === 'COMPLETED'
  return (
    <Tooltip label={status || 'Sin estado'}>
      <Box
        as="span"
        display="inline-block"
        w="8px"
        h="8px"
        borderRadius="full"
        bg={completed ? 'green.400' : 'yellow.400'}
        flexShrink={0}
      />
    </Tooltip>
  )
}

function TransactionActions({ tx }: { tx: BinanceTransaction }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isBuy = tx.tradeType === 'BUY'

  return (
    <>
      <IconButton
        aria-label={isBuy ? 'Validar comprobante' : 'Registrar KYC de venta'}
        icon={isBuy ? <FaCheckCircle /> : <FaAddressCard />}
        size="xs"
        colorScheme={isBuy ? 'blue' : 'purple'}
        variant="ghost"
        onClick={onOpen}
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: 'full', md: 'lg' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.400" />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: 4 }}
          maxH={{ base: '100vh', md: '90vh' }}
          borderRadius={{ base: 0, md: 'xl' }}
        >
          <ModalHeader fontSize="md" pb={2}>
            {isBuy ? 'Validar comprobante' : 'Registro KYC de venta'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            {isBuy ? (
              <ReceiptValidator
                transactionId={tx.id}
                expectedAmount={tx.fiatAmount}
                orderNumber={tx.orderNumber}
              />
            ) : (
              <SellKycForm
                transactionId={tx.id}
                orderNumber={tx.orderNumber}
                counterPartName={tx.counterPartName}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

function TransactionMobileCard({ tx }: { tx: BinanceTransaction }) {
  const bankLabel = tx.sellKyc?.bankName || tx.paymentMethod || 'N/A'
  const buyer = tx.counterPartName?.trim()

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor="surface.border"
      borderRadius="xl"
      bg="white"
      w="full"
      transition="border-color 0.15s, background 0.15s"
      _hover={{ borderColor: 'gray.300', bg: 'gray.50' }}
    >
      <Flex justify="space-between" align="center" gap={2} mb={2}>
        <HStack spacing={2}>
          <TradeTypeBadge type={tx.tradeType} />
          <StatusDot status={tx.orderStatus} />
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {formatTxDate(tx.createTime)}
        </Text>
      </Flex>

      <HStack justify="space-between" align="baseline" mb={1}>
        <Text fontSize="md" fontWeight="700" color="gray.800">
          {tx.amount.toFixed(2)}{' '}
          <Text as="span" fontSize="xs" fontWeight="500" color="gray.500">
            {tx.asset}
          </Text>
        </Text>
        <Text fontSize="sm" fontWeight="600" color="gray.700">
          {formatVes(tx.fiatAmount)}
        </Text>
      </HStack>

      {buyer && tx.tradeType === 'SELL' && (
        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1} noOfLines={1}>
          {buyer}
        </Text>
      )}

      <HStack justify="space-between" align="center" fontSize="xs" color="gray.500">
        <Text noOfLines={1}>
          @ {formatVes(tx.unitPrice)} · {bankLabel}
        </Text>
        <TransactionActions tx={tx} />
      </HStack>
    </Box>
  )
}

export default function SyncedTransactions() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [bankFilter, setBankFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const invalidateTransactions = useInvalidateBinanceTransactions()

  const queryParams = useMemo(() => {
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
      params.period = dateFilter
    }
    if (bankFilter.trim()) {
      params.bankName = bankFilter.trim()
    }
    return params
  }, [dateFilter, bankFilter, startDateFilter, endDateFilter])

  const { data: transactions = [], isLoading } = useBinanceTransactions(queryParams)

  useEffect(() => {
    if (dateFilter === 'yesterday') {
      const ymd = getYesterdayYmd()
      const key = `p2p-backfill-${ymd}`
      if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
        void requestBinanceSync({ backfillFrom: ymd, force: true }).then(() => {
          sessionStorage.setItem(key, '1')
        })
      }
    }

    const handleSync = () => {
      setTimeout(() => invalidateTransactions(), 1000)
    }
    window.addEventListener('binance-sync-completed', handleSync)

    return () => {
      window.removeEventListener('binance-sync-completed', handleSync)
    }
  }, [dateFilter, invalidateTransactions])

  const completedSells = transactions.filter(
    (t) => t.tradeType === 'SELL' && (t.orderStatus || '').toUpperCase() === 'COMPLETED'
  )
  const sellTotalUsdt = completedSells.reduce((s, t) => s + t.amount, 0)
  const sellTotalBs = completedSells.reduce((s, t) => s + t.fiatAmount, 0)
  const showDaySummary = dateFilter !== 'all' || Boolean(startDateFilter || endDateFilter)

  return (
    <Card overflow="hidden" w="full" maxW="100%">
      <CardHeader pb={3} borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
        <HStack justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="700" color="gray.700">
              Transacciones
            </Text>
            {!isLoading && (
              <Badge
                colorScheme="gray"
                variant="subtle"
                borderRadius="full"
                px={2}
                fontSize="10px"
                fontWeight="600"
              >
                {transactions.length}
              </Badge>
            )}
            <Box
              as="span"
              className="live-dot"
              w="8px"
              h="8px"
              bg="green.400"
              borderRadius="full"
            />
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 2, md: 5 }} gap={2} alignItems="center">
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            size="sm"
            bg="white"
            borderRadius="lg"
            gridColumn={{ base: '1 / -1', md: 'auto' }}
          >
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="threeMonths">Últimos 3 meses</option>
            <option value="all">Todos</option>
          </Select>
          <Input
            size="sm"
            placeholder="Banco"
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            bg="white"
            borderRadius="lg"
          />
          <Input
            type="date"
            size="sm"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            aria-label="Fecha desde"
            bg="white"
            borderRadius="lg"
          />
          <Input
            type="date"
            size="sm"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            aria-label="Fecha hasta"
            bg="white"
            borderRadius="lg"
          />
          <Button
            size="sm"
            variant="ghost"
            colorScheme="gray"
            borderRadius="lg"
            onClick={() => {
              setDateFilter('today')
              setBankFilter('')
              setStartDateFilter('')
              setEndDateFilter('')
            }}
          >
            Limpiar
          </Button>
        </SimpleGrid>
      </CardHeader>

      <CardBody pt={4} overflow="hidden">
        {showDaySummary && !isLoading && completedSells.length > 0 && (
          <SimpleGrid columns={3} spacing={2} mb={4}>
            <Box textAlign="center" py={2} px={1}>
              <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="0.04em">
                Ventas
              </Text>
              <Text fontSize="md" fontWeight="700" color="gray.800">
                {completedSells.length}
              </Text>
            </Box>
            <Box textAlign="center" py={2} px={1} borderLeftWidth="1px" borderRightWidth="1px" borderColor="surface.border">
              <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="0.04em">
                USDT
              </Text>
              <Text fontSize="md" fontWeight="700" color="gray.800">
                {sellTotalUsdt.toFixed(2)}
              </Text>
            </Box>
            <Box textAlign="center" py={2} px={1}>
              <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="0.04em">
                Bs.S
              </Text>
              <Text fontSize="md" fontWeight="700" color="gray.800">
                {sellTotalBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
              </Text>
            </Box>
          </SimpleGrid>
        )}

        {isLoading ? (
          <Text fontSize="sm" color="gray.500" py={6} textAlign="center">
            Cargando transacciones...
          </Text>
        ) : transactions.length === 0 ? (
          <VStack spacing={2} py={10}>
            <Text color="gray.500" textAlign="center" fontSize="sm">
              No hay transacciones en este filtro
            </Text>
            <Text color="gray.400" textAlign="center" fontSize="xs">
              Cambia el período o sincroniza desde Binance
            </Text>
          </VStack>
        ) : (
          <>
            <Hide above="md">
              <VStack spacing={2} align="stretch" w="full">
                {transactions.map((tx) => (
                  <TransactionMobileCard key={tx.id} tx={tx} />
                ))}
              </VStack>
            </Hide>

            <Show above="md">
              <TableContainer overflowX="auto" className="table-scroll" maxW="100%">
                <Table variant="unstyled" size="sm">
                  <Thead>
                    <Tr>
                      {['Fecha', 'Tipo', 'Cant.', 'P. unit.', 'Total', 'Contraparte', ''].map((label) => (
                        <Th
                          key={label || 'actions'}
                          fontSize="10px"
                          fontWeight="600"
                          color="gray.500"
                          textTransform="uppercase"
                          letterSpacing="0.04em"
                          borderBottomWidth="1px"
                          borderColor="surface.border"
                          pb={2}
                          px={2}
                          isNumeric={label === 'Cant.' || label === 'P. unit.' || label === 'Total'}
                        >
                          {label}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transactions.map((tx) => {
                      const bankLabel = tx.sellKyc?.bankName || tx.paymentMethod || ''
                      const buyer = tx.counterPartName?.trim() || ''
                      const counterpartPrimary =
                        tx.tradeType === 'SELL'
                          ? buyer || bankLabel || '—'
                          : bankLabel || buyer || '—'
                      const counterpartSecondary =
                        tx.tradeType === 'SELL' && buyer && bankLabel && bankLabel !== buyer
                          ? bankLabel
                          : ''
                      const counterpartTip = [buyer, bankLabel].filter(Boolean).join(' · ') || '—'
                      return (
                        <Tr
                          key={tx.id}
                          transition="background 0.12s"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Td
                            fontSize="xs"
                            color="gray.600"
                            whiteSpace="nowrap"
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            px={2}
                            py={2.5}
                          >
                            {formatTxDate(tx.createTime)}
                          </Td>
                          <Td borderBottomWidth="1px" borderColor="gray.100" px={2} py={2.5}>
                            <HStack spacing={2}>
                              <TradeTypeBadge type={tx.tradeType} />
                              <StatusDot status={tx.orderStatus} />
                            </HStack>
                          </Td>
                          <Td
                            isNumeric
                            whiteSpace="nowrap"
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            px={2}
                            py={2.5}
                          >
                            <Text as="span" fontWeight="600" fontSize="sm">
                              {tx.amount.toFixed(2)}
                            </Text>
                            <Text as="span" fontSize="10px" color="gray.500" ml={1}>
                              {tx.asset}
                            </Text>
                          </Td>
                          <Td
                            isNumeric
                            whiteSpace="nowrap"
                            fontSize="xs"
                            color="gray.600"
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            px={2}
                            py={2.5}
                          >
                            {formatVes(tx.unitPrice)}
                          </Td>
                          <Td
                            isNumeric
                            whiteSpace="nowrap"
                            fontWeight="600"
                            fontSize="sm"
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            px={2}
                            py={2.5}
                          >
                            {formatVes(tx.fiatAmount)}
                          </Td>
                          <Td
                            maxW="160px"
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            px={2}
                            py={2.5}
                          >
                            <Tooltip label={counterpartTip}>
                              <Box>
                                <Text
                                  fontSize="xs"
                                  fontWeight="600"
                                  color="gray.700"
                                  noOfLines={1}
                                >
                                  {counterpartPrimary}
                                </Text>
                                {counterpartSecondary ? (
                                  <Text fontSize="10px" color="gray.500" noOfLines={1}>
                                    {counterpartSecondary}
                                  </Text>
                                ) : null}
                              </Box>
                            </Tooltip>
                          </Td>
                          <Td
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            px={1}
                            py={2.5}
                            textAlign="right"
                          >
                            <TransactionActions tx={tx} />
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Show>
          </>
        )}
      </CardBody>
    </Card>
  )
}
