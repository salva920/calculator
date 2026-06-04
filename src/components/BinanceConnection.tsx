'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  useToast,
  Switch,
  Divider,
} from '@chakra-ui/react'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import axios from 'axios'

interface BinanceCredentials {
  id: string
  isActive: boolean
  lastSync: string | null
  syncEnabled: boolean
  syncInterval: number
  createdAt: string
}

export default function BinanceConnection() {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<BinanceCredentials | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const toast = useToast()

  // Verificar estado de conexión al cargar
  useEffect(() => {
    checkConnection()
  }, [])

  // Sincronizar automáticamente cuando esté conectado
  useEffect(() => {
    if (!isConnected || !credentials?.syncEnabled) return
    
    // Sincronizar inmediatamente al conectar
    const initialSync = async () => {
      try {
        await axios.post('/api/binance/sync')
        await checkConnection()
        window.dispatchEvent(new CustomEvent('binance-sync-completed'))
      } catch (error) {
        console.error('Error en sincronización inicial:', error)
      }
    }
    
    initialSync()
    
    // Sincronizar automáticamente cada 2 minutos
    const autoSyncInterval = setInterval(async () => {
      try {
        await axios.post('/api/binance/sync')
        await checkConnection()
        window.dispatchEvent(new CustomEvent('binance-sync-completed'))
      } catch (error) {
        console.error('Error en sincronización automática:', error)
      }
    }, 120000) // 2 minutos
    
    return () => clearInterval(autoSyncInterval)
  }, [isConnected, credentials?.syncEnabled])

  const checkConnection = async () => {
    try {
      const response = await axios.get('/api/binance/credentials')
      if (response.data.success && response.data.connected) {
        setCredentials(response.data.credentials)
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error verificando conexión:', error)
    }
  }

  const handleConnect = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa tu API Key y API Secret',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post('/api/binance/credentials', {
        apiKey,
        apiSecret,
      })

      if (response.data.success) {
        toast({
          title: 'Conexión exitosa',
          description: 'Tu cuenta de Binance ha sido conectada exitosamente. Sincronizando transacciones...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setApiKey('')
        setApiSecret('')
        await checkConnection()
        
        // Sincronizar automáticamente después de conectar
        try {
          const syncResponse = await axios.post('/api/binance/sync')
          if (syncResponse.data.success) {
            toast({
              title: 'Sincronización completada',
              description: `${syncResponse.data.newTransactions} nuevas transacciones sincronizadas`,
              status: 'success',
              duration: 3000,
              isClosable: true,
            })
            // Disparar evento para actualizar componentes
            window.dispatchEvent(new CustomEvent('binance-sync-completed'))
          }
        } catch (syncError) {
          console.error('Error en sincronización automática:', syncError)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error de conexión',
        description: error.response?.data?.error || 'No se pudo conectar con Binance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await axios.delete('/api/binance/credentials')
      toast({
        title: 'Desconectado',
        description: 'Tu cuenta de Binance ha sido desconectada',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      setCredentials(null)
      setIsConnected(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo desconectar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Card>
      <CardHeader>
        <Heading size="md">Conexión con Binance</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {isConnected && credentials ? (
            <>
              <Alert status="success" borderRadius="md">
                <AlertIcon as={FaCheckCircle} />
                <Box>
                  <AlertTitle>Conectado a Binance</AlertTitle>
                  <AlertDescription>
                    Tu cuenta está conectada y lista para sincronizar transacciones
                  </AlertDescription>
                </Box>
              </Alert>

              <Box p={4} bg="gray.50" borderRadius="md">
                <VStack spacing={2} align="start">
                  <HStack>
                    <Text fontWeight="bold">Estado:</Text>
                    <Badge colorScheme="green">Activo</Badge>
                  </HStack>
                  {credentials.lastSync && (
                    <HStack>
                      <Text fontWeight="bold">Última sincronización:</Text>
                      <Text>
                        {new Date(credentials.lastSync).toLocaleString('es-VE')}
                      </Text>
                    </HStack>
                  )}
                  <HStack>
                    <Text fontWeight="bold">Sincronización automática:</Text>
                    <Badge colorScheme={credentials.syncEnabled ? 'green' : 'gray'}>
                      {credentials.syncEnabled ? 'Habilitada' : 'Deshabilitada'}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>

              <HStack spacing={4}>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDisconnect}
                  isLoading={isLoading}
                  w="full"
                >
                  Desconectar
                </Button>
              </HStack>
              
              <Alert status="info" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <AlertDescription>
                  <Text fontWeight="bold">Sincronización Automática Activa</Text>
                  <Text>
                    Las transacciones se sincronizan automáticamente cada 2 minutos.
                    El dashboard y las transacciones se actualizan en tiempo real cada 5 segundos.
                  </Text>
                </AlertDescription>
              </Alert>

              <Alert status="info" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <AlertDescription>
                  <Text fontWeight="bold">Nota importante:</Text>
                  <Text>
                    Para obtener tus credenciales de API, ve a Binance → API Management.
                    Asegúrate de dar permisos de lectura a la API. Las credenciales se
                    almacenan de forma encriptada en tu base de datos.
                  </Text>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              <Alert status="warning" borderRadius="md">
                <AlertIcon as={FaTimesCircle} />
                <AlertTitle>No conectado</AlertTitle>
                <AlertDescription>
                  Conecta tu cuenta de Binance para sincronizar transacciones automáticamente
                </AlertDescription>
              </Alert>

              <FormControl>
                <FormLabel>API Key de Binance</FormLabel>
                <Input
                  type="password"
                  placeholder="Ingresa tu API Key"
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>API Secret de Binance</FormLabel>
                <Input
                  type="password"
                  placeholder="Ingresa tu API Secret"
                  value={apiSecret}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiSecret(e.target.value)}
                />
              </FormControl>

              <Button
                colorScheme="green"
                onClick={handleConnect}
                isLoading={isLoading}
                loadingText="Conectando..."
                w="full"
              >
                Conectar Cuenta
              </Button>

              <Alert status="info" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <AlertDescription>
                  <Text fontWeight="bold">Cómo obtener tus credenciales:</Text>
                  <Text>
                    1. Ve a Binance.com y accede a tu cuenta
                    <br />
                    2. Ve a API Management en la configuración
                    <br />
                    3. Crea una nueva API Key con permisos de lectura
                    <br />
                    4. Copia la API Key y API Secret aquí
                  </Text>
                </AlertDescription>
              </Alert>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

