'use client'

import { Box, VStack, HStack, Heading } from '@chakra-ui/react'
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
      <Heading size={{ base: 'md', md: 'lg' }} color="blue.600">
        Calculadora de Estrategia
      </Heading>
      <HStack
        spacing={{ base: 4, md: 8 }}
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

