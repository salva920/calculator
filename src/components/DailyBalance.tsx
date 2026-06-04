'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Progress,
  SimpleGrid,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  ButtonGroup
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useBalance } from '@/hooks/useTransactions'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatTile from '@/components/ui/StatTile'
import InsightPanel from '@/components/ui/InsightPanel'

const MotionBox = motion(Box)

interface DailyBalanceProps {
  date?: string
  days?: number
}

export default function DailyBalance({ date, days = 7 }: DailyBalanceProps) {
  // Filtros locales para cambiar el rango (hoy, ayer, últimos N días)
  const [filters, setFilters] = useState<{ date?: string; days: number }>({
    date,
    days
  })

  const setLast7Days = () =>
    setFilters({
      date: undefined,
      days: 7
    })

  const setToday = () => {
    const today = new Date()
    setFilters({
      date: today.toISOString(),
      days: 1
    })
  }

  const setYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setFilters({
      date: yesterday.toISOString(),
      days: 1
    })
  }

  const { data: balanceData, isLoading, error } = useBalance(filters.date, filters.days)

  if (isLoading) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardBody>
            <Text>Cargando balance diario...</Text>
          </CardBody>
        </Card>
      </MotionBox>
    )
  }

  if (error || !balanceData?.success) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert status="error" borderRadius="xl">
          <AlertIcon />
          <Box>
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>
              No se pudo cargar el balance diario. {balanceData?.error || 'Error desconocido'}
            </AlertDescription>
          </Box>
        </Alert>
      </MotionBox>
    )
  }

  const { dailyBalances, summary } = balanceData.data!

  const isProfitable = summary.totalNetProfit > 0
  const profitColor = isProfitable ? 'green' : 'red'

  // Datos para gráficos
  const chartData = dailyBalances.map(balance => ({
    date: new Date(balance.date).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' }),
    ganancia: balance.totalNetProfit,
    transacciones: balance.totalTransactions,
    usdt: balance.totalUsdtAmount
  }))

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Box>
              <Heading size="md" color="gray.800">
                Últimos {filters.days} días
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={0.5}>
                Ganancias, volumen y detalle por fecha
              </Text>
            </Box>
            <ButtonGroup size="sm" variant="outline" isAttached borderRadius="full" overflow="hidden">
              <Button
                onClick={setLast7Days}
                borderRadius="0"
                colorScheme={filters.days === 7 && !filters.date ? 'brand' : 'gray'}
                variant={filters.days === 7 && !filters.date ? 'solid' : 'outline'}
              >
                7 días
              </Button>
              <Button
                onClick={setToday}
                borderRadius="0"
                colorScheme={filters.days === 1 && !!filters.date ? 'brand' : 'gray'}
                variant={filters.days === 1 && !!filters.date ? 'solid' : 'outline'}
              >
                Hoy
              </Button>
              <Button
                onClick={setYesterday}
                borderRadius="0"
                colorScheme={filters.days === 1 && !!filters.date ? 'brand' : 'gray'}
                variant="outline"
              >
                Ayer
              </Button>
            </ButtonGroup>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={6}>
            {/* Resumen General */}
            <Box w="full">
              <HStack justify="space-between" mb={4}>
                <Text fontWeight="bold" fontSize="lg">
                  Resumen General
                </Text>
                <Badge colorScheme={profitColor} fontSize="md" px={3} py={1}>
                  {isProfitable ? 'Rentable' : 'Pérdida'}
                </Badge>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <StatTile accent="brand">
                  <StatLabel color="brand.700">Ganancia total</StatLabel>
                  <StatNumber color="brand.800" fontSize="xl">
                    {summary.totalNetProfit.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type={isProfitable ? 'increase' : 'decrease'} />
                    {summary.averageROI.toFixed(2)}% ROI promedio
                  </StatHelpText>
                </StatTile>

                <StatTile accent="green">
                  <StatLabel color="green.700">Transacciones</StatLabel>
                  <StatNumber color="green.800" fontSize="xl">
                    {summary.totalTransactions}
                  </StatNumber>
                  <StatHelpText>{summary.totalDays} días activos</StatHelpText>
                </StatTile>

                <StatTile accent="purple">
                  <StatLabel color="purple.700">USDT total</StatLabel>
                  <StatNumber color="purple.800" fontSize="xl">
                    {summary.totalUsdtAmount.toFixed(2)}
                  </StatNumber>
                  <StatHelpText>Volumen</StatHelpText>
                </StatTile>

                <StatTile accent="orange">
                  <StatLabel color="orange.700">Proyección mensual</StatLabel>
                  <StatNumber color="orange.800" fontSize="xl">
                    {summary.projectedMonthly.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                  </StatNumber>
                  <StatHelpText>Promedio diario</StatHelpText>
                </StatTile>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Gráfico de Ganancias Diarias */}
            {chartData && chartData.length > 0 && (
              <Box w="full" h="300px" minW="300px" minH="300px">
                <Text fontWeight="bold" mb={4} color="gray.700">
                  Ganancias diarias
                </Text>
                <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        value.toLocaleString('es-VE', { style: 'currency', currency: 'VES' }),
                        'Ganancia'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ganancia" 
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            <Divider />

            {/* Tabla de Balance Diario */}
            <Box w="full">
              <Text fontWeight="bold" mb={4} color="gray.700">
                Detalle por día
              </Text>
              
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Fecha</Th>
                      <Th isNumeric>Transacciones</Th>
                      <Th isNumeric>USDT</Th>
                      <Th isNumeric>Ganancia Bruta</Th>
                      <Th isNumeric>Ganancia Neta</Th>
                      <Th isNumeric>ROI</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dailyBalances.map((balance, index) => {
                      const isDayProfitable = balance.totalNetProfit > 0
                      return (
                        <Tr key={index} bg={isDayProfitable ? 'green.50' : 'red.50'} _hover={{ bg: isDayProfitable ? 'green.100' : 'red.100' }}>
                          <Td>
                            {new Date(balance.date).toLocaleDateString('es-VE', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Td>
                          <Td isNumeric>{balance.totalTransactions}</Td>
                          <Td isNumeric>{balance.totalUsdtAmount.toFixed(2)}</Td>
                          <Td isNumeric color="blue.500">
                            ${balance.totalGrossProfit.toLocaleString('es-VE')}
                          </Td>
                          <Td isNumeric color={isDayProfitable ? 'green.500' : 'red.500'}>
                            ${balance.totalNetProfit.toLocaleString('es-VE')}
                          </Td>
                          <Td isNumeric color={isDayProfitable ? 'green.500' : 'red.500'}>
                            {balance.averageROI.toFixed(2)}%
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            {/* Mejor y Peor Día */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <InsightPanel accent="green">
                <Text fontWeight="bold" color="green.700" mb={2}>
                  Mejor día
                </Text>
                <Text fontSize="sm" color="green.700">
                  {summary.bestDay.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                </Text>
              </InsightPanel>
              <InsightPanel accent="red">
                <Text fontWeight="bold" color="red.700" mb={2}>
                  Peor día
                </Text>
                <Text fontSize="sm" color="red.700">
                  {summary.worstDay.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                </Text>
              </InsightPanel>
            </SimpleGrid>

            {/* Alertas y Recomendaciones */}
            {summary.averageDailyProfit < 0 && (
              <Alert status="warning" borderRadius="xl" variant="subtle">
                <AlertIcon />
                <Box>
                  <AlertTitle>Pérdidas detectadas!</AlertTitle>
                  <AlertDescription>
                    El promedio diario muestra pérdidas. Revisa tu estrategia de precios y comisiones.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {summary.averageDailyProfit > 0 && summary.averageROI < 5 && (
              <Alert status="info" borderRadius="xl" variant="subtle">
                <AlertIcon />
                <Box>
                  <AlertTitle>Margen bajo</AlertTitle>
                  <AlertDescription>
                    El ROI promedio es menor al 5%. Considera optimizar tus precios para mayor rentabilidad.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {summary.averageROI > 10 && (
              <Alert status="success" borderRadius="xl" variant="subtle">
                <AlertIcon />
                <Box>
                  <AlertTitle>Excelente rendimiento!</AlertTitle>
                  <AlertDescription>
                    ROI promedio superior al 10%. ¡Mantén esta estrategia!
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}

