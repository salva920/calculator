'use client'

import { Box, VStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'
import DailyBalance from '@/components/DailyBalance'

export default function BalanceDiarioPage() {
  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="full">
      <PageHeader
        title="Balance diario"
        description="Evolución de tu operativa P2P día a día con totales y tendencias."
        accent="green"
      />
      <Box w="full" minW="0">
        <DailyBalance days={7} />
      </Box>
    </VStack>
  )
}
