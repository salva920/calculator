import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

// Obtener la clave de encriptación desde variables de entorno
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY debe tener al menos 32 caracteres')
  }
  return crypto.scryptSync(key, 'salt', KEY_LENGTH)
}

export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combinar iv + tag + encrypted
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Error encrypting:', error)
    throw new Error('Error al encriptar los datos')
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
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
  } catch (error) {
    console.error('Error decrypting:', error)
    throw new Error('Error al desencriptar los datos')
  }
}

