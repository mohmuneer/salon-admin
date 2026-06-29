'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import {
  Building2, Plus, Pencil, Trash2, Check, X,
  Star, StarOff, Copy, CreditCard, Eye, EyeOff,
} from 'lucide-react'

const SAUDI_BANKS = [
  'البنك الأهلي السعودي', 'بنك الراجحي', 'مصرف الإنماء', 'بنك البلاد',
  'بنك الرياض', 'البنك العربي الوطني', 'بنك الجزيرة', 'بنك ساب',
  'البنك السعودي الفرنسي', 'بنك الخليج الدولي', 'STC Pay', 'أخرى',
]

interface Account {
  id: string
  branch_id: string
  branch_name: string
  bank_name: string
  account_holder: string
  iban: string
  account_number: string | null
  swift_code: string | null
  currency: string
  is_active: boolean
  is_default: boolean
  notes: string | null
  sort_order: number
}

const emptyForm = {
  branch_id: '', bank_name: '', account_holder: '', iban: '',
  account_number: '', swift_code: '', currency: 'SAR', is_default: false, notes: '',
}

export default function BankAccountsPage() {
  const { lang } = useLang()
  const ar = lang === 'ar'

  const [accounts,  setAccounts]  = useState<Account[]>([])
  const [branches,  setBranches]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filterBranch, setFilterBranch] = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [form,      setForm]      = useState({ ...emptyForm })
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editForm,  setEditForm]  = useState<any>({})
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [copiedId,  setCopiedId]  = useState<string | null>(null)
  const [showIban,  setShowIban]  = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    const url = filterBranch ? `/api/bank-accounts?branch_id=${filterBranch}` : '/api/bank-accounts'
    const d = await fetch(url).then(r => r.json())
    setAccounts(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(d => setBranches(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => { load() }, [filterBranch]) // eslint-disable-line

  const copyIban = (id: string, iban: string) => {
    navigator.clipboard.writeText(iban).catch(() => {})
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000)
  }

  const save = async () => {
    setError('')
    if (!form.branch_id || !form.bank_name || !form.account_holder || !form.iban) {
      setError(ar ? 'يرجى تعبئة الحقول المطلوبة' : 'Please fill required fields'); return
    }
    setSaving(true)
    const res = await fetch('/api/bank-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error || 'Error'); return }
    setShowAdd(false); setForm({ ...emptyForm }); load()
  }

  const saveEdit = async () => {
    setError('')
    setSaving(true)
    const res = await fetch('/api/bank-accounts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error || 'Error'); return }
    setEditId(null); load()
  }

  const del = async (id: string) => {
    if (!confirm(ar ? 'حذف هذا الحساب؟' : 'Delete this account?')) return
    await fetch('/api/bank-accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const setDefault = async (acc: Account) => {
    await fetch('/api/bank-accounts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...acc, is_default: true }),
    })
    load()
  }

  const toggleActive = async (acc: Account) => {
    await fetch('/api/bank-accounts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...acc, is_active: !acc.is_active }),
    })
    load()
  }

  /* Group by branch */
  const grouped: Record<string, { name: string; items: Account[] }> = {}
  accounts.forEach(a => {
    if (!grouped[a.branch_id]) grouped[a.branch_id] = { name: a.branch_name, items: [] }
    grouped[a.branch_id].items.push(a)
  })

  const maskIban = (iban: string, visible: boolean) =>
    visible ? iban : iban.slice(0, 4) + ' **** **** **** ' + iban.slice(-4)

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={22} />
          {ar ? 'الحسابات البنكية' : 'Bank Accounts'}
        </h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Branch filter */}
          <select
            className="input-field"
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="">{ar ? 'كل الفروع' : 'All Branches'}</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); setForm({ ...emptyForm }); setError('') }}>
            <Plus size={16} /> {ar ? 'إضافة حساب' : 'Add Account'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 24, border: '2px solid var(--primary)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{ar ? 'إضافة حساب بنكي جديد' : 'Add New Bank Account'}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}><X size={16} /></button>
          </div>
          <AccountForm form={form} setForm={setForm} branches={branches} banks={SAUDI_BANKS} lang={lang} />
          {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              <Check size={16} /> {saving ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : (ar ? 'حفظ' : 'Save')}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>{ar ? 'جارٍ التحميل...' : 'Loading...'}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <CreditCard size={48} color="var(--border)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            {ar ? 'لا توجد حسابات بنكية بعد' : 'No bank accounts yet'}
          </p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> {ar ? 'إضافة حساب' : 'Add Account'}
          </button>
        </div>
      ) : Object.entries(grouped).map(([branchId, { name, items }]) => (
        <div key={branchId} style={{ marginBottom: 28 }}>
          {/* Branch heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Building2 size={16} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--border)', padding: '2px 8px', borderRadius: 12 }}>
              {items.length} {ar ? 'حساب' : 'accounts'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(acc => (
              <div key={acc.id} className="card" style={{
                padding: 16,
                border: acc.is_default ? '2px solid var(--primary)' : acc.is_active ? '1px solid var(--border)' : '1px dashed var(--border)',
                opacity: acc.is_active ? 1 : 0.6,
              }}>
                {editId === acc.id ? (
                  /* ── Edit mode ── */
                  <div>
                    <AccountForm form={editForm} setForm={setEditForm} branches={branches} banks={SAUDI_BANKS} lang={lang} hidebranchSelect />
                    {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                        <Check size={14} /> {saving ? '...' : (ar ? 'حفظ' : 'Save')}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>
                        <X size={14} /> {ar ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{acc.bank_name}</span>
                          {acc.is_default && (
                            <span style={{ background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                              {ar ? 'افتراضي' : 'Default'}
                            </span>
                          )}
                          {!acc.is_active && (
                            <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                              {ar ? 'غير نشط' : 'Inactive'}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px 20px', fontSize: 13 }}>
                          <InfoRow label={ar ? 'اسم المستفيد' : 'Account Holder'} value={acc.account_holder} />
                          <InfoRow label={ar ? 'العملة' : 'Currency'} value={acc.currency} />
                          {acc.account_number && <InfoRow label={ar ? 'رقم الحساب' : 'Account No.'} value={acc.account_number} />}
                          {acc.swift_code && <InfoRow label="SWIFT" value={acc.swift_code} />}
                          {acc.notes && <InfoRow label={ar ? 'ملاحظات' : 'Notes'} value={acc.notes} />}
                        </div>

                        {/* IBAN row with mask/show + copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, background: 'var(--bg)', padding: '8px 12px', borderRadius: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>IBAN:</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--text)', direction: 'ltr', letterSpacing: 1 }}>
                            {maskIban(acc.iban, !!showIban[acc.id])}
                          </span>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowIban(p => ({ ...p, [acc.id]: !p[acc.id] }))}
                            title={ar ? 'إظهار / إخفاء' : 'Show / Hide'}
                          >
                            {showIban[acc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => copyIban(acc.id, acc.iban)}
                            title={ar ? 'نسخ الآيبان' : 'Copy IBAN'}
                          >
                            {copiedId === acc.id ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                        {!acc.is_default && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDefault(acc)}
                            title={ar ? 'تعيين كافتراضي' : 'Set as default'}
                          >
                            <Star size={14} />
                          </button>
                        )}
                        {acc.is_default && (
                          <span style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                            <StarOff size={14} color="var(--primary)" />
                          </span>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setEditId(acc.id); setEditForm({ ...acc }); setError('') }}
                          title={ar ? 'تعديل' : 'Edit'}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleActive(acc)}
                          title={acc.is_active ? (ar ? 'تعطيل' : 'Deactivate') : (ar ? 'تفعيل' : 'Activate')}
                        >
                          {acc.is_active
                            ? <X size={14} color="#EF4444" />
                            : <Check size={14} color="#10B981" />}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => del(acc.id)}
                          title={ar ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Sub-components ── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function AccountForm({ form, setForm, branches, banks, lang, hidebranchSelect }: {
  form: any; setForm: (f: any) => void
  branches: any[]; banks: string[]; lang: string; hidebranchSelect?: boolean
}) {
  const ar = lang === 'ar'
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {!hidebranchSelect && (
        <div>
          <label className="form-label">{ar ? 'الفرع *' : 'Branch *'}</label>
          <select className="input-field" value={form.branch_id} onChange={e => set('branch_id', e.target.value)}>
            <option value="">{ar ? 'اختر فرعاً' : 'Select branch'}</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="form-label">{ar ? 'البنك *' : 'Bank *'}</label>
        <select className="input-field" value={form.bank_name} onChange={e => set('bank_name', e.target.value)}>
          <option value="">{ar ? 'اختر البنك' : 'Select bank'}</option>
          {banks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">{ar ? 'اسم المستفيد *' : 'Account Holder *'}</label>
        <input className="input-field" value={form.account_holder} onChange={e => set('account_holder', e.target.value)} placeholder={ar ? 'الاسم كما في البنك' : 'Name as in bank'} />
      </div>
      <div style={{ gridColumn: '1/-1' }}>
        <label className="form-label">{ar ? 'الآيبان (IBAN) *' : 'IBAN *'}</label>
        <input className="input-field" value={form.iban} onChange={e => set('iban', e.target.value.toUpperCase())} placeholder="SA00 0000 0000 0000 0000 0000" dir="ltr" style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
      </div>
      <div>
        <label className="form-label">{ar ? 'رقم الحساب' : 'Account Number'}</label>
        <input className="input-field" value={form.account_number} onChange={e => set('account_number', e.target.value)} placeholder="0000000000" dir="ltr" />
      </div>
      <div>
        <label className="form-label">{ar ? 'رمز SWIFT' : 'SWIFT Code'}</label>
        <input className="input-field" value={form.swift_code} onChange={e => set('swift_code', e.target.value.toUpperCase())} placeholder="XXXXXXXX" dir="ltr" />
      </div>
      <div>
        <label className="form-label">{ar ? 'العملة' : 'Currency'}</label>
        <select className="input-field" value={form.currency} onChange={e => set('currency', e.target.value)}>
          {['SAR', 'USD', 'EUR', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">{ar ? 'ملاحظات' : 'Notes'}</label>
        <input className="input-field" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={ar ? 'اختياري' : 'Optional'} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: '1/-1' }}>
        <input type="checkbox" id="is_default" checked={!!form.is_default} onChange={e => set('is_default', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
        <label htmlFor="is_default" style={{ fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
          {ar ? 'تعيين كحساب افتراضي لهذا الفرع' : 'Set as default account for this branch'}
        </label>
      </div>
    </div>
  )
}
