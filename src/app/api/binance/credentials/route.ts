export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/crypto'
import { BinanceAPI } from '@/lib/binance'

// Obtener credenciales (solo verificación, no retorna los secretos)
export async function GET(request: NextRequest) {
  try {
    const credentials = await prisma.binanceCredentials.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        isActive: true,
        lastSync: true,
        syncEnabled: true,
        syncInterval: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!credentials) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'No hay credenciales configuradas',
      })
    }

    return NextResponse.json({
      success: true,
      connected: true,
      credentials,
    })
  } catch (error: any) {
    console.error('Error obteniendo credenciales:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener credenciales',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Guardar o actualizar credenciales
export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret } = await request.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'API Key y API Secret son requeridos',
        },
        { status: 400 }
      )
    }

    // Verificar que las credenciales sean válidas
    const binanceAPI = new BinanceAPI(apiKey, apiSecret)
    
    try {
      const isValid = await binanceAPI.verifyCredentials()

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Las credenciales de Binance no son válidas. Verifica:\n' +
                   '1. Que tu API Key y Secret sean correctos\n' +
                   '2. Que tu API Key tenga permisos de "Enable Reading"\n' +
                   '3. Que tu IP esté permitida en las restricciones de la API Key (si aplica)\n' +
                   '4. Que la API Key no haya sido revocada',
          },
          { status: 401 }
        )
      }
    } catch (error: any) {
      console.error('Error verificando credenciales:', error)
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error al verificar credenciales'
      
      if (error.message?.includes('Signature')) {
        errorMessage = 'Error de firma. Verifica que tu API Secret sea correcto y que no haya espacios adicionales.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout al conectar con Binance. Verifica tu conexión a internet.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 401 }
      )
    }

    // Encriptar las credenciales
    const encryptedApiKey = encrypt(apiKey)
    const encryptedApiSecret = encrypt(apiSecret)

    // Buscar credenciales existentes
    const existing = await prisma.binanceCredentials.findFirst({
      where: { isActive: true },
    })

    let credentials
    if (existing) {
      // Actualizar existentes
      credentials = await prisma.binanceCredentials.update({
        where: { id: existing.id },
        data: {
          apiKey: encryptedApiKey,
          apiSecret: encryptedApiSecret,
          isActive: true,
          updatedAt: new Date(),
        },
      })
    } else {
      // Crear nuevas
      credentials = await prisma.binanceCredentials.create({
        data: {
          apiKey: encryptedApiKey,
          apiSecret: encryptedApiSecret,
          isActive: true,
          syncEnabled: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciales guardadas exitosamente',
      credentials: {
        id: credentials.id,
        isActive: credentials.isActive,
        syncEnabled: credentials.syncEnabled,
        createdAt: credentials.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Error guardando credenciales:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al guardar credenciales',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Eliminar credenciales
export async function DELETE(request: NextRequest) {
  try {
    const credentials = await prisma.binanceCredentials.findFirst({
      where: { isActive: true },
    })

    if (credentials) {
      await prisma.binanceCredentials.update({
        where: { id: credentials.id },
        data: {
          isActive: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciales eliminadas exitosamente',
    })
  } catch (error: any) {
    console.error('Error eliminando credenciales:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar credenciales',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

