'use client'

import { Box, VStack, HStack } from '@chakra-ui/react'
import PageHeader from '@/components/ui/PageHeader'
import CalculatorForm from '@/components/CalculatorForm'
import ResultsDisplay from '@/components/ResultsDisplay'
import ExecutiveSummary from '@/components/ExecutiveSummary'
import { useState } from 'react'
import { CalculationResults, FormData } from '@/utils/calculations'

export default function CalculadoraPage() {
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [formData, setFormData] = useState<FormData | null>(null)

  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="full">
      <PageHeader
        title="Calculadora de estrategia"
        description="Simula márgenes, comisiones y rentabilidad antes de publicar tus anuncios P2P."
        accent="blue"
      />
      <HStack
        spacing={{ base: 4, md: 6 }}
        align="start"
        w="full"
        flexDirection={{ base: 'column', lg: 'row' }}
      >
        <Box flex={{ base: 'none', lg: 1 }} w="full" minW="0">
          <CalculatorForm onResultsChange={setResults} onFormDataChange={setFormData} />
        </Box>
        <Box flex={{ base: 'none', lg: 1 }} w="full" minW="0">
          <ResultsDisplay results={results} formData={formData} />
        </Box>
      </HStack>
      {results && formData && (
        <Box w="full" minW="0">
          <ExecutiveSummary results={results} formData={formData} />
        </Box>
      )}
    </VStack>
  )
}
