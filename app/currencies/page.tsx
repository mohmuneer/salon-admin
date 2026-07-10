'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { Plus, Pencil, Trash2, X, Check, DollarSign, Star } from 'lucide-react'
import DataTable from '@/app/components/DataTable'

interface Currency {
  id: string
  name: string
  code: string
  symbol: string
  exchange_rate: number
  decimal_places: number
  is_active: boolean
  is_default: boolean
}

const emptyForm = { name: '', code: '', symbol: '', exchange_rate: 1, decimal_places: 2, is_default: false }

export default function CurrenciesPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    setLoading(true)
    fetch('/api/currencies').then(r => r.json()).then(d => { setCurrencies(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const addCurrency = async () => {
    await fetch('/api/currencies', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    setShowAdd(false)
    setForm(emptyForm)
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/currencies', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editForm) })
    setEditingId(null)
    load()
  }

  const startEdit = (c: Currency) => {
    setEditingId(c.id)
    setEditForm({
      id: c.id,
      name: c.name,
      code: c.code,
      symbol: c.symbol,
      exchange_rate: c.exchange_rate,
      decimal_places: c.decimal_places,
      is_active: c.is_active,
      is_default: c.is_default,
    })
  }

  const deleteCurrency = async (id: string) => {
    if (!confirm(lang==='ar'?'هل أنت متأكد من حذف هذه العملة؟':'Are you sure you want to delete this currency?')) return
    const res = await fetch('/api/currencies', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Error')
      return
    }
    load()
  }

  const toggleDefault = async (c: Currency) => {
    if (c.is_default) return
    await fetch('/api/currencies', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...c, is_default: true }) })
    load()
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:'#1A1A2E' }}>{lang==='ar'?'العملات':'Currencies'}</h1>
        <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); setForm(emptyForm) }}>
          <Plus size={16} /> {lang==='ar'?'إضافة عملة':'Add Currency'}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header"><h2 style={{ fontSize:15, fontWeight:600 }}>{lang==='ar'?'إضافة عملة جديدة':'Add New Currency'}</h2></div>
          <div className="card-body">
            <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              {[
                { label: lang==='ar'?'اسم العملة':'Currency Name', key:'name', type:'text' },
                { label: lang==='ar'?'الكود':'Code', key:'code', type:'text', placeholder:'SAR' },
                { label: lang==='ar'?'الرمز':'Symbol', key:'symbol', type:'text', placeholder:'ر.س' },
                { label: lang==='ar'?'سعر الصرف':'Exchange Rate', key:'exchange_rate', type:'number', step:'0.000001' },
                { label: lang==='ar'?'الخانات العشرية':'Decimal Places', key:'decimal_places', type:'number' },
              ].map(({ label, key, type, placeholder, step }) => (
                <div key={key}>
                  <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{label}</label>
                  <input className="input-field" type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: type==='number' ? Number(e.target.value) : e.target.value })}
                    placeholder={placeholder} step={step} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{lang==='ar'?'العملة الافتراضية':'Default Currency'}</label>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                  <input type="checkbox" checked={form.is_default}
                    onChange={e => setForm({ ...form, is_default: e.target.checked })} />
                  {lang==='ar'?'تعيين كافتراضي':'Set as default'}
                </label>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn btn-primary" onClick={addCurrency}>{tr.save}</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <DataTable>
          <table className="data-table">
            <thead>
              <tr>
                <th className="sticky-col">{lang==='ar'?'اسم العملة':'Name'}</th>
                <th>{lang==='ar'?'الكود':'Code'}</th>
                <th>{lang==='ar'?'الرمز':'Symbol'}</th>
                <th>{lang==='ar'?'سعر الصرف':'Rate'}</th>
                <th>{lang==='ar'?'الخانات العشرية':'Decimals'}</th>
                <th>{lang==='ar'?'افتراضي':'Default'}</th>
                <th>{tr.status}</th>
                <th className="sticky-col-right">{lang==='ar'?'الإجراءات':'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>{tr.loading}</td></tr>
              ) : currencies.map(c => {
                const editing = editingId === c.id
                return (
                  <tr key={c.id}>
                    <td className="sticky-col" style={{ fontWeight:600 }}>
                      {editing ? (
                        <input className="input-field" style={{ width:140 }} value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                      ) : c.name}
                    </td>
                    <td>
                      {editing ? (
                        <input className="input-field" style={{ width:80 }} value={editForm.code}
                          onChange={e => setEditForm({ ...editForm, code: e.target.value })} />
                      ) : <span style={{ fontFamily:'monospace', fontWeight:700 }}>{c.code}</span>}
                    </td>
                    <td>
                      {editing ? (
                        <input className="input-field" style={{ width:80 }} value={editForm.symbol}
                          onChange={e => setEditForm({ ...editForm, symbol: e.target.value })} />
                      ) : <span style={{ fontSize:18, fontWeight:700 }}>{c.symbol}</span>}
                    </td>
                    <td>
                      {editing ? (
                        <input className="input-field" style={{ width:100 }} type="number" step="0.000001" value={editForm.exchange_rate}
                          onChange={e => setEditForm({ ...editForm, exchange_rate: Number(e.target.value) })} />
                      ) : Number(c.exchange_rate).toFixed(4)}
                    </td>
                    <td>
                      {editing ? (
                        <input className="input-field" style={{ width:60 }} type="number" value={editForm.decimal_places}
                          onChange={e => setEditForm({ ...editForm, decimal_places: Number(e.target.value) })} />
                      ) : c.decimal_places}
                    </td>
                    <td>
                      {editing ? (
                        <label style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <input type="checkbox" checked={editForm.is_default}
                            onChange={e => setEditForm({ ...editForm, is_default: e.target.checked })} />
                        </label>
                      ) : c.is_default ? (
                        <span style={{ color:'var(--gold)' }}><Star size={16} fill="var(--gold)" /></span>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleDefault(c)}
                          title={lang==='ar'?'تعيين كافتراضي':'Set as default'}>
                          <Star size={14} />
                        </button>
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <select className="input-field" style={{ width:90 }} value={editForm.is_active ? 'true' : 'false'}
                          onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}>
                          <option value="true">{tr.active}</option>
                          <option value="false">{tr.inactive}</option>
                        </select>
                      ) : (
                        <span className={`badge ${c.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                          {c.is_active ? tr.active : tr.inactive}
                        </span>
                      )}
                    </td>
                    <td className="sticky-col-right">
                      <div className="action-buttons">
                        {editing ? (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={16} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-icon" onClick={() => startEdit(c)} title={tr.edit}>
                              <Pencil size={16} />
                            </button>
                            {!c.is_default && (
                              <button className="btn btn-icon-danger" onClick={() => deleteCurrency(c.id)} title={tr.delete}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTable>
      </div>
    </div>
  )
}
