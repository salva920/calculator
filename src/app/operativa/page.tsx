'use client'

import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, VStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'
import CyclesList from '@/components/CyclesList'
import AdsPerformance from '@/components/AdsPerformance'

export default function OperativaPage() {
  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="full">
      <PageHeader
        title="Operativa P2P"
        description="Ciclos de compra/venta y rendimiento de tus anuncios en Binance."
        accent="brand"
      />
      <Box w="full" minW="0">
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList flexWrap="wrap">
            <Tab>Ciclos</Tab>
            <Tab>Anuncios</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <CyclesList />
            </TabPanel>
            <TabPanel px={0}>
              <AdsPerformance />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </VStack>
  )
}
