import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM currencies ORDER BY is_default DESC, name')
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Currencies GET error:', (err as Error).message)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const { name, code, symbol, exchange_rate, decimal_places, is_default } = await req.json()
  try {
    if (is_default) {
      await pool.query('UPDATE currencies SET is_default = FALSE WHERE is_default = TRUE')
    }
    await pool.query(
      `INSERT INTO currencies (name, code, symbol, exchange_rate, decimal_places, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, code.toUpperCase(), symbol, exchange_rate, decimal_places, is_default || false]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { id, name, code, symbol, exchange_rate, decimal_places, is_active, is_default } = await req.json()
  try {
    if (is_default) {
      await pool.query('UPDATE currencies SET is_default = FALSE WHERE is_default = TRUE')
    }
    await pool.query(
      `UPDATE currencies SET name=$1, code=$2, symbol=$3, exchange_rate=$4, decimal_places=$5, is_active=$6, is_default=$7 WHERE id=$8`,
      [name, code.toUpperCase(), symbol, exchange_rate, decimal_places, is_active, is_default || false, id]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    const check = await pool.query('SELECT is_default FROM currencies WHERE id=$1', [id])
    if (check.rows.length > 0 && check.rows[0].is_default) {
      return NextResponse.json({ error: 'Cannot delete default currency' }, { status: 400 })
    }
    await pool.query('DELETE FROM currencies WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
