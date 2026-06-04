'use client'

import { Box, VStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'
import BinanceConnection from '@/components/BinanceConnection'

export default function ConexionBinancePage() {
  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="full" maxW="container.md" mx="auto">
      <PageHeader
        title="Conexión Binance"
        description="Vincula tu API, activa la sincronización automática y mantén tus órdenes al día."
        accent="teal"
      />
      <Box w="full" minW="0">
        <BinanceConnection />
      </Box>
    </VStack>
  )
}
