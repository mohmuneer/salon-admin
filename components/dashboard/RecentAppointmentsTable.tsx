'use client'
import Link from 'next/link'
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import DataTable from '@/app/components/DataTable'
import ChartCard from './ChartCard'
import { AvatarLetter, StatusPill, StatusPillEn } from './shared'

export default function RecentAppointmentsTable({ data, isAr, GOLD }: { data: any[]; isAr: boolean; GOLD: string }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <div className="section-title">
          <span className="accent" />
          <Clock size={16} style={{ color: 'var(--primary)' }} />
          {isAr ? 'آخر المواعيد' : 'Recent Appointments'}
        </div>
        <Link href="/appointments" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
          {isAr ? 'عرض الكل' : 'View All'}
          {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </Link>
      </div>
      <DataTable>
          <thead>
            <tr>
              <th className="sticky-col" style={{ paddingInlineStart: 22 }}>{isAr ? 'العميل' : 'Customer'}</th>
              <th>{isAr ? 'الخدمة' : 'Service'}</th>
              <th>{isAr ? 'التاريخ' : 'Date'}</th>
              <th>{isAr ? 'الحالة' : 'Status'}</th>
              <th>{isAr ? 'المبلغ' : 'Amount'}</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((a: any, i: number) => (
              <tr key={a.id}>
                <td className="sticky-col" style={{ paddingInlineStart: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AvatarLetter name={a.customer_name} index={i} size={32} />
                    <span style={{ fontWeight: 500 }}>{a.customer_name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{a.service_name}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {new Date(a.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}
                </td>
                <td>{isAr ? <StatusPill status={a.status} /> : <StatusPillEn status={a.status} />}</td>
                <td style={{ fontWeight: 600, color: GOLD }}>
                  {Number(a.total || 0).toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                </td>
              </tr>
            ))}
          </tbody>
      </DataTable>
    </div>
  )
}
