'use client'

import { Box, Container, VStack, Heading } from '@chakra-ui/react'
import UnifiedDashboard from '@/components/UnifiedDashboard'

export default function Home() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Resumen de Métricas */}
        <Box w="full">
          <VStack spacing={4} align="stretch">
            <Heading size="lg" color="purple.600">
              Resumen de Métricas
            </Heading>
            <UnifiedDashboard />
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}
