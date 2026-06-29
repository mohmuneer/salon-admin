import { unstable_noStore as noStore } from 'next/cache'
import pool from '@/lib/db'
import ReceiptPrintButton from '@/components/ReceiptPrintButton'

const fallbackSalon = {
  name: 'صالون', name_en: 'Salon', logo_url: '',
  address: '', city: '', phone: '', email: '',
}

async function getSalonSettings() {
  try {
    const r = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    if (r.rows.length > 0) {
      const s = r.rows[0]
      return {
        name: s.name || fallbackSalon.name,
        name_en: s.name_en || fallbackSalon.name_en,
        logo_url: s.logo_url || '',
        address: s.address || '',
        city: s.city || '',
        phone: s.phone || '',
        email: s.email || '',
      }
    }
  } catch {}
  return fallbackSalon
}

async function getAppointment(id: string) {
  try {
    const r = await pool.query(`
      SELECT a.id, a.date, a.start_time, a.end_time, a.status,
             a.service_price, a.products_price, a.total, a.notes, a.created_at,
             u.name AS customer_name, u.phone AS customer_phone,
             s.name_ar AS service_name,
             st_u.name AS staff_name
      FROM appointments a
      JOIN users u ON u.id = a.customer_id
      JOIN services s ON s.id = a.service_id
      JOIN staff st ON st.id = a.staff_id
      JOIN users st_u ON st_u.id = st.user_id
      WHERE a.id = $1
    `, [id])
    if (r.rows.length > 0) return r.rows[0]
  } catch {}
  return null
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function fmt(n: number | string | null | undefined) {
  return Number(n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params
  const salon = await getSalonSettings()
  const appt = await getAppointment(id)

  if (!appt) {
    return (
      <div style={{ textAlign: 'center', padding: 40, fontFamily: 'system-ui, sans-serif' }}>
        <h1>الفاتورة غير موجودة</h1>
        <p>عذراً، لم يتم العثور على الفاتورة المطلوبة.</p>
      </div>
    )
  }

  const total = Number(appt.total || appt.service_price || 0)
  const servicePrice = Number(appt.service_price || 0)
  const productsPrice = Number(appt.products_price || 0)
  const invoiceNum = `#${String(appt.id).slice(-8).toUpperCase()}`

  return (
    <>
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 80mm; margin: 0 auto; padding: 0; color: #000; font-size: 11px; line-height: 1.4; font-family: 'Courier New', 'Courier', 'Arial', sans-serif; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt { width: 74mm; margin: 3mm auto; }
        .center { text-align: center; }
        .header { text-align: center; margin-bottom: 4mm; }
        .header .logo { max-width: 60px; max-height: 60px; margin: 0 auto 2mm; display: block; }
        .header h1 { font-size: 16px; font-weight: 900; margin-bottom: 1mm; letter-spacing: 1px; }
        .header .sub { font-size: 10px; color: #444; margin-bottom: 0.5mm; }
        .divider { border-top: 1px dashed #555; margin: 3mm 0; }
        .thick-divider { border-top: 2px solid #000; margin: 3mm 0; }
        .info-row { display: flex; justify-content: space-between; padding: 0.5mm 0; font-size: 10px; }
        .info-row .label { color: #555; }
        .info-row .value { font-weight: 700; }
        .table-header { display: flex; justify-content: space-between; padding: 1mm 0; font-weight: 900; font-size: 10px; border-bottom: 1px solid #000; margin-bottom: 1mm; }
        .table-header .c1 { flex: 1; text-align: right; }
        .table-header .c2 { width: 10mm; text-align: center; }
        .table-header .c3 { width: 14mm; text-align: left; }
        .table-header .c4 { width: 16mm; text-align: left; }
        .table-row { display: flex; justify-content: space-between; padding: 0.8mm 0; font-size: 10px; }
        .table-row .c1 { flex: 1; text-align: right; }
        .table-row .c2 { width: 10mm; text-align: center; }
        .table-row .c3 { width: 14mm; text-align: left; }
        .table-row .c4 { width: 16mm; text-align: left; }
        .summary-row { display: flex; justify-content: space-between; padding: 0.5mm 0; font-size: 10px; }
        .summary-row .val { font-weight: 700; }
        .grand-total { display: flex; justify-content: space-between; padding: 1.5mm 0; font-size: 14px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 2mm 0; }
        .payment-status { text-align: center; margin: 2mm 0; font-size: 10px; }
        .paid { color: #16a34a; font-weight: 900; }
        .unpaid { color: #dc2626; font-weight: 900; }
        .footer { text-align: center; margin-top: 4mm; padding-top: 3mm; border-top: 1px dashed #555; }
        .footer p { margin: 0.5mm 0; font-size: 10px; }
        .thank { font-size: 12px; font-weight: 900; margin: 1mm 0; }
        .brand { font-size: 9px; color: #555; margin-top: 1mm; }
        .barcode { text-align: center; font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 1px; margin: 2mm 0; color: #333; }
        .print-btn { display: block; width: 100%; padding: 12px; background: #1A1A2E; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; margin: 16px 0 8px; }
        .no-print { display: block; }
        @media print {
          .no-print { display: none !important; }
          body { width: 80mm; margin: 0; padding: 0; }
          .receipt { width: 74mm; margin: 1mm auto; }
        }
        @media screen {
          body { background: #f5f5f5; padding: 20px 0; }
          .receipt { background: #fff; padding: 4mm 5mm; border-radius: 4px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
        }
      `}</style>

      <ReceiptPrintButton />

      <div className="receipt">
        {/* Header */}
        <div className="header">
          {salon.logo_url && (
            <img src={salon.logo_url} alt="Logo" className="logo"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <h1>{salon.name}</h1>
          <div className="sub">{salon.name_en}</div>
          {salon.address && <div className="sub">{salon.address}{salon.city ? `، ${salon.city}` : salon.city}</div>}
          {salon.phone && <div className="sub">{salon.phone}</div>}
          {salon.email && <div className="sub">{salon.email}</div>}
        </div>

        <div className="divider" />

        {/* Invoice Info */}
        <div className="info-row"><span className="label">رقم الفاتورة</span><span className="value">{invoiceNum}</span></div>
        <div className="info-row"><span className="label">التاريخ</span><span className="value">{formatDate(appt.created_at || appt.date)}</span></div>
        <div className="info-row"><span className="label">الوقت</span><span className="value">{appt.start_time?.slice(0, 5) || '--:--'}</span></div>
        <div className="info-row"><span className="label">العميل</span><span className="value">{appt.customer_name}</span></div>
        <div className="info-row"><span className="label">الموظف</span><span className="value">{appt.staff_name}</span></div>
        <div className="info-row"><span className="label">طريقة الدفع</span><span className="value">نقداً</span></div>

        <div className="divider" />

        {/* Services Table */}
        <div className="table-header">
          <span className="c1">الخدمة</span>
          <span className="c2">العدد</span>
          <span className="c3">السعر</span>
          <span className="c4">الإجمالي</span>
        </div>
        <div className="table-row">
          <span className="c1">{appt.service_name}</span>
          <span className="c2">1</span>
          <span className="c3">{fmt(servicePrice)}</span>
          <span className="c4">{fmt(servicePrice)}</span>
        </div>
        {productsPrice > 0 && (
          <div className="table-row">
            <span className="c1">منتجات</span>
            <span className="c2">1</span>
            <span className="c3">{fmt(productsPrice)}</span>
            <span className="c4">{fmt(productsPrice)}</span>
          </div>
        )}

        <div className="thick-divider" />

        {/* Summary */}
        <div className="summary-row">
          <span>المجموع الفرعي</span>
          <span className="val">{fmt(total)} ر.س</span>
        </div>
        <div className="summary-row">
          <span>الخصم</span>
          <span className="val">0.00 ر.س</span>
        </div>
        <div className="summary-row">
          <span>الضريبة %15</span>
          <span className="val">{fmt(Math.round(total * 0.15 * 100) / 100)} ر.س</span>
        </div>

        <div className="grand-total">
          <span>الإجمالي النهائي</span>
          <span>{fmt(total)} ر.س</span>
        </div>

        <div className="summary-row">
          <span>المدفوع</span>
          <span className="val">{fmt(total)} ر.س</span>
        </div>
        <div className="summary-row">
          <span>المتبقي</span>
          <span className="val">0.00 ر.س</span>
        </div>

        <div className="payment-status">
          <span className="paid">مدفوع بالكامل</span>
        </div>

        <div className="barcode">{'*'.repeat(34)}</div>

        {/* Footer */}
        <div className="footer">
          <p className="thank">شكراً لزيارتكم</p>
          <p>Thank You For Visiting Us</p>
          <p className="brand">{salon.name} | {salon.name_en}</p>
        </div>
      </div>
    </>
  )
}
