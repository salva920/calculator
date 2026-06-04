'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  HStack,
  Progress,
  Text,
  useToast,
} from '@chakra-ui/react'
import { FaCloudUploadAlt } from 'react-icons/fa'
import { fetchPendingLegacyKyc, migrateAllKycFromBrowser } from '@/lib/migrate-kyc-client'

export default function KycLegacyMigrateBanner() {
  const toast = useToast()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const refresh = useCallback(async () => {
    try {
      const pending = await fetchPendingLegacyKyc()
      setCount(pending.length)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onMigrated = () => void refresh()
    window.addEventListener('kyc-migrated', onMigrated)
    return () => window.removeEventListener('kyc-migrated', onMigrated)
  }, [refresh])

  if (count === 0) return null

  const handleMigrate = async () => {
    setLoading(true)
    setProgress({ done: 0, total: count })
    try {
      const result = await migrateAllKycFromBrowser((done, total) => {
        setProgress({ done, total })
      })
      await refresh()
      window.dispatchEvent(new CustomEvent('kyc-migrated'))

      if (result.recordsFailed > 0 && result.totalMigrated === 0) {
        toast({
          title: 'No se encontraron archivos en este servidor',
          description:
            'Abre la app en tu PC con npm run dev (misma DATABASE_URL) o ejecuta: npm run migrate:kyc',
          status: 'warning',
          duration: 8000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Migración completada',
          description: `${result.totalMigrated} imagen(es) en ${result.recordsOk + result.recordsPartial} orden(es).`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al migrar'
      toast({ title: 'Error', description: msg, status: 'error', duration: 5000, isClosable: true })
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <Alert status="warning" borderRadius="xl" variant="subtle" flexDirection="column" alignItems="stretch">
      <HStack align="start" w="full" flexWrap="wrap" gap={2}>
        <AlertIcon mt={0.5} />
        <Box flex="1" minW="200px">
          <AlertTitle fontSize="sm">Imágenes KYC solo en tu PC</AlertTitle>
          <AlertDescription fontSize="sm">
            Hay {count} orden(es) con fotos en rutas locales. Migración automática si esta app corre en el mismo PC
            donde está <Text as="code" fontSize="xs">public/uploads</Text>.
          </AlertDescription>
        </Box>
        <Button
          size="sm"
          colorScheme="brand"
          leftIcon={<FaCloudUploadAlt />}
          onClick={handleMigrate}
          isLoading={loading}
          loadingText="Migrando…"
          flexShrink={0}
        >
          Migrar todas
        </Button>
      </HStack>
      {progress && progress.total > 0 && (
        <Progress
          value={(progress.done / progress.total) * 100}
          size="xs"
          colorScheme="brand"
          borderRadius="full"
          mt={3}
        />
      )}
    </Alert>
  )
}
