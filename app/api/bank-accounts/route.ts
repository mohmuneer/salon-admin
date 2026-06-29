import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import pool from '@/lib/db'

/* GET /api/bank-accounts?branch_id=UUID  — list accounts for a branch (or all) */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const branchId = req.nextUrl.searchParams.get('branch_id') || ''
  try {
    const result = branchId
      ? await pool.query(
          `SELECT bba.*, s.name AS branch_name
           FROM branch_bank_accounts bba
           JOIN salons s ON s.id = bba.branch_id
           WHERE bba.branch_id = $1
           ORDER BY bba.is_default DESC, bba.sort_order, bba.created_at`,
          [branchId]
        )
      : await pool.query(
          `SELECT bba.*, s.name AS branch_name
           FROM branch_bank_accounts bba
           JOIN salons s ON s.id = bba.branch_id
           ORDER BY s.name, bba.is_default DESC, bba.sort_order, bba.created_at`
        )
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('bank-accounts GET:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/* POST /api/bank-accounts — create */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { branch_id, bank_name, account_holder, iban, account_number, swift_code, currency, is_default, notes } = await req.json()
  if (!branch_id || !bank_name || !account_holder || !iban)
    return NextResponse.json({ error: 'branch_id, bank_name, account_holder, iban are required' }, { status: 400 })

  try {
    // If marking as default, clear existing default for this branch first
    if (is_default) {
      await pool.query(`UPDATE branch_bank_accounts SET is_default=FALSE WHERE branch_id=$1`, [branch_id])
    }
    const result = await pool.query(
      `INSERT INTO branch_bank_accounts
         (branch_id, bank_name, account_holder, iban, account_number, swift_code, currency, is_default, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [branch_id, bank_name, account_holder, iban, account_number || null, swift_code || null, currency || 'SAR', !!is_default, notes || null]
    )
    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    console.error('bank-accounts POST:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/* PUT /api/bank-accounts — update */
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, branch_id, bank_name, account_holder, iban, account_number, swift_code, currency, is_active, is_default, notes, sort_order } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    if (is_default && branch_id) {
      await pool.query(`UPDATE branch_bank_accounts SET is_default=FALSE WHERE branch_id=$1 AND id<>$2`, [branch_id, id])
    }
    const result = await pool.query(
      `UPDATE branch_bank_accounts SET
         bank_name=$1, account_holder=$2, iban=$3, account_number=$4,
         swift_code=$5, currency=$6, is_active=$7, is_default=$8,
         notes=$9, sort_order=$10, updated_at=now()
       WHERE id=$11 RETURNING *`,
      [bank_name, account_holder, iban, account_number || null, swift_code || null,
       currency || 'SAR', is_active !== false, !!is_default, notes || null, sort_order ?? 0, id]
    )
    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    console.error('bank-accounts PUT:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/* DELETE /api/bank-accounts */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await pool.query(`DELETE FROM branch_bank_accounts WHERE id=$1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('bank-accounts DELETE:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
