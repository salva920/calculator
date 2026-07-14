'use client'

import { Box, VStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'
import GoalsManager from '@/components/GoalsManager'

export default function ObjetivosPage() {
  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="full">
      <PageHeader
        title="Objetivos"
        description="Metas de ganancias, volumen y órdenes con seguimiento automático."
        accent="purple"
      />
      <Box w="full" minW="0">
        <GoalsManager />
      </Box>
    </VStack>
  )
}
