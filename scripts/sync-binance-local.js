/**
 * Sincroniza Binance → MongoDB desde tu PC (IP en región permitida).
 *
 * Uso:
 *   1. En una terminal: npm run dev
 *   2. En otra: npm run sync:local
 *
 * Opcional: SYNC_LOCAL_URL=http://localhost:3000
 * Si usas APP_ACCESS_PASSWORD, define SYNC_LOCAL_PASSWORD en .env o exporta la variable.
 */

const axios = require('axios')

async function main() {
  const base = (process.env.SYNC_LOCAL_URL || 'http://localhost:3000').replace(/\/$/, '')
  const password = process.env.SYNC_LOCAL_PASSWORD || process.env.APP_ACCESS_PASSWORD

  let cookie = ''
  if (password) {
    const login = await axios.post(
      `${base}/api/auth/login`,
      { password },
      { validateStatus: () => true }
    )
    const setCookie = login.headers['set-cookie']
    if (Array.isArray(setCookie) && setCookie.length) {
      cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
    }
    if (login.status !== 200) {
      console.error('Login local falló:', login.status, login.data)
      process.exit(1)
    }
  }

  const res = await axios.post(
    `${base}/api/binance/sync`,
    { force: true },
    {
      headers: {
        'x-force-sync': '1',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      timeout: 120_000,
      validateStatus: () => true,
    }
  )

  console.log(JSON.stringify(res.data, null, 2))
  if (!res.data?.success) {
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
