export { dynamic } from '@/lib/route-config'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import {
  applyClientKycImageUpdates,
  getLegacyFields,
  listKycWithLegacyImages,
  migrateAllKycFromDisk,
  type KycImageUrlField,
} from '@/lib/migrate-legacy-kyc'

export async function GET() {
  try {
    const pending = await listKycWithLegacyImages()
    return NextResponse.json({
      success: true,
      count: pending.length,
      pending: pending.map((k) => ({
        transactionId: k.transactionId,
        orderNumber: k.transaction?.orderNumber ?? k.transactionId,
        legacyFields: getLegacyFields(k),
        idCardImageUrl: k.idCardImageUrl,
        swornDeclarationImageUrl: k.swornDeclarationImageUrl,
        sourceOfFundsImageUrl: k.sourceOfFundsImageUrl,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('GET migrate-legacy KYC:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/** POST: { mode?: 'disk' } migra desde public/uploads en el servidor, o { transactionId, images } desde el navegador. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body.mode === 'disk' || (!body.transactionId && !body.images)) {
      const result = await migrateAllKycFromDisk()
      return NextResponse.json({
        success: true,
        mode: 'disk',
        ...result,
        hint:
          result.recordsFailed.length > 0
            ? 'Algunas imágenes no están en public/uploads de este servidor. Ejecuta npm run migrate:kyc en tu PC con la carpeta uploads, o abre la app en localhost y usa "Migrar imágenes".'
            : undefined,
      })
    }

    const transactionId = String(body.transactionId || '')
    const images = body.images as Partial<Record<KycImageUrlField, string>> | undefined

    if (!transactionId || !images) {
      return NextResponse.json(
        { success: false, error: 'transactionId e images son requeridos' },
        { status: 400 }
      )
    }

    const { updated } = await applyClientKycImageUpdates(transactionId, images)
    return NextResponse.json({ success: true, mode: 'client', updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('POST migrate-legacy KYC:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
