'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Progress,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import { FaTrophy, FaCheckCircle, FaPlus } from 'react-icons/fa'
import axios from 'axios'

interface Goal {
  id: string
  name: string
  type: string
  targetValue: number
  currentValue: number
  startDate: string
  endDate: string | null
  isActive: boolean
  isCompleted: boolean
  completedAt: string | null
}

export default function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'profit',
    targetValue: '',
    endDate: '',
  })

  useEffect(() => {
    loadGoals()
    // Actualizar cada 30 segundos
    const interval = setInterval(loadGoals, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadGoals = async () => {
    try {
      const response = await axios.get('/api/goals?activeOnly=true')
      if (response.data.success) {
        setGoals(response.data.goals)
      }
    } catch (error) {
      console.error('Error cargando objetivos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetValue) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const response = await axios.post('/api/goals', newGoal)
      if (response.data.success) {
        toast({
          title: 'Objetivo creado',
          description: 'El objetivo se ha creado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setNewGoal({ name: '', type: 'profit', targetValue: '', endDate: '' })
        onClose()
        loadGoals()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo crear el objetivo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      orders: 'Órdenes',
      profit: 'Ganancia (VES)',
      volume: 'Volumen (USDT)',
      btc_30_days: 'BTC 30 días',
      btc_total: 'BTC Total',
    }
    return labels[type] || type
  }

  const formatValue = (type: string, value: number) => {
    if (type === 'profit') {
      return `${value.toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}`
    } else if (type === 'volume') {
      return `${value.toFixed(2)} USDT`
    } else if (type === 'btc_30_days' || type === 'btc_total') {
      return `${value.toFixed(4)} BTC`
    } else {
      return value.toString()
    }
  }

  const getProgress = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100)
  }

  return (
    <Card>
      <CardHeader borderBottomWidth="1px" borderColor="surface.border" bg="surface.muted">
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Heading size="md" color="gray.800">Objetivos</Heading>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="brand"
            size="sm"
            borderRadius="full"
            onClick={onOpen}
          >
            Nuevo objetivo
          </Button>
        </HStack>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Text>Cargando objetivos...</Text>
        ) : goals.length === 0 ? (
          <VStack spacing={4} py={8}>
            <FaTrophy size={48} color="#CBD5E0" />
            <Text color="gray.500" textAlign="center">
              No tienes objetivos configurados
              <br />
              Crea uno para comenzar a rastrear tu progreso
            </Text>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            {goals.map((goal) => {
              const progress = getProgress(goal)
              return (
                <Box
                  key={goal.id}
                  p={4}
                  border="1px solid"
                  borderColor={goal.isCompleted ? 'green.200' : 'surface.border'}
                  borderRadius="xl"
                  bg={goal.isCompleted ? 'green.50' : 'surface.card'}
                  boxShadow="card"
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack>
                      {goal.isCompleted && <FaCheckCircle color="green" />}
                      <Text fontWeight="bold">{goal.name}</Text>
                      <Badge colorScheme={goal.isCompleted ? 'green' : 'blue'}>
                        {getGoalTypeLabel(goal.type)}
                      </Badge>
                    </HStack>
                    {goal.isCompleted && (
                      <Badge colorScheme="green">Completado</Badge>
                    )}
                  </HStack>

                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="gray.600">
                        {formatValue(goal.type, goal.currentValue)} /{' '}
                        {formatValue(goal.type, goal.targetValue)}
                      </Text>
                      <Text fontWeight="bold">{progress.toFixed(1)}%</Text>
                    </HStack>

                    <Progress
                      value={progress}
                      colorScheme={goal.isCompleted ? 'green' : 'blue'}
                      size="lg"
                      borderRadius="md"
                    />

                    {goal.endDate && (
                      <Text fontSize="xs" color="gray.500">
                        Fecha límite:{' '}
                        {new Date(goal.endDate).toLocaleDateString('es-VE')}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )
            })}
          </VStack>
        )}
      </CardBody>

      {/* Modal para crear objetivo */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Crear Nuevo Objetivo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nombre del Objetivo</FormLabel>
                <Input
                  placeholder="Ej: Ganar 1000 VES este mes"
                  value={newGoal.name}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, name: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Tipo de Objetivo</FormLabel>
                <Select
                  value={newGoal.type}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, type: e.target.value })
                  }
                >
                  <option value="profit">Ganancia (VES)</option>
                  <option value="orders">Número de Órdenes</option>
                  <option value="volume">Volumen (USDT)</option>
                  <option value="btc_30_days">BTC 30 días</option>
                  <option value="btc_total">BTC Total</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Valor Objetivo</FormLabel>
                <NumberInput
                  value={newGoal.targetValue}
                  onChange={(valueString) =>
                    setNewGoal({ ...newGoal, targetValue: valueString })
                  }
                  min={0}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Fecha Límite (Opcional)</FormLabel>
                <Input
                  type="date"
                  value={newGoal.endDate}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, endDate: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="green" onClick={handleCreateGoal}>
              Crear Objetivo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  )
}

