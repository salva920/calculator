export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** Devuelve la variable faltante o null si la config de producción es válida. */
export function getProductionConfigError(): string | null {
  if (!isProduction()) return null

  const password = process.env.APP_ACCESS_PASSWORD?.trim()
  if (!password || password.length < 4) {
    return 'APP_ACCESS_PASSWORD debe estar definida (mín. 4 caracteres)'
  }

  const key = process.env.ENCRYPTION_KEY?.trim()
  if (!key || key.length < 32) {
    return 'ENCRYPTION_KEY debe estar definida (mín. 32 caracteres)'
  }

  return null
}

export function getEncryptionKeyOrThrow(): string {
  const key = process.env.ENCRYPTION_KEY?.trim()
  if (key && key.length >= 32) return key

  if (isProduction()) {
    throw new Error('ENCRYPTION_KEY debe tener al menos 32 caracteres en producción')
  }

  return 'default-key-change-in-production-32-chars!!'
}
