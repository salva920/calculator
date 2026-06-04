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
import { CalculationResults, FormData } from '@/utils/calculations'

const MotionBox = motion(Box)

interface ExecutiveSummaryProps {
  results?: CalculationResults | null
  formData?: FormData | null
}

export default function ExecutiveSummary({ results, formData }: ExecutiveSummaryProps) {
  if (!results || !formData) {
    return null
  }

  const isProfitable = results.netProfit > 0
  const profitColor = isProfitable ? 'green' : 'red'

  // Cálculos basados en los datos del formulario
  const cyclesPerDay = formData.cyclesPerDay || 5
  const workingDaysPerMonth = formData.workingDaysPerMonth || 30
  const dailyProfit = (results.grossProfit || 0) * cyclesPerDay
  const monthlyProfit = dailyProfit * workingDaysPerMonth
  const monthlyROI = (monthlyProfit / ((formData.usdtAmount || 0) * (formData.buyPrice || 0))) * 100

  // Perfil P2P actual (basado en datos del formulario)
  const currentProfile = {
    totalOrders: formData.currentOrders || 150,
    btc30Days: formData.currentBtc30Days || 0.3,
    btcTotal: formData.currentBtcTotal || 2
  }

  const targetProfile = {
    totalOrders: formData.targetOrders || 450,
    btc30Days: formData.targetBtc30Days || 1,
    btcTotal: formData.targetBtcTotal || 2
  }

  // Cálculos de tiempo para alcanzar metas
  const daysToOrders = (targetProfile.totalOrders - currentProfile.totalOrders) / cyclesPerDay
  const daysToBtc = (targetProfile.btc30Days - currentProfile.btc30Days) / ((formData.usdtAmount || 0) / 100000) // Asumiendo 1 BTC = 100,000 VES
  const totalDays = Math.max(daysToOrders, daysToBtc)

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <Heading size="md" color="purple.600">
            📊 Resumen Ejecutivo - Cálculo de Tasas y Ganancia
          </Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={6}>
            {/* Datos de Entrada */}
            <Box w="full">
              <Text fontWeight="bold" mb={3} color="blue.600">
                Datos de Entrada
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <HStack justify="space-between">
                  <Text fontSize="sm">Capital:</Text>
                  <Text fontWeight="bold" color="blue.600">
                    ${(formData.usdtAmount || 0).toFixed(2)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Comisión:</Text>
                  <Text fontWeight="bold" color="blue.600">
                    {(formData.bankCommission || 0)}%
                  </Text>
                </HStack>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Cálculos Principales */}
            <Box w="full">
              <Text fontWeight="bold" mb={3} color="green.600">
                Cálculos Principales
              </Text>
              
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Concepto</Th>
                      <Th>Tasa (VES)</Th>
                      <Th>Monto (VES)</Th>
                      <Th>Ganancia</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td fontWeight="semibold">Venta Lote Completo</Td>
                      <Td isNumeric>{(formData.sellPrice || 0).toFixed(2)}</Td>
                      <Td isNumeric>{(results.totalRevenue || 0).toLocaleString('es-VE')}</Td>
                      <Td isNumeric color="green.500">
                        {(results.grossProfit || 0).toFixed(2)}%
                      </Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Compra de {formData.usdtAmount || 0} USDT</Td>
                      <Td isNumeric>{(formData.buyPrice || 0).toFixed(2)}</Td>
                      <Td isNumeric>{(results.totalInvestment || 0).toLocaleString('es-VE')}</Td>
                      <Td isNumeric color="blue.500">
                        {(results.profitMargin || 0).toFixed(2)}%
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Divider />

            {/* Proyecciones de Ganancia */}
            <Box w="full">
              <Text fontWeight="bold" mb={3} color="purple.600">
                Proyecciones de Ganancia
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Stat textAlign="center" p={3} bg="blue.50" borderRadius="md">
                  <StatLabel color="blue.600">Ciclos al Día</StatLabel>
                  <StatNumber color="blue.700">{cyclesPerDay}</StatNumber>
                </Stat>
                
                <Stat textAlign="center" p={3} bg="green.50" borderRadius="md">
                  <StatLabel color="green.600">Ganancia Diaria</StatLabel>
                  <StatNumber color="green.700">
                    ${dailyProfit.toFixed(2)}
                  </StatNumber>
                </Stat>
                
                <Stat textAlign="center" p={3} bg="purple.50" borderRadius="md">
                  <StatLabel color="purple.600">Ganancia Mensual</StatLabel>
                  <StatNumber color="purple.700">
                    ${monthlyProfit.toFixed(2)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {monthlyROI.toFixed(1)}% ROI
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Análisis de Perfil P2P */}
            <Box w="full">
              <Text fontWeight="bold" mb={3} color="orange.600">
                Análisis de Perfil P2P
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box p={3} bg="orange.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="semibold" color="orange.700" mb={2}>
                    Perfil Actual
                  </Text>
                  <VStack spacing={1} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs">Total Órdenes:</Text>
                      <Text fontSize="xs" fontWeight="bold">{currentProfile.totalOrders}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs">BTC 30 Días:</Text>
                      <Text fontSize="xs" fontWeight="bold">{currentProfile.btc30Days}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs">BTC Total:</Text>
                      <Text fontSize="xs" fontWeight="bold">{currentProfile.btcTotal}</Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Box p={3} bg="green.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={2}>
                    Meta a Lograr
                  </Text>
                  <VStack spacing={1} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs">450 Órdenes:</Text>
                      <Text fontSize="xs" fontWeight="bold">{daysToOrders.toFixed(1)} días</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs">1 BTC 30 Días:</Text>
                      <Text fontSize="xs" fontWeight="bold">{daysToBtc.toFixed(1)} días</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs">2 BTC Total:</Text>
                      <Text fontSize="xs" fontWeight="bold">0.0 días</Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Box p={3} bg="purple.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={2}>
                    Tiempo Total
                  </Text>
                  <VStack spacing={1} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs">Total a Tardar:</Text>
                      <Text fontSize="xs" fontWeight="bold" color="purple.600">
                        {totalDays.toFixed(0)} días
                      </Text>
                    </HStack>
                    <Progress 
                      value={Math.min(100, (currentProfile.totalOrders / targetProfile.totalOrders) * 100)} 
                      colorScheme="purple" 
                      size="sm" 
                    />
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      Progreso hacia meta
                    </Text>
                  </VStack>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Resumen Final */}
            <Box w="full" p={4} bg={profitColor + '.50'} borderRadius="md" border="1px solid" borderColor={profitColor + '.200'}>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold" color={profitColor + '.700'}>
                  Resumen Final
                </Text>
                <Badge colorScheme={profitColor} fontSize="sm">
                  {isProfitable ? 'Rentable' : 'Pérdida'}
                </Badge>
              </HStack>
              <Text fontSize="sm" color={profitColor + '.600'}>
                Con {cyclesPerDay} ciclos diarios, esta estrategia generaría{' '}
                <strong>${monthlyProfit.toFixed(2)}</strong> mensuales con un ROI del{' '}
                <strong>{monthlyROI.toFixed(1)}%</strong>.
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}
