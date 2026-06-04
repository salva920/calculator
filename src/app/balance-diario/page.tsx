'use client'

import { Box, VStack, Heading } from '@chakra-ui/react'
import DailyBalance from '@/components/DailyBalance'

export default function BalanceDiarioPage() {
  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="full">
      <Heading size={{ base: 'md', md: 'lg' }} color="green.600">
        Balance Diario
      </Heading>
      <Box w="full" minW="0">
        <DailyBalance days={7} />
      </Box>
    </VStack>
  )
}

