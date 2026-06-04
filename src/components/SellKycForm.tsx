'use client'

import { useEffect, useState } from 'react'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { FaSave, FaUpload } from 'react-icons/fa'
import axios from 'axios'
import { isInlineImageRef } from '@/lib/store-upload-image'

interface SellKycFormProps {
  transactionId: string
  orderNumber: string
}

interface SellKycResponse {
  id: string
  bankName: string | null
  accountNumber: string | null
  fullName: string | null
  idNumber: string | null
  idCardImageUrl: string | null
  swornDeclarationImageUrl: string | null
  sourceOfFundsImageUrl: string | null
  createdAt: string
  updatedAt: string
}

type KycImageField = 'idCardImage' | 'swornDeclarationImage' | 'sourceOfFundsImage'

export default function SellKycForm({ transactionId, orderNumber }: SellKycFormProps) {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [existingKyc, setExistingKyc] = useState<SellKycResponse | null>(null)

  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')

  const [files, setFiles] = useState<Record<KycImageField, File | null>>({
    idCardImage: null,
    swornDeclarationImage: null,
    sourceOfFundsImage: null,
  })

  const [previews, setPreviews] = useState<Record<KycImageField, string | null>>({
    idCardImage: null,
    swornDeclarationImage: null,
    sourceOfFundsImage: null,
  })

  useEffect(() => {
    void loadKyc()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId])

  const loadKyc = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/transactions/sell-kyc', {
        params: { transactionId },
      })

      if (response.data.success && response.data.kyc) {
        const kyc: SellKycResponse = response.data.kyc
        setExistingKyc(kyc)
        setBankName(kyc.bankName || '')
        setAccountNumber(kyc.accountNumber || '')
        setFullName(kyc.fullName || '')
        setIdNumber(kyc.idNumber || '')
      } else {
        setExistingKyc(null)
      }
    } catch (error) {
      console.error('Error cargando KYC:', error)
      setExistingKyc(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (field: KycImageField, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }))

    if (!file) {
      setPreviews((prev) => ({ ...prev, [field]: null }))
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviews((prev) => ({ ...prev, [field]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    const hasTextFields =
      Boolean(bankName.trim()) ||
      Boolean(accountNumber.trim()) ||
      Boolean(fullName.trim()) ||
      Boolean(idNumber.trim())
    const hasImageFields =
      Boolean(files.idCardImage) ||
      Boolean(files.swornDeclarationImage) ||
      Boolean(files.sourceOfFundsImage)

    if (!hasTextFields && !hasImageFields) {
      toast({
        title: 'Sin datos para guardar',
        description: 'Completa al menos un campo del formulario',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('transactionId', transactionId)
      if (bankName.trim()) formData.append('bankName', bankName.trim())
      if (accountNumber.trim()) formData.append('accountNumber', accountNumber.trim())
      if (fullName.trim()) formData.append('fullName', fullName.trim())
      if (idNumber.trim()) formData.append('idNumber', idNumber.trim())

      if (files.idCardImage) formData.append('idCardImage', files.idCardImage)
      if (files.swornDeclarationImage) {
        formData.append('swornDeclarationImage', files.swornDeclarationImage)
      }
      if (files.sourceOfFundsImage) {
        formData.append('sourceOfFundsImage', files.sourceOfFundsImage)
      }

      const response = await axios.post('/api/transactions/sell-kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data.success) {
        toast({
          title: 'KYC guardado',
          description: response.data.message,
          status: 'success',
          duration: 4000,
          isClosable: true,
        })

        setFiles({
          idCardImage: null,
          swornDeclarationImage: null,
          sourceOfFundsImage: null,
        })
        setPreviews({
          idCardImage: null,
          swornDeclarationImage: null,
          sourceOfFundsImage: null,
        })

        await loadKyc()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo guardar el KYC',
        status: 'error',
        duration: 4500,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderImageField = (
    field: KycImageField,
    label: string,
    existingUrl?: string | null
  ) => (
    <FormControl>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(field, e.target.files?.[0] || null)}
        p={1}
      />
      <HStack mt={2} spacing={3} align="start">
        {previews[field] && (
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Nueva imagen
            </Text>
            <Image
              src={previews[field] || ''}
              alt={label}
              boxSize="90px"
              objectFit="cover"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            />
          </Box>
        )}
        {!previews[field] && existingUrl && isInlineImageRef(existingUrl) && (
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Imagen actual
            </Text>
            <Image
              src={existingUrl}
              alt={label}
              boxSize="90px"
              objectFit="cover"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            />
          </Box>
        )}
        {!previews[field] && existingUrl && !isInlineImageRef(existingUrl) && (
          <Text fontSize="xs" color="orange.600" maxW="200px">
            Imagen no disponible. Sube el archivo de nuevo.
          </Text>
        )}
      </HStack>
    </FormControl>
  )

  return (
    <VStack align="stretch" spacing={3}>
      <Text fontSize="sm" color="gray.600">
        Orden: {orderNumber}
      </Text>

      {existingKyc && (
        <Alert status="success" borderRadius="md" py={2}>
          <AlertIcon />
          <Text fontSize="sm">KYC ya registrado. Puedes editar y guardar cambios.</Text>
        </Alert>
      )}

      <FormControl>
        <FormLabel fontSize="sm">Banco</FormLabel>
        <Input
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Ej: Banesco"
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Número de cuenta</FormLabel>
        <Input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Ej: 0102-0123-45-1234567890"
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Nombre completo</FormLabel>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Cédula</FormLabel>
        <Input
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="Ej: V12345678"
        />
      </FormControl>

      {renderImageField('idCardImage', 'Cédula (imagen)', existingKyc?.idCardImageUrl)}
      {renderImageField(
        'swornDeclarationImage',
        'Declaración jurada (imagen)',
        existingKyc?.swornDeclarationImageUrl
      )}
      {renderImageField(
        'sourceOfFundsImage',
        'Origen de fondos (imagen)',
        existingKyc?.sourceOfFundsImageUrl
      )}

      <Button
        colorScheme="purple"
        onClick={handleSave}
        isLoading={isSaving || isLoading}
        loadingText="Guardando..."
        leftIcon={existingKyc ? <FaSave /> : <FaUpload />}
      >
        {existingKyc ? 'Actualizar KYC' : 'Registrar KYC'}
      </Button>
    </VStack>
  )
}
