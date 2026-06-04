'use client'

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { FaBitcoin, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const from = searchParams.get('from') || '/'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: data.error || 'No se pudo ingresar',
          status: 'error',
          duration: 4000,
          isClosable: true,
        })
        return
      }
      router.replace(from.startsWith('/login') ? '/' : from)
      router.refresh()
    } catch {
      toast({
        title: 'Error de conexión',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex
      minH="100dvh"
      align="center"
      justify="center"
      px={4}
      py={10}
      bg="linear-gradient(160deg, #f8fafc 0%, #fff7ed 45%, #f1f5f9 100%)"
    >
      <Box
        w="full"
        maxW="md"
        bg="white"
        borderWidth="1px"
        borderColor="surface.border"
        borderRadius="2xl"
        boxShadow="xl"
        p={{ base: 6, md: 8 }}
      >
        <VStack spacing={6} as="form" onSubmit={handleSubmit}>
          <Flex
            align="center"
            justify="center"
            w={14}
            h={14}
            borderRadius="2xl"
            bg="linear-gradient(135deg, #F0B90B 0%, #F59E0B 100%)"
            boxShadow="0 8px 24px rgba(245, 158, 11, 0.35)"
          >
            <FaBitcoin color="white" size={28} />
          </Flex>

          <VStack spacing={1}>
            <Heading size="md" color="gray.900">
              Acceso privado
            </Heading>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Ingresa la clave para usar la calculadora P2P
            </Text>
          </VStack>

          <FormControl isRequired>
            <FormLabel fontSize="sm" color="gray.600">
              Clave de acceso
            </FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu clave"
                autoComplete="current-password"
                size="lg"
                borderRadius="xl"
                bg="surface.muted"
              />
              <InputRightElement h="full">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <Icon as={showPassword ? FaEyeSlash : FaEye} color="gray.400" />
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            type="submit"
            w="full"
            size="lg"
            colorScheme="brand"
            borderRadius="xl"
            isLoading={loading}
            loadingText="Verificando…"
            leftIcon={<FaLock />}
          >
            Entrar
          </Button>
        </VStack>
      </Box>
    </Flex>
  )
}
