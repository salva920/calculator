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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

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
        <Alert status="error">
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
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Heading size="md" color="purple.600">
              💰 Balance Diario - Últimos {filters.days} días
            </Heading>
            <ButtonGroup size="sm" variant="outline" isAttached>
              <Button
                onClick={setLast7Days}
                colorScheme={filters.days === 7 && !filters.date ? 'purple' : undefined}
              >
                Últimos 7 días
              </Button>
              <Button
                onClick={setToday}
                colorScheme={filters.days === 1 && !!filters.date ? 'blue' : undefined}
              >
                Hoy
              </Button>
              <Button
                onClick={setYesterday}
                colorScheme={filters.days === 1 && !!filters.date ? 'green' : undefined}
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
                <Stat textAlign="center" p={3} bg="blue.50" borderRadius="md">
                  <StatLabel color="blue.600">Ganancia Total</StatLabel>
                  <StatNumber color="blue.700" fontSize="xl">
                    ${summary.totalNetProfit.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type={isProfitable ? 'increase' : 'decrease'} />
                    {summary.averageROI.toFixed(2)}% ROI promedio
                  </StatHelpText>
                </Stat>

                <Stat textAlign="center" p={3} bg="green.50" borderRadius="md">
                  <StatLabel color="green.600">Transacciones</StatLabel>
                  <StatNumber color="green.700" fontSize="xl">
                    {summary.totalTransactions}
                  </StatNumber>
                  <StatHelpText>
                    {summary.totalDays} días activos
                  </StatHelpText>
                </Stat>

                <Stat textAlign="center" p={3} bg="purple.50" borderRadius="md">
                  <StatLabel color="purple.600">USDT Total</StatLabel>
                  <StatNumber color="purple.700" fontSize="xl">
                    {summary.totalUsdtAmount.toFixed(2)}
                  </StatNumber>
                  <StatHelpText>
                    Volumen total
                  </StatHelpText>
                </Stat>

                <Stat textAlign="center" p={3} bg="orange.50" borderRadius="md">
                  <StatLabel color="orange.600">Proyección Mensual</StatLabel>
                  <StatNumber color="orange.700" fontSize="xl">
                    ${summary.projectedMonthly.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                  </StatNumber>
                  <StatHelpText>
                    Basado en promedio diario
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Gráfico de Ganancias Diarias */}
            {chartData && chartData.length > 0 && (
              <Box w="full" h="300px" minW="300px" minH="300px">
                <Text fontWeight="bold" mb={4} color="blue.600">
                  📈 Ganancias Diarias
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
                      stroke="#3182CE" 
                      strokeWidth={2}
                      dot={{ fill: '#3182CE', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            <Divider />

            {/* Tabla de Balance Diario */}
            <Box w="full">
              <Text fontWeight="bold" mb={4} color="green.600">
                📊 Detalle por Día
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
                        <Tr key={index} bg={isDayProfitable ? 'green.50' : 'red.50'}>
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
              <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                <Text fontWeight="bold" color="green.700" mb={2}>
                  🏆 Mejor Día
                </Text>
                <Text fontSize="sm" color="green.600">
                  Ganancia: <strong>${summary.bestDay.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}</strong>
                </Text>
              </Box>
              
              <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                <Text fontWeight="bold" color="red.700" mb={2}>
                  📉 Peor Día
                </Text>
                <Text fontSize="sm" color="red.600">
                  Ganancia: <strong>${summary.worstDay.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}</strong>
                </Text>
              </Box>
            </SimpleGrid>

            {/* Alertas y Recomendaciones */}
            {summary.averageDailyProfit < 0 && (
              <Alert status="warning">
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
              <Alert status="info">
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
              <Alert status="success">
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

