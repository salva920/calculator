'use client'

import { VStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'
import UnifiedDashboard from '@/components/UnifiedDashboard'

export default function Home() {
  return (
    <VStack spacing={{ base: 4, md: 5 }} align="stretch" w="full">
      <PageHeader
        title="Resumen del día"
        description="Lo esencial de tu operativa P2P: ganancia, brecha y volumen. El detalle queda a un clic."
        accent="brand"
      />
      <UnifiedDashboard />
    </VStack>
  )
}
