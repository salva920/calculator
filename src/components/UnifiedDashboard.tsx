'use client'

import { Box, HStack } from '@chakra-ui/react'
import P2PDashboard from './P2PDashboard'
import SyncedTransactions from './SyncedTransactions'

export default function UnifiedDashboard() {
  return (
    <Box w="full">
      {/* Layout responsive: horizontal en pantallas grandes, vertical en móviles */}
      <HStack
        spacing={6}
        align="start"
        w="full"
        flexDirection={{ base: 'column', lg: 'row' }}
      >
        {/* Dashboard en Tiempo Real - Lado Izquierdo */}
        <Box
          flex={{ base: 'none', lg: '1' }}
          w={{ base: 'full', lg: 'auto' }}
          minW="0"
        >
          <P2PDashboard />
        </Box>

        {/* Transacciones Sincronizadas - Lado Derecho */}
        <Box
          flex={{ base: 'none', lg: '1' }}
          w={{ base: 'full', lg: 'auto' }}
          minW="0"
        >
          <SyncedTransactions />
        </Box>
      </HStack>
    </Box>
  )
}
