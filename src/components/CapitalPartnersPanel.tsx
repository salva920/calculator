'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  TableContainer,
  VStack,
  useToast,
  Badge,
  Progress,
} from '@chakra-ui/react'
import axios from 'axios'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { formatDateYmdCaracas, inclusiveCalendarDaysCaracas } from '@/utils/caracas-date'

interface Partner {
  id: string
  name: string
  investedUsdt: number
  agreedDailyPercent: number
  sortOrder: number
  entryDate?: string | null
  createdAt?: string
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/

function partnerEntryYmd(p: Partner): string {
  const raw = p.entryDate ?? p.createdAt
  const d = raw ? new Date(raw) : new Date()
  const ymd = formatDateYmdCaracas(d)
  return YMD_RE.test(ymd) ? ymd : formatDateYmdCaracas(new Date())
}

export default function CapitalPartnersPanel() {
  const toast = useToast()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newInvested, setNewInvested] = useState('')
  const [newPercent, setNewPercent] = useState('1')
  /** yyyy-mm-dd; vacío = hoy (Caracas) en el servidor */
  const [newEntryDate, setNewEntryDate] = useState('')
  const [dailyProfitUsdt, setDailyProfitUsdt] = useState('')
  /** Bs.S por 1 USDT — solo para mostrar equivalencia aproximada (par USDT/VES) */
  const [vesPerUsdt, setVesPerUsdt] = useState('')

  const load = async () => {
    setLoadError(null)
    try {
      const res = await axios.get('/api/capital-partners')
      if (res.data?.success) {
        const list = (res.data.partners || []).map((p: any) => {
          const raw = p.investedUsdt ?? p.investedBs
          const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'))
          return {
            ...p,
            investedUsdt: Number.isFinite(n) && n >= 0 ? n : 0,
            entryDate: p.entryDate ?? null,
            createdAt: p.createdAt,
          }
        })
        setPartners(list)
      } else {
        setPartners([])
        setLoadError(res.data?.error || 'No se pudo cargar la lista de socios')
      }
    } catch (e: any) {
      console.error(e)
      setPartners([])
      setLoadError(e.response?.data?.error || e.message || 'Error de red al cargar socios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const rateNum = useMemo(() => {
    const v = parseFloat(String(vesPerUsdt).replace(',', '.'))
    return Number.isFinite(v) && v > 0 ? v : 0
  }, [vesPerUsdt])

  const totalCapitalUsdt = useMemo(
    () => partners.reduce((s, p) => s + (p.investedUsdt || 0), 0),
    [partners]
  )

  const expectedDailyUsdt = useMemo(
    () =>
      partners.reduce(
        (s, p) => s + ((p.investedUsdt || 0) * (p.agreedDailyPercent || 1)) / 100,
        0
      ),
    [partners]
  )

  const dailyProfitNum = useMemo(() => {
    const v = parseFloat(String(dailyProfitUsdt).replace(',', '.'))
    return Number.isFinite(v) ? v : 0
  }, [dailyProfitUsdt])

  const rows = useMemo(() => {
    if (totalCapitalUsdt <= 0) return []
    const share = (inv: number) => (inv / totalCapitalUsdt) * dailyProfitNum
    const expected = (inv: number, pct: number) => (inv * pct) / 100
    return partners.map((p) => {
      const inv = p.investedUsdt || 0
      const pct = p.agreedDailyPercent || 1
      const entryYmd = partnerEntryYmd(p)
      const daysActive = inclusiveCalendarDaysCaracas(entryYmd)
      const accumulatedExpectedUsdt = inv * (pct / 100) * daysActive
      const pctOfTotal = (inv / totalCapitalUsdt) * 100
      const exp = expected(inv, pct)
      const actual = share(inv)
      return {
        ...p,
        entryYmd,
        daysActive,
        accumulatedExpectedUsdt,
        pctOfTotal,
        expectedDailyUsdt: exp,
        actualShareUsdt: actual,
        vsExpectedUsdt: actual - exp,
      }
    })
  }, [partners, totalCapitalUsdt, dailyProfitNum])

  const fmtUsdt = (n: number) => {
    const x = Number(n)
    if (!Number.isFinite(x)) return '— USDT'
    return `${x.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
  }

  const fmtBs = (n: number) => {
    const x = Number(n)
    if (!Number.isFinite(x)) return '—'
    return x.toLocaleString('es-VE', { style: 'currency', currency: 'VES', maximumFractionDigits: 0 })
  }

  const handleAdd = async () => {
    const invested = parseFloat(String(newInvested).replace(',', '.'))
    const pct = parseFloat(String(newPercent).replace(',', '.'))
    if (!newName.trim()) {
      toast({ title: 'Nombre requerido', status: 'warning', duration: 2500, isClosable: true })
      return
    }
    if (!Number.isFinite(invested) || invested <= 0) {
      toast({ title: 'Capital inválido (USDT)', status: 'warning', duration: 2500, isClosable: true })
      return
    }
    setSaving(true)
    try {
      await axios.post('/api/capital-partners', {
        name: newName.trim(),
        investedUsdt: invested,
        agreedDailyPercent: Number.isFinite(pct) && pct >= 0 ? pct : 1,
        ...(newEntryDate.trim() ? { entryDate: newEntryDate.trim() } : {}),
      })
      setNewName('')
      setNewInvested('')
      setNewPercent('1')
      setNewEntryDate('')
      await load()
      toast({ title: 'Socio agregado', status: 'success', duration: 2000, isClosable: true })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'No se pudo guardar',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await axios.delete('/api/capital-partners', { params: { id } })
      await load()
      toast({ title: 'Socio retirado de la lista', status: 'info', duration: 2000, isClosable: true })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'No se pudo eliminar',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const attainment =
    expectedDailyUsdt > 0 && dailyProfitNum > 0
      ? Math.min(100, (dailyProfitNum / expectedDailyUsdt) * 100)
      : 0

  const showVes = rateNum > 0

  return (
    <Card>
      <CardHeader>
        <Heading size="md" color="purple.600">
          Capital prestado (USDT) y reparto diario
        </Heading>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Montos en <strong>USDT</strong>. Cada socio tiene <strong>fecha de ingreso</strong> (Caracas): la columna
          &quot;Meta acum.&quot; es capital × % diario × <strong>días calendario desde el ingreso hasta hoy</strong>{' '}
          (interés lineal simple). Opcional: <strong>Bs.S por USDT</strong> para equivalencia. El reparto del día es
          proporcional al capital en USDT.
        </Text>
      </CardHeader>
      <CardBody>
        {loading ? (
          <Text>Cargando...</Text>
        ) : (
          <VStack align="stretch" spacing={4}>
            {loadError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle fontSize="sm">{loadError}</AlertTitle>
              </Alert>
            )}
            <HStack flexWrap="wrap" spacing={4}>
              <Box>
                <Text fontSize="xs" color="gray.600">
                  Capital total
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  {fmtUsdt(totalCapitalUsdt)}
                </Text>
                {showVes && (
                  <Text fontSize="xs" color="gray.500">
                    ≈ {fmtBs(totalCapitalUsdt * rateNum)}
                  </Text>
                )}
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600">
                  Meta diaria esperada (USDT, suma % acordado)
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="orange.600">
                  {fmtUsdt(expectedDailyUsdt)}
                </Text>
                {showVes && (
                  <Text fontSize="xs" color="gray.500">
                    ≈ {fmtBs(expectedDailyUsdt * rateNum)}
                  </Text>
                )}
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600">
                  Socios activos
                </Text>
                <Badge colorScheme="purple" fontSize="md">
                  {partners.length}
                </Badge>
              </Box>
            </HStack>

            <HStack flexWrap="wrap" spacing={4} align="flex-end">
              <FormControl maxW="280px">
                <FormLabel fontSize="sm">Ganancia del día (USDT) — reparto proporcional</FormLabel>
                <Input
                  placeholder="Ej: 25.5"
                  value={dailyProfitUsdt}
                  onChange={(e) => setDailyProfitUsdt(e.target.value)}
                />
              </FormControl>
              <FormControl maxW="220px">
                <FormLabel fontSize="sm">Tasa referencia (Bs.S / USDT, opcional)</FormLabel>
                <Input
                  placeholder="Ej: 650"
                  value={vesPerUsdt}
                  onChange={(e) => setVesPerUsdt(e.target.value)}
                />
              </FormControl>
            </HStack>
            {expectedDailyUsdt > 0 && dailyProfitNum > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Cumplimiento vs meta diaria (USDT): {attainment.toFixed(1)}%
                </Text>
                <Progress
                  value={attainment}
                  size="sm"
                  colorScheme={attainment >= 100 ? 'green' : 'orange'}
                  borderRadius="md"
                  maxW="400px"
                />
              </Box>
            )}

            <Box p={3} bg="gray.50" borderRadius="md" borderWidth="1px">
              <Text fontWeight="semibold" mb={2} fontSize="sm">
                Agregar socio
              </Text>
              <HStack flexWrap="wrap" spacing={2} align="flex-end">
                <FormControl maxW="200px">
                  <FormLabel fontSize="xs">Nombre</FormLabel>
                  <Input size="sm" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej: Juan" />
                </FormControl>
                <FormControl maxW="160px">
                  <FormLabel fontSize="xs">Capital (USDT)</FormLabel>
                  <NumberInput
                    size="sm"
                    value={newInvested === '' ? undefined : newInvested}
                    onChange={(v) => setNewInvested(v ?? '')}
                    min={0}
                  >
                    <NumberInputField placeholder="500" />
                  </NumberInput>
                </FormControl>
                <FormControl maxW="120px">
                  <FormLabel fontSize="xs">% diario</FormLabel>
                  <NumberInput size="sm" value={newPercent} onChange={(v) => setNewPercent(v)} min={0} step={0.1}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl maxW="155px">
                  <FormLabel fontSize="xs">Fecha ingreso</FormLabel>
                  <Input
                    type="date"
                    size="sm"
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                  />
                </FormControl>
                <Button leftIcon={<FaPlus />} size="sm" colorScheme="purple" onClick={handleAdd} isLoading={saving}>
                  Agregar
                </Button>
              </HStack>
            </Box>

            {partners.length === 0 ? (
              <Text color="gray.500" fontSize="sm">
                No hay socios registrados. Agrega las inversiones en USDT para ver la distribución.
              </Text>
            ) : (
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Socio</Th>
                      <Th>Fecha ingreso</Th>
                      <Th isNumeric>Días</Th>
                      <Th isNumeric>Meta acum. (USDT)</Th>
                      {showVes && <Th isNumeric>≈ Bs.S</Th>}
                      <Th isNumeric>Capital (USDT)</Th>
                      {showVes && <Th isNumeric>≈ Bs.S</Th>}
                      <Th isNumeric>% del total</Th>
                      <Th isNumeric>% diario</Th>
                      <Th isNumeric>Meta /día (USDT)</Th>
                      {showVes && <Th isNumeric>≈ Bs.S</Th>}
                      <Th isNumeric>Reparto hoy (USDT)</Th>
                      {showVes && <Th isNumeric>≈ Bs.S</Th>}
                      <Th isNumeric>vs meta (USDT)</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((r) => (
                      <Tr key={r.id}>
                        <Td fontWeight="medium">{r.name}</Td>
                        <Td fontSize="xs">
                          {new Date(r.entryYmd + 'T12:00:00-04:00').toLocaleDateString('es-VE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </Td>
                        <Td isNumeric>{r.daysActive}</Td>
                        <Td isNumeric fontWeight="semibold" color="blue.700">
                          {fmtUsdt(r.accumulatedExpectedUsdt)}
                        </Td>
                        {showVes && (
                          <Td isNumeric>{fmtBs(r.accumulatedExpectedUsdt * rateNum)}</Td>
                        )}
                        <Td isNumeric>{fmtUsdt(r.investedUsdt)}</Td>
                        {showVes && <Td isNumeric>{fmtBs(r.investedUsdt * rateNum)}</Td>}
                        <Td isNumeric>
                          {Number.isFinite(r.pctOfTotal) ? `${r.pctOfTotal.toFixed(2)}%` : '—'}
                        </Td>
                        <Td isNumeric>{(r.agreedDailyPercent ?? 1).toFixed(2)}%</Td>
                        <Td isNumeric>{fmtUsdt(r.expectedDailyUsdt)}</Td>
                        {showVes && <Td isNumeric>{fmtBs(r.expectedDailyUsdt * rateNum)}</Td>}
                        <Td isNumeric fontWeight="semibold">
                          {dailyProfitNum > 0 ? fmtUsdt(r.actualShareUsdt) : '—'}
                        </Td>
                        {showVes && (
                          <Td isNumeric>
                            {dailyProfitNum > 0 ? fmtBs(r.actualShareUsdt * rateNum) : '—'}
                          </Td>
                        )}
                        <Td isNumeric color={r.vsExpectedUsdt >= 0 ? 'green.600' : 'red.500'}>
                          {dailyProfitNum > 0 ? fmtUsdt(r.vsExpectedUsdt) : '—'}
                        </Td>
                        <Td>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            leftIcon={<FaTrash />}
                            onClick={() => handleRemove(r.id)}
                          >
                            Quitar
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            {dailyProfitNum > 0 && totalCapitalUsdt > 0 && (
              <Text fontSize="xs" color="gray.600">
                Suma repartos: {fmtUsdt(rows.reduce((s, r) => s + r.actualShareUsdt, 0))} (debe coincidir con la
                ganancia del día en USDT).
              </Text>
            )}
          </VStack>
        )}
      </CardBody>
    </Card>
  )
}
