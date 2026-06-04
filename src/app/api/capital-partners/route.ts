import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTodayBoundsCaracas } from '@/utils/caracas-date'

const db = prisma as any

export async function GET() {
  try {
    const raw = await db.capitalPartner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    // Compat: documentos viejos con investedBs
    const partners = raw.map((p: any) => {
      const investedUsdt =
        typeof p.investedUsdt === 'number' ? p.investedUsdt : Number(p.investedBs) || 0
      const entryDate = p.entryDate ? new Date(p.entryDate) : p.createdAt ? new Date(p.createdAt) : null
      return { ...p, investedUsdt, entryDate }
    })
    return NextResponse.json({ success: true, partners })
  } catch (error: any) {
    console.error('Error listando socios de capital:', error)
    return NextResponse.json(
      { success: false, error: 'Error al listar socios', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const investedUsdt = Number(body.investedUsdt ?? body.investedBs)
    const agreedDailyPercent =
      body.agreedDailyPercent !== undefined && body.agreedDailyPercent !== ''
        ? Number(body.agreedDailyPercent)
        : 1

    if (!name) {
      return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 })
    }
    if (!Number.isFinite(investedUsdt) || investedUsdt <= 0) {
      return NextResponse.json(
        { success: false, error: 'El capital en USDT debe ser mayor a 0' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(agreedDailyPercent) || agreedDailyPercent < 0) {
      return NextResponse.json({ success: false, error: 'Porcentaje diario inválido' }, { status: 400 })
    }

    let entryDate: Date = getTodayBoundsCaracas().start
    const entryRaw = body.entryDate
    if (typeof entryRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entryRaw.trim())) {
      entryDate = new Date(entryRaw.trim() + 'T12:00:00.000-04:00')
    }

    const count = await db.capitalPartner.count({ where: { isActive: true } })
    const partner = await db.capitalPartner.create({
      data: {
        name,
        investedUsdt,
        agreedDailyPercent,
        entryDate,
        sortOrder: count,
      },
    })
    return NextResponse.json({ success: true, partner })
  } catch (error: any) {
    console.error('Error creando socio de capital:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear socio', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id es requerido' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = String(body.name).trim()
    if (body.investedUsdt !== undefined || body.investedBs !== undefined) {
      const v = Number(body.investedUsdt ?? body.investedBs)
      if (!Number.isFinite(v) || v <= 0) {
        return NextResponse.json({ success: false, error: 'Capital inválido' }, { status: 400 })
      }
      data.investedUsdt = v
    }
    if (body.agreedDailyPercent !== undefined) {
      const p = Number(body.agreedDailyPercent)
      if (!Number.isFinite(p) || p < 0) {
        return NextResponse.json({ success: false, error: 'Porcentaje inválido' }, { status: 400 })
      }
      data.agreedDailyPercent = p
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder)
    if (body.entryDate !== undefined) {
      const s = String(body.entryDate).trim()
      if (!s) {
        data.entryDate = null
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        data.entryDate = new Date(s + 'T12:00:00.000-04:00')
      } else {
        return NextResponse.json({ success: false, error: 'entryDate inválida (use YYYY-MM-DD)' }, { status: 400 })
      }
    }

    const partner = await db.capitalPartner.update({
      where: { id },
      data: data as any,
    })
    return NextResponse.json({ success: true, partner })
  } catch (error: any) {
    console.error('Error actualizando socio de capital:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar socio', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id es requerido' }, { status: 400 })
    }
    await db.capitalPartner.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error eliminando socio de capital:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar socio', details: error.message },
      { status: 500 }
    )
  }
}
