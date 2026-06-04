'use client'

import { Box, VStack, Heading } from '@chakra-ui/react'
import UnifiedDashboard from '@/components/UnifiedDashboard'

export default function Home() {
  return (
    <VStack spacing={{ base: 4, md: 8 }} align="stretch" w="full">
      <Box w="full">
        <VStack spacing={4} align="stretch">
          <Heading size={{ base: 'md', md: 'lg' }} color="purple.600">
            Resumen de Métricas
          </Heading>
          <UnifiedDashboard />
        </VStack>
      </Box>
    </VStack>
  )
}
