/**
 * Snapshot de billetera vía cron HTTP (local o remoto).
 *
 * Local (con npm run dev activo):
 *   npm run snapshot:wallet
 *
 * Remoto (Vercel):
 *   set SNAPSHOT_URL=https://tu-app.vercel.app/api/cron/wallet-balance
 *   npm run snapshot:wallet
 *
 * Requiere CRON_SECRET en .env (y en Vercel).
 */
const path = require('path')
const fs = require('fs')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'))
loadEnvFile(path.join(__dirname, '..', '.env.local'))

async function main() {
  const secret = process.env.CRON_SECRET || process.env.APP_ACCESS_PASSWORD
  if (!secret) {
    console.error('Define CRON_SECRET (o APP_ACCESS_PASSWORD) en .env')
    process.exit(1)
  }

  const port = process.env.PORT || 3000
  const remote = process.env.SNAPSHOT_URL
  const target =
    remote ||
    `http://127.0.0.1:${port}/api/cron/wallet-balance`

  console.log(`[snapshot:wallet] POST ${target}`)
  const res = await fetch(target, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'x-cron-secret': secret,
    },
  })
  const data = await res.json().catch(() => ({}))
  console.log(`[snapshot:wallet] HTTP ${res.status}`, data)
  if (!res.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
