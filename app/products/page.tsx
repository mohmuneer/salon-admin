'use client'
import React, { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import AddButton from '@/app/components/AddButton'
import PriceInput from '@/components/PriceInput'
import MediaGallery from '@/components/MediaGallery'
import { AlertTriangle, Upload, Pencil, Trash2, X, Check, Search, Layers, Image, Eye, Warehouse, Boxes } from 'lucide-react'

export default function ProductsPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const [products, setProducts] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [groupByDept, setGroupByDept] = useState(false)
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null)
  const [form, setForm] = useState({ name_ar:'', brand:'', category:'', price:0, cost:0, stock_qty:0, min_stock_alert:5, sold_in_store:true, used_in_sessions:false, image_url:'', department_id:'', group_id:'', currency_id:'', display_on_public:true, is_featured:false })
  const [productGallery, setProductGallery] = useState<any[]>([])
  const [editingGallery, setEditingGallery] = useState<any[]>([])

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()).catch(() => []),
      fetch('/api/product-groups').then(r => r.json()).catch(() => []),
      fetch('/api/currencies').then(r => r.json()).catch(() => []),
    ]).then(([prods, depts, grps, currs]) => {
      setProducts(Array.isArray(prods) ? prods : [])
      setDepartments(Array.isArray(depts) ? depts : [])
      setGroups(Array.isArray(grps) ? grps : [])
      setCurrencies(Array.isArray(currs) ? currs : [])
      const curArr = Array.isArray(currs) ? currs : []
      const def = curArr.find((c: any) => c.is_default)
      if (def) {
        setDefaultCurrency(def)
        if (!form.currency_id) setForm(f => ({ ...f, currency_id: def.id }))
      }
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const addProduct = async () => {
    const res = await fetch('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    if (productGallery.length > 0) {
      const newProduct = await fetch('/api/products').then(r => r.json())
      const lastId = Array.isArray(newProduct) ? newProduct[newProduct.length - 1]?.id : null
      if (lastId) {
        await fetch('/api/product-images', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ product_id: lastId, images: productGallery }) })
      }
    }
    setShowAdd(false); setProductGallery([])
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/products', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editForm) })
    if (editingGallery.length > 0 && editForm.id) {
      await fetch('/api/product-images', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ product_id: editForm.id, images: editingGallery }) })
    }
    setEditingId(null)
    setEditingGallery([])
    load()
  }

  const loadProductImages = async (productId: string, setter: (imgs: any[]) => void) => {
    try {
      const res = await fetch(`/api/product-images?product_id=${productId}`)
      const data = await res.json()
      setter(Array.isArray(data) ? data : [])
    } catch { setter([]) }
  }

  const deleteItem = async (id: string) => {
    if (!confirm(lang==='ar'?'هل أنت متأكد من حذف هذا المنتج؟':'Are you sure you want to delete this product?')) return
    await fetch('/api/products', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    load()
  }

  const getCurrency = (currencyId: string) => currencies.find(c => c.id === currencyId) || defaultCurrency || { symbol: 'ر.س', code: 'SAR' }

  const filtered = products.filter((p: any) => {
    if (departmentFilter && p.department_id !== departmentFilter) return false
    if (search && !p.name_ar.includes(search) && !(p.brand || '').includes(search) && !(p.category || '').includes(search)) return false
    return true
  })

  const grouped = groupByDept
    ? filtered.reduce((acc: any, p: any) => {
        const deptId = p.department_id || 'none'
        if (!acc[deptId]) acc[deptId] = { name: p.department_name || (lang==='ar'?'بدون قسم':'No Department'), products: [] }
        acc[deptId].products.push(p)
        return acc
      }, {})
    : null

  return (
    <div>
      <div className="page-header" style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:'var(--text)' }}>{tr.products}</h1>
        <AddButton onClick={() => { setShowAdd(true); if (defaultCurrency) setForm(f => ({ ...f, currency_id: defaultCurrency.id })) }} label={lang==='ar'?'إضافة منتج':'Add Product'} tooltip={lang==='ar'?'إضافة منتج جديد':'Add new product'} />
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header"><h2 style={{ fontSize:15, fontWeight:600 }}>{lang==='ar'?'إضافة منتج جديد':'Add New Product'}</h2></div>
          <div className="card-body">
            <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{lang==='ar'?'اسم المنتج (عربي)':'Product Name (Arabic)'} <span style={{color:'#EF4444'}}>*</span></label>
                <input className="input-field" type="text" value={form.name_ar}
                  onChange={e => setForm({ ...form, name_ar: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{tr.department} <span style={{color:'#EF4444'}}>*</span></label>
                <select className="input-field" value={form.department_id}
                  onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">{lang==='ar'?'اختر القسم':'Select Department'}</option>
                  {departments.filter((d:any) => d.is_active).map((d:any) => (
                    <option key={d.id} value={d.id}>{lang==='ar'?d.name_ar:(d.name_en||d.name_ar)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{lang==='ar'?'المجموعة':'Group'}</label>
                <select className="input-field" value={form.group_id}
                  onChange={e => setForm({ ...form, group_id: e.target.value })}>
                  <option value="">{lang==='ar'?'بدون مجموعة':'No Group'}</option>
                  {groups.filter((g:any) => g.is_active).map((g:any) => (
                    <option key={g.id} value={g.id}>{lang==='ar'?g.name_ar:(g.name_en||g.name_ar)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{tr.category}</label>
                <input className="input-field" type="text" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{tr.brand}</label>
                <input className="input-field" type="text" value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })} />
              </div>
              <PriceInput
                label={`${tr.price}`}
                value={form.price}
                onChange={v => setForm({ ...form, price: v })}
                currencySymbol={getCurrency(form.currency_id)?.symbol}
                required
              />
              <PriceInput
                label={lang==='ar'?'التكلفة':'Cost'}
                value={form.cost}
                onChange={v => setForm({ ...form, cost: v })}
                currencySymbol={getCurrency(form.currency_id)?.symbol}
              />
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{tr.stock}</label>
                <input className="input-field" type="number" min={0} value={form.stock_qty}
                  onChange={e => setForm({ ...form, stock_qty: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{lang==='ar'?'حد التنبيه':'Alert Threshold'}</label>
                <input className="input-field" type="number" min={0} value={form.min_stock_alert}
                  onChange={e => setForm({ ...form, min_stock_alert: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{lang==='ar'?'العملة':'Currency'}</label>
                <select className="input-field" value={form.currency_id}
                  onChange={e => setForm({ ...form, currency_id: e.target.value })}>
                  {currencies.filter((c:any) => c.is_active).map((c:any) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop:16 }}>
              <MediaGallery
                images={productGallery}
                onChange={setProductGallery}
                lang={lang}
                label={lang==='ar'?'صور المنتج (معرض)':'Product Images (Gallery)'}
                description={lang==='ar'?'ارفع صورة رئيسية ومعرض صور للمنتج. أول صورة يتم تعيينها كصورة رئيسية تلقائياً.' : 'Upload a primary image and gallery images. First image is set as primary automatically.'}
                showPrimary
                maxFiles={10}
              />
            </div>
            <div style={{ display:'flex', gap:20, marginTop:16, flexWrap:'wrap' }}>
              {[
                { key:'sold_in_store', label: lang==='ar'?'يباع في المتجر':'Sold in Store' },
                { key:'used_in_sessions', label: lang==='ar'?'يستخدم في الجلسات':'Used in Sessions' },
                { key:'display_on_public', label: lang==='ar'?'عرض بالموقع':'On Website' },
                { key:'is_featured', label: (lang==='ar'?'مميز':'Featured') + ' ⭐' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={(form as any)[key] === true}
                    onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn btn-primary" onClick={addProduct}>{tr.save}</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <Search size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', insetInlineStart:12, color:'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingInlineStart:36 }}
              placeholder={lang==='ar'?'بحث...':'Search...'} value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ width:160 }} value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">{lang==='ar'?'كل الأقسام':'All Departments'}</option>
            {departments.filter((d:any) => d.is_active).map((d:any) => (
              <option key={d.id} value={d.id}>{lang==='ar'?d.name_ar:(d.name_en||d.name_ar)}</option>
            ))}
          </select>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
            <input type="checkbox" checked={groupByDept} onChange={e => setGroupByDept(e.target.checked)} />
            {lang==='ar'?'تجميع حسب القسم':'Group by Dept'}
          </label>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang==='ar'?'صورة':'Image'}</th>
                <th>{tr.name}</th>
                <th>{tr.department}</th>
                <th>{lang==='ar'?'المجموعة':'Group'}</th>
                <th>{lang==='ar'?'المخزن':'Warehouse'}</th>
                <th>{tr.brand}</th>
                <th>{tr.category}</th>
                <th>{tr.price}</th>
                <th>{lang==='ar'?'التكلفة':'Cost'}</th>
                <th>{tr.stock}</th>
                <th>{lang==='ar'?'المتجر':'Store'}</th>
                <th>{lang==='ar'?'جلسات':'Sessions'}</th>
                <th>{tr.status}</th>
                <th>{lang==='ar'?'إجراءات':'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={14} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>{tr.loading}</td></tr>
              ) : !groupByDept ? (
                filtered.length === 0 ? (
                  <tr><td colSpan={14} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>{lang==='ar'?'لا توجد منتجات':'No products'}</td></tr>
                ) : filtered.map((p: any) => {
                  const lowStock = p.stock_qty <= p.min_stock_alert
                  const editing = editingId === p.id
                  const cur = getCurrency(p.currency_id)
                  return (
                    <tr key={p.id}>
                      <td style={{ position:'relative' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:'cover' }} />
                        ) : (
                          <div style={{ width:40, height:40, borderRadius:6, background:'#F1EDE4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🛍</div>
                        )}
                          {p.gallery_count > 1 && (
                            <span title={lang==='ar'?`${p.gallery_count} صورة`:`${p.gallery_count} images`} style={{ fontSize:10, background:'var(--primary-100)', color:'var(--primary-600)', borderRadius:8, padding:'1px 6px', fontWeight:600 }}>
                              <Image size={10} style={{ display:'inline' }} /> {p.gallery_count}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight:500 }}>
                        {editing ? (
                          <input type="text" className="input-field" style={{ width:120 }} value={editForm.name_ar}
                            onChange={e => setEditForm({ ...editForm, name_ar: e.target.value })} />
                        ) : p.name_ar}
                      </td>
                      <td style={{ color:'#6B7280', fontSize:13 }}>
                        {editing ? (
                          <select className="input-field" style={{ width:130 }} value={editForm.department_id||''}
                            onChange={e => setEditForm({ ...editForm, department_id: e.target.value })}>
                            <option value="">{lang==='ar'?'اختر القسم':'Select'}</option>
                            {departments.filter((d:any) => d.is_active).map((d:any) => (
                              <option key={d.id} value={d.id}>{lang==='ar'?d.name_ar:(d.name_en||d.name_ar)}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <Layers size={12} /> {p.department_name || (lang==='ar'?'—':'—')}
                          </span>
                        )}
                      </td>
                      <td style={{ color:'#6B7280', fontSize:13 }}>
                        {editing ? (
                          <select className="input-field" style={{ width:130 }} value={editForm.group_id||''}
                            onChange={e => setEditForm({ ...editForm, group_id: e.target.value })}>
                            <option value="">{lang==='ar'?'بدون مجموعة':'No Group'}</option>
                            {groups.filter((g:any) => g.is_active).map((g:any) => (
                              <option key={g.id} value={g.id}>{lang==='ar'?g.name_ar:(g.name_en||g.name_ar)}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <Boxes size={12} /> {p.group_name || '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ color:'#6B7280', fontSize:12 }}>
                        {(p.warehouses || []).length === 0 ? '—' : (
                          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                            {p.warehouses.map((w: any, i: number) => (
                              <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
                                <Warehouse size={12} />
                                {w.warehouse_name}
                                {w.warehouse_group_name && <span style={{ color:'var(--text-muted)' }}>({w.warehouse_group_name})</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ color:'#6B7280' }}>
                        {editing ? (
                          <input type="text" className="input-field" style={{ width:100 }} value={editForm.brand}
                            onChange={e => setEditForm({ ...editForm, brand: e.target.value })} />
                        ) : p.brand || '—'}
                      </td>
                      <td style={{ color:'#6B7280' }}>
                        {editing ? (
                          <input type="text" className="input-field" style={{ width:100 }} value={editForm.category}
                            onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                        ) : p.category || '—'}
                      </td>
                      <td style={{ fontWeight:600, color:'var(--gold)' }}>
                        {editing ? (
                          <PriceInput value={editForm.price} onChange={v => setEditForm({ ...editForm, price: v })}
                            currencySymbol={getCurrency(editForm.currency_id)?.symbol} className="input-field" />
                        ) : `${Number(p.price).toLocaleString()} ${cur.symbol}`}
                      </td>
                      <td style={{ color:'#6B7280' }}>
                        {editing ? (
                          <PriceInput value={editForm.cost} onChange={v => setEditForm({ ...editForm, cost: v })}
                            currencySymbol={getCurrency(editForm.currency_id)?.symbol} className="input-field" />
                        ) : `${Number(p.cost).toLocaleString()} ${cur.symbol}`}
                      </td>
                      <td>
                        {editing ? (
                          <input type="number" className="input-field" style={{ width:70 }} value={editForm.stock_qty}
                            onChange={e => setEditForm({ ...editForm, stock_qty: Number(e.target.value) })} />
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            {lowStock && <AlertTriangle size={14} color="#EF4444" />}
                            <span style={{ fontWeight:600, color: lowStock ? '#EF4444' : 'var(--text)' }}>{p.stock_qty}</span>
                          </div>
                        )}
                      </td>
                      <td>{p.sold_in_store ? '✓' : '—'}</td>
                      <td>{p.used_in_sessions ? '✓' : '—'}</td>
                      <td><span className={`badge ${p.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>{p.is_active ? tr.active : tr.inactive}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          {editing ? (
                            <>
                              <button className="btn btn-primary btn-sm" onClick={saveEdit} title={tr.save}><Check size={16} /></button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} title={tr.cancel}><X size={16} /></button>
                              <button className="btn btn-icon-danger btn-sm" onClick={() => deleteItem(p.id)} title={lang==='ar'?'حذف':'Delete'}><Trash2 size={16} /></button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-icon" onClick={() => { setEditingId(p.id); setEditForm({ id:p.id, name_ar:p.name_ar, brand:p.brand||'', category:p.category||'', price:p.price, cost:p.cost, stock_qty:p.stock_qty, min_stock_alert:p.min_stock_alert, sold_in_store:p.sold_in_store, used_in_sessions:p.used_in_sessions, image_url:p.image_url||'', is_active:p.is_active, department_id:p.department_id||'', group_id:p.group_id||'', currency_id:p.currency_id||(defaultCurrency?.id||''), display_on_public:p.display_on_public !== false, is_featured:p.is_featured === true }); loadProductImages(p.id, setEditingGallery) }} title={lang==='ar'?'تعديل':'Edit'}><Pencil size={16} /></button>
                              <button className="btn btn-icon-danger" onClick={() => deleteItem(p.id)} title={lang==='ar'?'حذف':'Delete'}><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                Object.entries(grouped || {}).map(([deptId, group]: [string, any]) => (
                  <React.Fragment key={`dept-${deptId}`}>
                    <tr style={{ background:'#F9F7F4' }}>
                      <td colSpan={14} style={{ padding:'10px 16px', fontWeight:700, fontSize:14, color:'var(--text)' }}>
                        <Layers size={16} style={{ verticalAlign:'middle', marginInlineEnd:8 }} />
                        {group.name} ({group.products.length})
                      </td>
                    </tr>
                    {group.products.map((p: any) => {
                      const lowStock = p.stock_qty <= p.min_stock_alert
                      const editing = editingId === p.id
                      const cur = getCurrency(p.currency_id)
                      return (
                        <tr key={p.id}>
                          <td>
                            {p.image_url ? (
                              <img src={p.image_url} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:'cover' }} />
                            ) : (
                              <div style={{ width:40, height:40, borderRadius:6, background:'#F1EDE4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🛍</div>
                            )}
                          </td>
                          <td style={{ fontWeight:500 }}>
                            {editing ? (
                              <input type="text" className="input-field" style={{ width:120 }} value={editForm.name_ar}
                                onChange={e => setEditForm({ ...editForm, name_ar: e.target.value })} />
                            ) : p.name_ar}
                          </td>
                          <td style={{ color:'#6B7280', fontSize:13 }}>
                            {editing ? (
                              <select className="input-field" style={{ width:130 }} value={editForm.department_id||''}
                                onChange={e => setEditForm({ ...editForm, department_id: e.target.value })}>
                                <option value="">{lang==='ar'?'اختر القسم':'Select'}</option>
                                {departments.filter((d:any) => d.is_active).map((d:any) => (
                                  <option key={d.id} value={d.id}>{lang==='ar'?d.name_ar:(d.name_en||d.name_ar)}</option>
                                ))}
                              </select>
                            ) : (
                              <Layers size={12} style={{ verticalAlign:'middle', marginInlineEnd:4 }} />
                            )}
                          </td>
                          <td style={{ color:'#6B7280', fontSize:13 }}>
                            {editing ? (
                              <select className="input-field" style={{ width:130 }} value={editForm.group_id||''}
                                onChange={e => setEditForm({ ...editForm, group_id: e.target.value })}>
                                <option value="">{lang==='ar'?'بدون مجموعة':'No Group'}</option>
                                {groups.filter((g:any) => g.is_active).map((g:any) => (
                                  <option key={g.id} value={g.id}>{lang==='ar'?g.name_ar:(g.name_en||g.name_ar)}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                                <Boxes size={12} /> {p.group_name || '—'}
                              </span>
                            )}
                          </td>
                          <td style={{ color:'#6B7280', fontSize:12 }}>
                            {(p.warehouses || []).length === 0 ? '—' : (
                              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                                {p.warehouses.map((w: any, i: number) => (
                                  <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
                                    <Warehouse size={12} />
                                    {w.warehouse_name}
                                    {w.warehouse_group_name && <span style={{ color:'var(--text-muted)' }}>({w.warehouse_group_name})</span>}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ color:'#6B7280' }}>
                            {editing ? (
                              <input type="text" className="input-field" style={{ width:100 }} value={editForm.brand}
                                onChange={e => setEditForm({ ...editForm, brand: e.target.value })} />
                            ) : p.brand || '—'}
                          </td>
                          <td style={{ color:'#6B7280' }}>
                            {editing ? (
                              <input type="text" className="input-field" style={{ width:100 }} value={editForm.category}
                                onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                            ) : p.category || '—'}
                          </td>
                          <td style={{ fontWeight:600, color:'var(--gold)' }}>
                            {editing ? (
                              <PriceInput value={editForm.price} onChange={v => setEditForm({ ...editForm, price: v })}
                                currencySymbol={getCurrency(editForm.currency_id)?.symbol} className="input-field" />
                            ) : `${Number(p.price).toLocaleString()} ${cur.symbol}`}
                          </td>
                          <td style={{ color:'#6B7280' }}>
                            {editing ? (
                              <PriceInput value={editForm.cost} onChange={v => setEditForm({ ...editForm, cost: v })}
                                currencySymbol={getCurrency(editForm.currency_id)?.symbol} className="input-field" />
                            ) : `${Number(p.cost).toLocaleString()} ${cur.symbol}`}
                          </td>
                          <td>
                            {editing ? (
                              <input type="number" className="input-field" style={{ width:70 }} value={editForm.stock_qty}
                                onChange={e => setEditForm({ ...editForm, stock_qty: Number(e.target.value) })} />
                            ) : (
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                {lowStock && <AlertTriangle size={14} color="#EF4444" />}
<span style={{ fontWeight:600, color: lowStock ? '#EF4444' : 'var(--text)' }}>{p.stock_qty}</span>
                              </div>
                            )}
                          </td>
                          <td>{p.sold_in_store ? '✓' : '—'}</td>
                          <td>{p.used_in_sessions ? '✓' : '—'}</td>
                          <td><span className={`badge ${p.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>{p.is_active ? tr.active : tr.inactive}</span></td>
                          <td>
                            <div style={{ display:'flex', gap:4 }}>
                              {editing ? (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={saveEdit} title={tr.save}><Check size={16} /></button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} title={tr.cancel}><X size={16} /></button>
                                  <button className="btn btn-icon-danger btn-sm" onClick={() => deleteItem(p.id)} title={lang==='ar'?'حذف':'Delete'}><Trash2 size={16} /></button>
                                </>
                              ) : (
                                <>
                              <button className="btn btn-icon" onClick={() => { setEditingId(p.id); setEditForm({ id:p.id, name_ar:p.name_ar, brand:p.brand||'', category:p.category||'', price:p.price, cost:p.cost, stock_qty:p.stock_qty, min_stock_alert:p.min_stock_alert, sold_in_store:p.sold_in_store, used_in_sessions:p.used_in_sessions, image_url:p.image_url||'', is_active:p.is_active, department_id:p.department_id||'', group_id:p.group_id||'', currency_id:p.currency_id||(defaultCurrency?.id||''), display_on_public:p.display_on_public !== false, is_featured:p.is_featured === true }); loadProductImages(p.id, setEditingGallery) }} title={lang==='ar'?'تعديل':'Edit'}><Pencil size={16} /></button>
                                  <button className="btn btn-icon-danger" onClick={() => deleteItem(p.id)} title={lang==='ar'?'حذف':'Delete'}><Trash2 size={16} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
