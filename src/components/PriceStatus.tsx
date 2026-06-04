'use client'

import { HStack, Text, Badge, Icon, Tooltip } from '@chakra-ui/react'
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
        <Icon as={FaWifi} color="brand.400" />
        <Badge colorScheme="brand" variant="subtle">
          Conectando…
        </Badge>
      </HStack>
    )
  }

  if (hasError) {
    return (
      <HStack spacing={2}>
        <Icon as={FaWifi} color="red.400" />
        <Badge colorScheme="red" variant="subtle">
          Sin conexión
        </Badge>
      </HStack>
    )
  }

  if (isFallback) {
    return (
      <Tooltip label={`Datos simulados — ${source || 'fallback'}`} placement="top">
        <HStack spacing={2}>
          <Icon as={FaInfoCircle} color="orange.400" />
          <Badge colorScheme="orange" variant="subtle">
            Simulado
          </Badge>
        </HStack>
      </Tooltip>
    )
  }

  return (
    <HStack spacing={2} flexWrap="wrap">
      <Icon as={FaWifi} color="green.500" />
      <Badge colorScheme="green" variant="subtle">
        En vivo
      </Badge>
      {source && (
        <Text fontSize="xs" color="gray.500">
          {source === 'binance-p2p-manual' ? 'Binance P2P' : source}
        </Text>
      )}
      {lastUpdate && (
        <Text fontSize="xs" color="gray.400">
          {new Date(lastUpdate).toLocaleTimeString('es-VE')}
        </Text>
      )}
    </HStack>
  )
}
