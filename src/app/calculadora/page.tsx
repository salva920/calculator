'use client'

import { Box, Container, VStack, HStack, Heading } from '@chakra-ui/react'
import CalculatorForm from '@/components/CalculatorForm'
import ResultsDisplay from '@/components/ResultsDisplay'
import ExecutiveSummary from '@/components/ExecutiveSummary'
import { useState } from 'react'
import { CalculationResults, FormData } from '@/utils/calculations'

export default function CalculadoraPage() {
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [formData, setFormData] = useState<FormData | null>(null)

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="blue.600">
          Calculadora de Estrategia
        </Heading>
        <HStack spacing={8} align="start" w="full">
          <Box flex="1">
            <CalculatorForm onResultsChange={setResults} onFormDataChange={setFormData} />
          </Box>
          <Box flex="1">
            <ResultsDisplay results={results} formData={formData} />
          </Box>
        </HStack>
        {results && formData && (
          <Box w="full">
            <ExecutiveSummary results={results} formData={formData} />
          </Box>
        )}
      </VStack>
    </Container>
  )
}

