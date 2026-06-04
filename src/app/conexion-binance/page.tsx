'use client'

import { Box, VStack, Heading } from '@chakra-ui/react'
import BinanceConnection from '@/components/BinanceConnection'

export default function ConexionBinancePage() {
  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="full" maxW="container.md" mx="auto">
      <Heading size={{ base: 'md', md: 'lg' }} color="teal.600">
        Conexión con Binance
      </Heading>
      <Box w="full" minW="0">
        <BinanceConnection />
      </Box>
    </VStack>
  )
}

