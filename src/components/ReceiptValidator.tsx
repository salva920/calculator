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
  Button,
  Input,
  useToast,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  Divider,
} from '@chakra-ui/react'
import { FaUpload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import axios from 'axios'

interface ReceiptValidation {
  id: string
  imageUrl: string
  extractedAmount: number | null
  expectedAmount: number
  isValid: boolean
  confidence: number | null
  ocrText: string | null
  validatedAt: string
}

interface ReceiptValidatorProps {
  transactionId: string
  expectedAmount: number
  orderNumber: string
}

export default function ReceiptValidator({
  transactionId,
  expectedAmount,
  orderNumber,
}: ReceiptValidatorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [validations, setValidations] = useState<ReceiptValidation[]>([])
  const [manualAmount, setManualAmount] = useState<string>('')
  const toast = useToast()

  // Cargar validaciones existentes
  useEffect(() => {
    loadValidations()
  }, [transactionId])

  const loadValidations = async () => {
    try {
      const response = await axios.get(
        `/api/transactions/validate-receipt?transactionId=${transactionId}`
      )
      if (response.data.success) {
        setValidations(response.data.validations)
      }
    } catch (error) {
      console.error('Error cargando validaciones:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una imagen',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('transactionId', transactionId)

      const response = await axios.post('/api/transactions/validate-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        toast({
          title: response.data.validation.isValid ? 'Comprobante Válido' : 'Comprobante Inválido',
          description: response.data.message,
          status: response.data.validation.isValid ? 'success' : 'warning',
          duration: 5000,
          isClosable: true,
        })
        setFile(null)
        setPreview(null)
        loadValidations()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo validar el comprobante',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualValidation = () => {
    const amount = parseFloat(manualAmount)
    if (isNaN(amount)) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un monto válido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const isValid = Math.abs(amount - expectedAmount) < 1.0
    const validation: ReceiptValidation = {
      id: `manual-${Date.now()}`,
      imageUrl: preview || '',
      extractedAmount: amount,
      expectedAmount,
      isValid,
      confidence: 1.0,
      ocrText: `Monto ingresado manualmente: ${amount}`,
      validatedAt: new Date().toISOString(),
    }

    setValidations([validation, ...validations])
    toast({
      title: isValid ? 'Monto Correcto' : 'Monto Incorrecto',
      description: isValid
        ? 'El monto coincide con la orden'
        : `El monto (${amount.toFixed(2)}) no coincide con el esperado (${expectedAmount.toFixed(2)})`,
      status: isValid ? 'success' : 'warning',
      duration: 5000,
      isClosable: true,
    })
    setManualAmount('')
  }

  const latestValidation = validations[0]

  return (
    <Card size="sm">
      <CardHeader borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted" py={3}>
        <Heading size="sm" color="gray.800">Validar comprobante</Heading>
        <Text fontSize="xs" color="gray.600" mt={1}>
          Orden: {orderNumber} • Monto esperado: {expectedAmount.toLocaleString('es-VE', {
            style: 'currency',
            currency: 'VES',
          })}
        </Text>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Subir imagen */}
          <Box>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              display="none"
              id={`file-input-${transactionId}`}
            />
            <label htmlFor={`file-input-${transactionId}`}>
              <Button
                as="span"
                leftIcon={<FaUpload />}
                colorScheme="blue"
                variant="outline"
                w="full"
                cursor="pointer"
              >
                Seleccionar Imagen del Comprobante
              </Button>
            </label>
          </Box>

          {/* Preview de imagen */}
          {preview && (
            <Box>
              <Image
                src={preview}
                alt="Preview del comprobante"
                maxH="200px"
                mx="auto"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
              <Button
                colorScheme="green"
                w="full"
                mt={2}
                onClick={handleUpload}
                isLoading={isUploading}
                loadingText="Validando..."
                leftIcon={<FaCheckCircle />}
              >
                Validar Comprobante
              </Button>
            </Box>
          )}

          <Divider />

          {/* Validación manual */}
          <Box p={4} bg="surface.muted" borderRadius="xl" borderWidth="1px" borderColor="surface.border">
            <Text fontWeight="bold" mb={2} fontSize="sm">
              O ingresa el monto manualmente:
            </Text>
            <HStack>
              <Input
                type="number"
                placeholder="Monto en VES"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualValidation()
                  }
                }}
              />
              <Button
                colorScheme="blue"
                onClick={handleManualValidation}
                leftIcon={<FaCheckCircle />}
              >
                Validar
              </Button>
            </HStack>
          </Box>

          {/* Resultado de validación */}
          {latestValidation && (
            <Alert
              status={latestValidation.isValid ? 'success' : 'warning'}
              borderRadius="md"
            >
              <AlertIcon as={latestValidation.isValid ? FaCheckCircle : FaTimesCircle} />
              <Box flex="1">
                <AlertTitle>
                  {latestValidation.isValid ? 'Comprobante Válido' : 'Comprobante Inválido'}
                </AlertTitle>
                <AlertDescription>
                  <VStack align="start" spacing={1} mt={2}>
                    <HStack>
                      <Text fontSize="sm">Monto detectado:</Text>
                      <Text fontWeight="bold">
                        {latestValidation.extractedAmount?.toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES',
                        }) || 'N/A'}
                      </Text>
                    </HStack>
                    <HStack>
                      <Text fontSize="sm">Monto esperado:</Text>
                      <Text fontWeight="bold">
                        {latestValidation.expectedAmount.toLocaleString('es-VE', {
                          style: 'currency',
                          currency: 'VES',
                        })}
                      </Text>
                    </HStack>
                    {latestValidation.extractedAmount !== null && (
                      <HStack>
                        <Text fontSize="sm">Diferencia:</Text>
                        <Text
                          fontWeight="bold"
                          color={
                            Math.abs(
                              latestValidation.extractedAmount - latestValidation.expectedAmount
                            ) < 1.0
                              ? 'green.600'
                              : 'red.600'
                          }
                        >
                          {(
                            latestValidation.extractedAmount - latestValidation.expectedAmount
                          ).toLocaleString('es-VE', {
                            style: 'currency',
                            currency: 'VES',
                          })}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Historial de validaciones */}
          {validations.length > 1 && (
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Historial de Validaciones:
              </Text>
              <VStack spacing={2} align="stretch">
                {validations.slice(1).map((validation) => (
                  <Box
                    key={validation.id}
                    p={2}
                    bg="surface.muted"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="surface.border"
                  >
                    <HStack justify="space-between">
                      <HStack>
                        {validation.isValid ? (
                          <FaCheckCircle color="green" />
                        ) : (
                          <FaTimesCircle color="red" />
                        )}
                        <Text fontSize="sm">
                          {validation.extractedAmount?.toLocaleString('es-VE', {
                            style: 'currency',
                            currency: 'VES',
                          }) || 'N/A'}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        {new Date(validation.validatedAt).toLocaleString('es-VE')}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

