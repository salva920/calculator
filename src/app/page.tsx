'use client'

import { VStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'
import UnifiedDashboard from '@/components/UnifiedDashboard'

export default function Home() {
  return (
    <VStack spacing={{ base: 4, md: 5 }} align="stretch" w="full">
      <PageHeader
        title="Resumen de operaciones"
        description="Métricas en vivo, transacciones sincronizadas y estado de tu actividad P2P del día."
        accent="brand"
      />
      <UnifiedDashboard />
    </VStack>
  )
}
