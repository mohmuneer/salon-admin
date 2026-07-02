'use client'
import Link from 'next/link'
import { Package, ShoppingBag } from 'lucide-react'

export default function StockAlerts({ data, isAr }: { data: any[]; isAr: boolean }) {
  return (
    <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(239,68,68,0.15)' }}>
      <div className="card-header" style={{ borderBottomColor: 'rgba(239,68,68,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isAr ? 'تنبيه المخزون' : 'Stock Alert'}
            <span style={{ fontSize: 11, fontWeight: 500, color: '#EF4444', background: '#FEF2F2', padding: '1px 7px', borderRadius: 10 }}>
              {data.length}
            </span>
          </h2>
        </div>
        <Link href="/inventory" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Package size={13} />
          {isAr ? 'المخزون' : 'Inventory'}
        </Link>
      </div>
      <div style={{ padding: '2px 0' }}>
        {data.slice(0, 4).map((p: any) => {
          const isCritical = p.current_stock <= 3
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: p.image_url ? 'transparent' : (isCritical ? '#FEF2F2' : '#FFFBEB'),
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                overflow: 'hidden',
              }}>
                {p.image_url ? (
                  <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ShoppingBag size={16} color={isCritical ? '#DC2626' : '#D97706'} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name_ar}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand || ''}</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: isCritical ? '#DC2626' : '#D97706' }}>{p.current_stock}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'متبقي' : 'left'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
