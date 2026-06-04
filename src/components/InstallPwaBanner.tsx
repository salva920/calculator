'use client'

import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  CloseButton,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const bg = useColorModeValue('orange.50', 'gray.700')

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <Box
      display={{ base: 'block', lg: 'none' }}
      position="fixed"
      bottom={{ base: 'calc(56px + env(safe-area-inset-bottom, 0px))', lg: 4 }}
      left={3}
      right={3}
      zIndex={999}
    >
      <Alert status="info" borderRadius="lg" bg={bg} boxShadow="md" py={2}>
        <Box flex="1">
          <AlertDescription fontSize="sm">
            Instala la app en tu teléfono para acceso rápido desde la pantalla de inicio.
          </AlertDescription>
        </Box>
        <Flex gap={1} align="center" flexShrink={0}>
          <Button size="xs" colorScheme="orange" onClick={handleInstall}>
            Instalar
          </Button>
          <CloseButton size="sm" onClick={() => setDismissed(true)} />
        </Flex>
      </Alert>
    </Box>
  )
}
