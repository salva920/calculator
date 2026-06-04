'use client'

import { Box, Container, VStack, Heading } from '@chakra-ui/react'
import DailyBalance from '@/components/DailyBalance'

export default function BalanceDiarioPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="green.600">
          Balance Diario
        </Heading>
        <Box w="full">
          <DailyBalance days={7} />
        </Box>
      </VStack>
    </Container>
  )
}

