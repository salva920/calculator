'use client'

import { Box, Container, VStack, Heading } from '@chakra-ui/react'
import BinanceConnection from '@/components/BinanceConnection'

export default function ConexionBinancePage() {
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="teal.600">
          Conexión con Binance
        </Heading>
        <Box w="full">
          <BinanceConnection />
        </Box>
      </VStack>
    </Container>
  )
}

