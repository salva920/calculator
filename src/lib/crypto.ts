import crypto from 'crypto'
import { getEncryptionKeyOrThrow } from '@/lib/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const KEY_LENGTH = 32
const CURRENT_SALT = 'p2p-salt-v1'
/** Salt usado antes del hardening de seguridad; necesario para leer credenciales ya guardadas. */
const LEGACY_SALT = 'salt'

function deriveKey(salt: string): Buffer {
  const key = getEncryptionKeyOrThrow()
  return crypto.scryptSync(key, salt, KEY_LENGTH)
}

function decryptWithKey(encryptedText: string, key: Buffer): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Formato de texto encriptado inválido')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export function encrypt(text: string): string {
  try {
    const key = deriveKey(CURRENT_SALT)
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Error encrypting:', error)
    throw new Error('Error al encriptar los datos')
  }
}

export function decrypt(encryptedText: string): string {
  return decryptWithMeta(encryptedText).value
}

export function decryptWithMeta(encryptedText: string): { value: string; usedLegacySalt: boolean } {
  try {
    return {
      value: decryptWithKey(encryptedText, deriveKey(CURRENT_SALT)),
      usedLegacySalt: false,
    }
  } catch {
    try {
      return {
        value: decryptWithKey(encryptedText, deriveKey(LEGACY_SALT)),
        usedLegacySalt: true,
      }
    } catch (error) {
      console.error('Error decrypting:', error)
      throw new Error(
        'Error al desencriptar los datos. Verifica que ENCRYPTION_KEY sea la misma con la que guardaste las credenciales, o vuelve a guardarlas en Conexión Binance.'
      )
    }
  }
}

/** True si el valor cifrado fue generado con el salt antiguo y conviene re-guardarlo. */
export function wasEncryptedWithLegacySalt(encryptedText: string): boolean {
  try {
    decryptWithKey(encryptedText, deriveKey(CURRENT_SALT))
    return false
  } catch {
    try {
      decryptWithKey(encryptedText, deriveKey(LEGACY_SALT))
      return true
    } catch {
      return false
    }
  }
}
