'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  VStack,
  HStack,
  Text,
  Divider,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  useToast,
  SimpleGrid
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useBinancePrice } from '@/hooks/useBinancePrice'
import { useSaveTransaction } from '@/hooks/useTransactions'
import { calculateProfits } from '@/utils/calculations'
import PriceStatus from './PriceStatus'

const MotionBox = motion(Box)

interface FormData {
  usdtAmount: number
  buyPrice: number
  sellPrice: number
  buyPriceType: 'fixed' | 'variable'
  sellPriceType: 'fixed' | 'variable'
  buyPriceMargin: number
  sellPriceMargin: number
  bankCommission: number
  bankCommissionType: 'percentage' | 'fixed'
  binanceCommission: number
  // Proyecciones avanzadas
  cyclesPerDay: number
  workingDaysPerMonth: number
  currentOrders: number
  targetOrders: number
  currentBtc30Days: number
  targetBtc30Days: number
  currentBtcTotal: number
  targetBtcTotal: number
}

interface CalculatorFormProps {
  onResultsChange: (results: any) => void
  onFormDataChange: (formData: FormData) => void
}

export default function CalculatorForm({ onResultsChange, onFormDataChange }: CalculatorFormProps) {
  const [formData, setFormData] = useState<FormData>({
    usdtAmount: 100,
    buyPrice: 250.0, // Precio por defecto basado en Binance P2P actual
    sellPrice: 260.0, // Precio por defecto basado en Binance P2P actual
    buyPriceType: 'fixed',
    sellPriceType: 'fixed',
    buyPriceMargin: 95,
    sellPriceMargin: 105,
    bankCommission: 2,
    bankCommissionType: 'percentage',
    binanceCommission: 0,
    // Proyecciones avanzadas - valores por defecto
    cyclesPerDay: 5,
    workingDaysPerMonth: 30,
    currentOrders: 150,
    targetOrders: 450,
    currentBtc30Days: 0.3,
    targetBtc30Days: 1.0,
    currentBtcTotal: 2.0,
    targetBtcTotal: 2.0
  })

  const [results, setResults] = useState<any>(null)
  const { data: binanceData, isLoading: priceLoading, error: priceError } = useBinancePrice()
  const saveTransaction = useSaveTransaction()
  const toast = useToast()
  
  const binancePrice = binanceData?.price
  const isFallback = binanceData?.isFallback
  const lastUpdate = binanceData?.timestamp
  const source = binanceData?.source
  

  // Calcular precios cuando cambie el precio de Binance o los márgenes
  useEffect(() => {
    if (binancePrice && formData.buyPriceType === 'variable') {
      const calculatedPrice = (binancePrice * formData.buyPriceMargin) / 100
      setFormData(prev => ({ ...prev, buyPrice: calculatedPrice }))
    }
  }, [binancePrice, formData.buyPriceMargin, formData.buyPriceType])

  useEffect(() => {
    if (binancePrice && formData.sellPriceType === 'variable') {
      const calculatedPrice = (binancePrice * formData.sellPriceMargin) / 100
      setFormData(prev => ({ ...prev, sellPrice: calculatedPrice }))
    }
  }, [binancePrice, formData.sellPriceMargin, formData.sellPriceType])

  // Calcular resultados cuando cambien los datos
  useEffect(() => {
    if (formData.usdtAmount > 0 && formData.buyPrice > 0 && formData.sellPrice > 0) {
      const calculatedResults = calculateProfits(formData)
      setResults(calculatedResults)
      onResultsChange(calculatedResults)
      onFormDataChange(formData)
    }
  }, [formData, onResultsChange, onFormDataChange])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCalculate = () => {
    if (formData.usdtAmount <= 0 || formData.buyPrice <= 0 || formData.sellPrice <= 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const calculatedResults = calculateProfits(formData)
    setResults(calculatedResults)
    onResultsChange(calculatedResults)
    onFormDataChange(formData)
    
    toast({
      title: "Cálculo completado",
      description: "Las ganancias han sido calculadas",
      status: "success",
      duration: 2000,
      isClosable: true,
    })
  }

  const handleSaveTransaction = async () => {
    if (formData.usdtAmount <= 0 || formData.buyPrice <= 0 || formData.sellPrice <= 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await saveTransaction.mutateAsync(formData)
      toast({
        title: "Transacción guardada",
        description: "La transacción se ha guardado en tu balance diario",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la transacción",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <Heading size="md">Calculadora P2P Binance</Heading>
          {binancePrice && (
            <VStack align="start" mt={2} spacing={2}>
              <HStack>
                <Text fontSize="sm" color="gray.600">
                  Precio actual USDT/VES:
                </Text>
                <Badge colorScheme="green" fontSize="sm">
                  {binancePrice.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                </Badge>
              </HStack>
              <PriceStatus 
                isLoading={priceLoading}
                hasError={!!priceError}
                isFallback={isFallback || false}
                lastUpdate={lastUpdate}
                source={source}
              />
            </VStack>
          )}
          {priceLoading && !binancePrice && (
            <HStack mt={2}>
              <Text fontSize="sm" color="gray.600">
                Obteniendo precio actual...
              </Text>
            </HStack>
          )}
        </CardHeader>
        <CardBody>
          <VStack spacing={6}>
            {/* Cantidad de USDT */}
            <FormControl>
              <FormLabel>Cantidad de USDT</FormLabel>
              <NumberInput
                value={formData.usdtAmount}
                onChange={(valueString, valueNumber) => handleInputChange('usdtAmount', valueNumber)}
                min={0}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <Divider />

            {/* Precio de Compra */}
            <FormControl>
              <FormLabel>Precio de Compra (VES por USDT)</FormLabel>
              <HStack>
                <Switch
                  isChecked={formData.buyPriceType === 'variable'}
                  onChange={(e) => handleInputChange('buyPriceType', e.target.checked ? 'variable' : 'fixed')}
                />
                <Text fontSize="sm">
                  {formData.buyPriceType === 'variable' ? 'Variable' : 'Fijo'}
                </Text>
              </HStack>
              
              {formData.buyPriceType === 'fixed' ? (
                <NumberInput
                  value={formData.buyPrice}
                  onChange={(valueString, valueNumber) => handleInputChange('buyPrice', valueNumber)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              ) : (
                <HStack>
                  <NumberInput
                    value={formData.buyPriceMargin}
                    onChange={(valueString, valueNumber) => handleInputChange('buyPriceMargin', valueNumber)}
                    min={0}
                    max={200}
                    precision={1}
                    w="120px"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text>% del precio de mercado</Text>
                  <Text fontSize="sm" color="gray.600">
                    = {formData.buyPrice.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                  </Text>
                </HStack>
              )}
            </FormControl>

            {/* Precio de Venta */}
            <FormControl>
              <FormLabel>Precio de Venta (VES por USDT)</FormLabel>
              <HStack>
                <Switch
                  isChecked={formData.sellPriceType === 'variable'}
                  onChange={(e) => handleInputChange('sellPriceType', e.target.checked ? 'variable' : 'fixed')}
                />
                <Text fontSize="sm">
                  {formData.sellPriceType === 'variable' ? 'Variable' : 'Fijo'}
                </Text>
              </HStack>
              
              {formData.sellPriceType === 'fixed' ? (
                <NumberInput
                  value={formData.sellPrice}
                  onChange={(valueString, valueNumber) => handleInputChange('sellPrice', valueNumber)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              ) : (
                <HStack>
                  <NumberInput
                    value={formData.sellPriceMargin}
                    onChange={(valueString, valueNumber) => handleInputChange('sellPriceMargin', valueNumber)}
                    min={0}
                    max={200}
                    precision={1}
                    w="120px"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text>% del precio de mercado</Text>
                  <Text fontSize="sm" color="gray.600">
                    = {formData.sellPrice.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                  </Text>
                </HStack>
              )}
            </FormControl>

            <Divider />

            {/* Comisiones Bancarias */}
            <FormControl>
              <FormLabel>Comisión Bancaria</FormLabel>
              <HStack>
                <Switch
                  isChecked={formData.bankCommissionType === 'percentage'}
                  onChange={(e) => handleInputChange('bankCommissionType', e.target.checked ? 'percentage' : 'fixed')}
                />
                <Text fontSize="sm">
                  {formData.bankCommissionType === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                </Text>
              </HStack>
              
              <NumberInput
                value={formData.bankCommission}
                onChange={(valueString, valueNumber) => handleInputChange('bankCommission', valueNumber)}
                min={0}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.600">
                {formData.bankCommissionType === 'percentage' ? '%' : 'VES'}
              </Text>
            </FormControl>

            {/* Comisión de Binance */}
            <FormControl>
              <FormLabel>Comisión de Binance (VES)</FormLabel>
              <NumberInput
                value={formData.binanceCommission}
                onChange={(valueString, valueNumber) => handleInputChange('binanceCommission', valueNumber)}
                min={0}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <Divider />

            {/* Sección de Proyecciones Avanzadas */}
            <Box w="full">
              <Heading size="sm" color="purple.600" mb={4}>
                📊 Proyecciones Avanzadas
              </Heading>
              
              <VStack spacing={4}>
                {/* Ciclos Diarios */}
                <FormControl>
                  <FormLabel>Ciclos Diarios Estimados</FormLabel>
                  <NumberInput
                    value={formData.cyclesPerDay}
                    onChange={(valueString, valueNumber) => handleInputChange('cyclesPerDay', valueNumber)}
                    min={1}
                    max={50}
                    precision={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.600">
                    Número de transacciones completas por día
                  </Text>
                </FormControl>

                {/* Días Laborales por Mes */}
                <FormControl>
                  <FormLabel>Días Laborales por Mes</FormLabel>
                  <NumberInput
                    value={formData.workingDaysPerMonth}
                    onChange={(valueString, valueNumber) => handleInputChange('workingDaysPerMonth', valueNumber)}
                    min={1}
                    max={31}
                    precision={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.600">
                    Días activos de trading por mes
                  </Text>
                </FormControl>

                {/* Perfil P2P Actual */}
                <Box w="full" p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                  <Text fontWeight="bold" color="blue.700" mb={3}>
                    Perfil P2P Actual
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Total de Órdenes</FormLabel>
                      <NumberInput
                        value={formData.currentOrders}
                        onChange={(valueString, valueNumber) => handleInputChange('currentOrders', valueNumber)}
                        min={0}
                        precision={0}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">BTC 30 Días</FormLabel>
                      <NumberInput
                        value={formData.currentBtc30Days}
                        onChange={(valueString, valueNumber) => handleInputChange('currentBtc30Days', valueNumber)}
                        min={0}
                        precision={2}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Metas P2P */}
                <Box w="full" p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                  <Text fontWeight="bold" color="green.700" mb={3}>
                    Metas P2P a Alcanzar
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Total de Órdenes</FormLabel>
                      <NumberInput
                        value={formData.targetOrders}
                        onChange={(valueString, valueNumber) => handleInputChange('targetOrders', valueNumber)}
                        min={0}
                        precision={0}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">BTC 30 Días</FormLabel>
                      <NumberInput
                        value={formData.targetBtc30Days}
                        onChange={(valueString, valueNumber) => handleInputChange('targetBtc30Days', valueNumber)}
                        min={0}
                        precision={2}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </VStack>
            </Box>

            {/* Error de precio */}
            {priceError && (
              <Alert status="warning">
                <AlertIcon />
                <AlertTitle>Error de precio!</AlertTitle>
                <AlertDescription>
                  No se pudo obtener el precio actual de Binance. Usa precios fijos.
                </AlertDescription>
              </Alert>
            )}

            <HStack spacing={4} w="full">
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleCalculate}
                isLoading={priceLoading}
                loadingText="Obteniendo precio..."
                flex="1"
              >
                Calcular Ganancias
              </Button>
              
              <Button
                colorScheme="green"
                size="lg"
                onClick={handleSaveTransaction}
                isLoading={saveTransaction.isPending}
                loadingText="Guardando..."
                flex="1"
                isDisabled={!results}
              >
                💾 Guardar Transacción
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  )
}
