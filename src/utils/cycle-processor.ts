import { prisma } from '@/lib/prisma'

const MIN_CYCLE_USDT = 0.01 // mínimo para considerar un ciclo (evitar polvo)

// Función para procesar y guardar ciclos con detalles completos. Cada ciclo = cantidad real vendida y comprada emparejada (no 100 fijo).
// Optimizada: carga ciclos existentes una vez y verifica en memoria, hace batch inserts.
export async function processAndSaveCycles(
  windowStart: Date,
  _today: Date,
  _todayEnd: Date
) {
  try {
    // Cargar transacciones y ciclos existentes en paralelo
    const [transactions, existingCycles] = await Promise.all([
      prisma.binanceP2PTransaction.findMany({
        where: {
          orderStatus: 'COMPLETED',
          createTime: { gte: windowStart },
        },
        orderBy: { createTime: 'asc' },
        select: {
          id: true,
          tradeType: true,
          amount: true,
          fiatAmount: true,
          commission: true,
          bankCommission: true,
          paymentMethod: true,
          createTime: true,
        },
      }),
      prisma.p2PCycle.findMany({
        where: { date: { gte: windowStart } },
        select: {
          sellTransactions: true,
          buyTransactions: true,
          date: true,
        },
      }),
    ])

    // Crear Set de claves de ciclos existentes para verificación rápida en memoria
    const existingCycleKeys = new Set<string>()
    for (const cycle of existingCycles) {
      const key = `${cycle.date.toISOString().split('T')[0]}-${cycle.sellTransactions.sort().join(',')}-${cycle.buyTransactions.sort().join(',')}`
      existingCycleKeys.add(key)
    }

    const sellQueue: Array<{ tx: typeof transactions[0]; remaining: number }> = []
    const buyQueue: Array<{ tx: typeof transactions[0]; remaining: number }> = []
    const cyclesToCreate: any[] = []

    for (const tx of transactions) {
      if (tx.tradeType === 'SELL') {
        sellQueue.push({ tx, remaining: tx.amount })
      } else if (tx.tradeType === 'BUY') {
        buyQueue.push({ tx, remaining: tx.amount })
      }

      let totalSell = sellQueue.reduce((s, i) => s + i.remaining, 0)
      let totalBuy = buyQueue.reduce((s, i) => s + i.remaining, 0)

      // Cerrar ciclos: cada ciclo = min(ventas pendientes, compras pendientes)
      while (sellQueue.length > 0 && buyQueue.length > 0 && totalSell >= MIN_CYCLE_USDT && totalBuy >= MIN_CYCLE_USDT) {
        const cycleAmount = Math.min(totalSell, totalBuy)
        const cycleSells: typeof transactions = []
        const cycleBuys: typeof transactions = []
        let cycleSellAmount = 0
        let cycleBuyAmount = 0
        let cycleSellFiat = 0
        let cycleBuyFiat = 0
        let cycleSellCommission = 0
        let cycleBuyCommission = 0
        let cycleSellBankComm = 0
        let cycleBuyBankComm = 0

        // Tomar ventas hasta completar cycleAmount
        while (cycleSellAmount < cycleAmount && sellQueue.length > 0) {
          const item = sellQueue[0]
          const needed = cycleAmount - cycleSellAmount
          const take = Math.min(item.remaining, needed)
          const ratio = take / item.tx.amount
          cycleSellAmount += take
          cycleSellFiat += ratio * item.tx.fiatAmount
          cycleSellCommission += ratio * item.tx.commission
          cycleSellBankComm += ratio * (item.tx.bankCommission || 0)
          item.remaining -= take
          if (cycleSells.length === 0 || cycleSells[cycleSells.length - 1].id !== item.tx.id) cycleSells.push(item.tx)
          if (item.remaining <= 0.01) sellQueue.shift()
        }

        // Tomar compras hasta completar cycleAmount
        while (cycleBuyAmount < cycleAmount && buyQueue.length > 0) {
          const item = buyQueue[0]
          const needed = cycleAmount - cycleBuyAmount
          const take = Math.min(item.remaining, needed)
          const ratio = take / item.tx.amount
          cycleBuyAmount += take
          cycleBuyFiat += ratio * item.tx.fiatAmount
          cycleBuyCommission += ratio * item.tx.commission
          cycleBuyBankComm += ratio * (item.tx.bankCommission || 0)
          item.remaining -= take
          if (cycleBuys.length === 0 || cycleBuys[cycleBuys.length - 1].id !== item.tx.id) cycleBuys.push(item.tx)
          if (item.remaining <= 0.01) buyQueue.shift()
        }

        const sellFiatAmount = cycleSellFiat
        const buyFiatAmount = cycleBuyFiat
        const averageSellPrice = cycleSellAmount > 0 ? sellFiatAmount / cycleSellAmount : 0
        const averageBuyPrice = cycleBuyAmount > 0 ? buyFiatAmount / cycleBuyAmount : 0
        const grossProfit = sellFiatAmount - buyFiatAmount
        const binanceCommissions = cycleSellCommission + cycleBuyCommission
        const totalBankCommissions = cycleSellBankComm + cycleBuyBankComm
        const totalCommissions = binanceCommissions + totalBankCommissions
        const cycleUsdtAmount = Math.min(cycleSellAmount, cycleBuyAmount)
        const netProfit = grossProfit - totalCommissions
        const profitMargin = sellFiatAmount > 0 ? (netProfit / sellFiatAmount) * 100 : 0
        const roi = sellFiatAmount > 0 ? (netProfit / sellFiatAmount) * 100 : 0

        const sellBanks = Array.from(new Set(cycleSells.map((tx) => tx.paymentMethod).filter((pm): pm is string => !!pm)))
        const buyBanks = Array.from(new Set(cycleBuys.map((tx) => tx.paymentMethod).filter((pm): pm is string => !!pm)))
        const paymentMethods = Array.from(new Set([...sellBanks, ...buyBanks]))

        const completedAt = cycleBuys.length > 0
          ? cycleBuys[cycleBuys.length - 1].createTime
          : cycleSells[cycleSells.length - 1].createTime
        const cycleDate = new Date(completedAt)
        cycleDate.setHours(0, 0, 0, 0)

        const sellTransactionIds = cycleSells.map((tx) => tx.id)
        const buyTransactionIds = cycleBuys.map((tx) => tx.id)
        const cycleKey = `${cycleDate.toISOString().split('T')[0]}-${sellTransactionIds.sort().join(',')}-${buyTransactionIds.sort().join(',')}`

        // Verificar en memoria si ya existe
        if (!existingCycleKeys.has(cycleKey)) {
          existingCycleKeys.add(cycleKey) // Marcar como procesado para evitar duplicados en este batch
          cyclesToCreate.push({
            completedAt,
            date: cycleDate,
            usdtAmount: cycleUsdtAmount,
            sellUsdtAmount: cycleSellAmount,
            buyUsdtAmount: cycleBuyAmount,
            sellFiatAmount,
            buyFiatAmount,
            averageSellPrice,
            averageBuyPrice,
            grossProfit,
            netProfit,
            totalCommissions,
            profitMargin,
            roi,
            sellTransactions: sellTransactionIds,
            buyTransactions: buyTransactionIds,
            paymentMethods,
            sellBanks,
            buyBanks,
          })
        }

        totalSell = sellQueue.reduce((s, i) => s + i.remaining, 0)
        totalBuy = buyQueue.reduce((s, i) => s + i.remaining, 0)
      }
    }

    // Insertar todos los ciclos nuevos (MongoDB no soporta skipDuplicates en createMany)
    // Usar Promise.allSettled para que si algunos fallan por duplicados, los demás continúen
    if (cyclesToCreate.length > 0) {
      const results = await Promise.allSettled(
        cyclesToCreate.map((cycleData) =>
          prisma.p2PCycle.create({
            data: cycleData,
          })
        )
      )
      
      // Contar errores (ignorar duplicados silenciosamente)
      const errors = results.filter((r) => r.status === 'rejected')
      if (errors.length > 0) {
        const nonDuplicateErrors = errors.filter((r) => {
          const error = r.status === 'rejected' ? r.reason : null
          // Ignorar errores de duplicados (MongoDB puede tener diferentes formatos)
          return error && !error.message?.toLowerCase().includes('duplicate') && error.code !== 11000
        })
        if (nonDuplicateErrors.length > 0) {
          console.warn(`Algunos ciclos no se pudieron crear:`, nonDuplicateErrors.length)
        }
      }
    }
  } catch (error) {
    console.error('Error procesando y guardando ciclos:', error)
    throw error // Re-lanzar para que el caller pueda manejarlo
  }
}
