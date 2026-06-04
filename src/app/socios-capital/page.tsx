'use client'

import dynamic from 'next/dynamic'
import { Container, Heading, Text, VStack } from '@chakra-ui/react'

/** Evita hidratación inconsistente del NumberInput y del panel complejo en esta ruta. */
const CapitalPartnersPanel = dynamic(() => import('@/components/CapitalPartnersPanel'), {
  ssr: false,
  loading: () => (
    <Text py={4} color="gray.600">
      Cargando panel de socios…
    </Text>
  ),
})

export default function SociosCapitalPage() {
  return (
    <Container maxW="container.xl" py={8} color="gray.800">
      <VStack align="stretch" spacing={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="purple.600">
            Socios de capital (USDT / VES)
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Gestión de inversiones y reparto. La meta acumulada desde el ingreso usa días calendario en Venezuela
            (America/Caracas) y un interés lineal simple: capital × (% diario) × días.
          </Text>
        </VStack>
        <CapitalPartnersPanel />
      </VStack>
    </Container>
  )
}
