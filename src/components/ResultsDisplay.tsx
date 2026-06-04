'use client'

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
  Divider,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  SimpleGrid
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import InsightPanel from '@/components/ui/InsightPanel'
import StatTile from '@/components/ui/StatTile'

const MotionBox = motion(Box)

import { CalculationResults, FormData } from '@/utils/calculations'

interface ResultsDisplayProps {
  results?: CalculationResults | null
  formData?: FormData | null
}

export default function ResultsDisplay({ results, formData }: ResultsDisplayProps) {
  if (!results) {
    return (
      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
            <Heading size="md" color="gray.800">Resultados</Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Completa el formulario para simular
            </Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="center" py={8}>
              <Text color="gray.500" textAlign="center">
                Completa el formulario para ver los resultados del cálculo
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </MotionBox>
    )
  }

  const isProfitable = results.netProfit > 0
  const profitColor = isProfitable ? 'green' : 'red'

  // Datos para gráficos
  const chartData = [
    { name: 'Inversión', value: results.totalInvestment, color: '#3182CE' },
    { name: 'Ingresos', value: results.totalRevenue, color: '#38A169' },
    { name: 'Comisiones', value: results.totalCosts, color: '#E53E3E' },
    { name: 'Ganancia Neta', value: results.netProfit, color: isProfitable ? '#38A169' : '#E53E3E' }
  ]

  const profitData = [
    { name: 'Ganancia Bruta', value: results.grossProfit, color: '#3182CE' },
    { name: 'Comisiones', value: results.totalCosts, color: '#E53E3E' },
    { name: 'Ganancia Neta', value: results.netProfit, color: isProfitable ? '#38A169' : '#E53E3E' }
  ]

  return (
    <MotionBox
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
          <Heading size="md" color="gray.800">Resultados del cálculo</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Rentabilidad, desglose y proyecciones
          </Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={6}>
            {/* Resumen Principal */}
            <Box w="full">
              <HStack justify="space-between" mb={4}>
                <Text fontWeight="bold" fontSize="lg">
                  Resumen de la Transacción
                </Text>
                <Badge colorScheme={profitColor} fontSize="md" px={3} py={1}>
                  {isProfitable ? 'Rentable' : 'Pérdida'}
                </Badge>
              </HStack>

              <VStack spacing={4}>
                <StatTile accent={isProfitable ? 'green' : 'red'} w="full">
                  <StatLabel color={profitColor + '.700'}>Ganancia neta</StatLabel>
                  <StatNumber color={profitColor + '.600'} fontSize="2xl">
                    {results.netProfit.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type={isProfitable ? 'increase' : 'decrease'} />
                    {results.roi.toFixed(2)}% ROI
                  </StatHelpText>
                </StatTile>

                <Progress
                  value={Math.min(100, Math.abs(results.roi))}
                  colorScheme={isProfitable ? 'green' : 'red'}
                  size="lg"
                  w="full"
                  borderRadius="full"
                />
              </VStack>
            </Box>

            <Divider />

            {/* Estadísticas Detalladas */}
            <Box w="full">
              <Text fontWeight="bold" mb={4}>
                Desglose Detallado
              </Text>
              
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Concepto</Th>
                      <Th isNumeric>Monto (VES)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Inversión Total</Td>
                      <Td isNumeric>
                        {results.totalInvestment.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Ingresos Totales</Td>
                      <Td isNumeric>
                        {results.totalRevenue.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Ganancia Bruta</Td>
                      <Td isNumeric color="blue.500">
                        {results.grossProfit.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Comisión Bancaria</Td>
                      <Td isNumeric color="red.500">
                        -{results.bankCommissionAmount.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Comisión Binance</Td>
                      <Td isNumeric color="red.500">
                        -{results.binanceCommissionAmount.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                      </Td>
                    </Tr>
                    <Tr fontWeight="bold" bg={profitColor + '.50'}>
                      <Td>Ganancia Neta</Td>
                      <Td isNumeric color={profitColor + '.500'}>
                        {results.netProfit.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Divider />

            {/* Métricas de Rentabilidad */}
            <Box w="full">
              <Text fontWeight="bold" mb={4}>
                Métricas de Rentabilidad
              </Text>
              
              <HStack spacing={4} wrap="wrap">
                <Stat textAlign="center" minW="120px">
                  <StatLabel>Margen de Ganancia</StatLabel>
                  <StatNumber color={profitColor + '.500'}>
                    {results.profitMargin.toFixed(2)}%
                  </StatNumber>
                </Stat>
                
                <Stat textAlign="center" minW="120px">
                  <StatLabel>ROI</StatLabel>
                  <StatNumber color={profitColor + '.500'}>
                    {results.roi.toFixed(2)}%
                  </StatNumber>
                </Stat>
              </HStack>
            </Box>

            {/* Gráfico de Barras */}
            {chartData && chartData.length > 0 && (
              <Box w="full" h="200px" minW="300px" minH="200px">
                <Text fontWeight="bold" mb={2}>
                  Desglose Visual
                </Text>
                <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        value.toLocaleString('es-VE', { style: 'currency', currency: 'VES' }),
                        ''
                      ]}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Alertas y Recomendaciones */}
            {results.netProfit < 0 && (
              <Alert status="warning" borderRadius="xl" variant="subtle">
                <AlertIcon />
                <Box>
                  <AlertTitle>Transacción no rentable!</AlertTitle>
                  <AlertDescription>
                    Esta transacción resultaría en una pérdida. Considera ajustar los precios o reducir las comisiones.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {results.profitMargin < 5 && results.netProfit > 0 && (
              <Alert status="info" borderRadius="xl" variant="subtle">
                <AlertIcon />
                <Box>
                  <AlertTitle>Margen bajo</AlertTitle>
                  <AlertDescription>
                    El margen de ganancia es menor al 5%. Considera si vale la pena el riesgo.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {results.profitMargin > 20 && (
              <Alert status="success" borderRadius="xl" variant="subtle">
                <AlertIcon />
                <Box>
                  <AlertTitle>Excelente oportunidad!</AlertTitle>
                  <AlertDescription>
                    Esta transacción tiene un margen de ganancia muy atractivo.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Sección de Proyecciones Avanzadas */}
            <Divider />
            
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="gray.800">
                Proyecciones avanzadas
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <InsightPanel accent="blue">
                  <Text fontWeight="bold" color="blue.700" mb={2}>
                    Ciclos diarios
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    Ciclos: <strong>{formData?.cyclesPerDay || 5}</strong>
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    Por ciclo: <strong>{results.grossProfit.toFixed(2)} Bs.S</strong>
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    Diario: <strong>{(results.grossProfit * (formData?.cyclesPerDay || 5)).toFixed(2)} Bs.S</strong>
                  </Text>
                </InsightPanel>

                <InsightPanel accent="green">
                  <Text fontWeight="bold" color="green.700" mb={2}>
                    Proyección mensual
                  </Text>
                  <Text fontSize="sm" color="green.700">
                    Mensual: <strong>{(results.grossProfit * (formData?.cyclesPerDay || 5) * (formData?.workingDaysPerMonth || 30)).toFixed(2)} Bs.S</strong>
                  </Text>
                  <Text fontSize="sm" color="green.700">
                    ROI: <strong>{((results.grossProfit * (formData?.cyclesPerDay || 5) * (formData?.workingDaysPerMonth || 30)) / ((formData?.usdtAmount || 0) * (formData?.buyPrice || 0)) * 100).toFixed(1)}%</strong>
                  </Text>
                </InsightPanel>
              </SimpleGrid>

              <InsightPanel accent="purple">
                <Text fontWeight="bold" color="purple.700" mb={3}>
                  Perfil P2P (referencia)
                </Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                      Actual
                    </Text>
                    <Text fontSize="xs" color="gray.600">Órdenes: 150 · BTC 30d: 0.3</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                      Meta
                    </Text>
                    <Text fontSize="xs" color="gray.600">450 órdenes · 1 BTC / 30d</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                      Tiempo est.
                    </Text>
                    <Text fontSize="xs" color="gray.600">~16 días (según ciclos)</Text>
                  </Box>
                </SimpleGrid>
              </InsightPanel>

              <InsightPanel accent="orange">
                <Text fontWeight="bold" color="orange.700" mb={2}>
                  Alertas de margen
                </Text>
                {results.profitMargin < 0.5 && (
                  <Text fontSize="sm" color="orange.600">
                    ⚠️ Margen muy bajo ({results.profitMargin.toFixed(1)}%). Considera aumentar el precio de venta.
                  </Text>
                )}
                {results.profitMargin >= 0.5 && results.profitMargin < 1.0 && (
                  <Text fontSize="sm" color="yellow.600">
                    ⚡ Margen moderado ({results.profitMargin.toFixed(1)}%). Monitorea el mercado.
                  </Text>
                )}
                {results.profitMargin >= 1.0 && (
                  <Text fontSize="sm" color="green.600">
                    ✅ Margen saludable ({results.profitMargin.toFixed(1)}%). Buen nivel de ganancia.
                  </Text>
                )}
              </InsightPanel>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}
