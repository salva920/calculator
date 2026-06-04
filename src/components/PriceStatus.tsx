'use client'

import { Box, HStack, Text, Badge, Icon, Tooltip } from '@chakra-ui/react'
import { FaWifi, FaInfoCircle } from 'react-icons/fa'

interface PriceStatusProps {
  isLoading: boolean
  hasError: boolean
  isFallback: boolean
  lastUpdate?: number
  source?: string
}

export default function PriceStatus({ isLoading, hasError, isFallback, lastUpdate, source }: PriceStatusProps) {
  if (isLoading) {
    return (
      <HStack spacing={2}>
        <Icon as={FaWifi} color="yellow.400" />
        <Text fontSize="xs" color="gray.500">
          Conectando...
        </Text>
      </HStack>
    )
  }

  if (hasError) {
    return (
      <HStack spacing={2}>
        <Icon as={FaWifi} color="red.400" />
        <Text fontSize="xs" color="red.500">
          Error de conexión
        </Text>
      </HStack>
    )
  }

  if (isFallback) {
    return (
      <Tooltip label={`Usando datos simulados - Fuente: ${source || 'fallback'}`} placement="top">
        <HStack spacing={2}>
          <Icon as={FaInfoCircle} color="orange.400" />
          <Text fontSize="xs" color="orange.500">
            Datos simulados
          </Text>
        </HStack>
      </Tooltip>
    )
  }

  return (
    <HStack spacing={2}>
      <Icon as={FaWifi} color="green.400" />
      <Text fontSize="xs" color="green.500">
        Datos en tiempo real
      </Text>
      {source && (
        <Text fontSize="xs" color="gray.400">
          • {source === 'binance-p2p-manual' ? 'Binance P2P' : source}
        </Text>
      )}
      {lastUpdate && (
        <Text fontSize="xs" color="gray.400">
          • {new Date(lastUpdate).toLocaleTimeString('es-VE')}
        </Text>
      )}
    </HStack>
  )
}
