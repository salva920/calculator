'use client'

import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  CloseButton,
  Flex,
} from '@chakra-ui/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

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
      bottom={{ base: 'calc(72px + env(safe-area-inset-bottom, 0px))', lg: 4 }}
      left={3}
      right={3}
      zIndex={999}
    >
      <Alert
        status="info"
        borderRadius="2xl"
        bg="surface.card"
        borderWidth="1px"
        borderColor="surface.border"
        boxShadow="float"
        py={3}
      >
        <Box flex="1">
          <AlertDescription fontSize="sm" color="gray.700">
            Instala la app en tu teléfono para abrirla como una aplicación nativa.
          </AlertDescription>
        </Box>
        <Flex gap={2} align="center" flexShrink={0}>
          <Button size="sm" colorScheme="brand" borderRadius="full" onClick={handleInstall}>
            Instalar
          </Button>
          <CloseButton size="sm" borderRadius="full" onClick={() => setDismissed(true)} />
        </Flex>
      </Alert>
    </Box>
  )
}
