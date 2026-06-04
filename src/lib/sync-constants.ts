/** Intervalo entre syncs automáticos (solo una fuente en la app). */
export const BINANCE_SYNC_INTERVAL_MS = 120_000

/** Mínimo entre llamadas reales a Binance en el servidor (evita ráfagas). */
export const BINANCE_SYNC_SERVER_MIN_GAP_MS = 90_000

/** Poll de métricas/transacciones: solo MongoDB, no Binance. */
export const UI_POLL_DATABASE_MS = 10_000

/** Precio USDT en calculadora (API pública spot, no P2P firmada). */
export const BINANCE_PRICE_REFETCH_MS = 60_000
