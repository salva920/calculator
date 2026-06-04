'use client'

import dynamic from 'next/dynamic'
import { Text, VStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'

const CapitalPartnersPanel = dynamic(() => import('@/components/CapitalPartnersPanel'), {
  ssr: false,
  loading: () => (
    <Text py={8} color="gray.500" textAlign="center">
      Cargando panel de socios…
    </Text>
  ),
})

export default function SociosCapitalPage() {
  return (
    <VStack align="stretch" spacing={{ base: 4, md: 6 }} w="full">
      <PageHeader
        title="Socios de capital"
        description="Gestión de inversiones USDT/VES, metas y reparto con interés lineal por días (zona Caracas)."
        accent="purple"
      />
      <CapitalPartnersPanel />
    </VStack>
  )
}
