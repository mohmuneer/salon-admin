import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

const fallback = { name: 'صالون', name_en: 'Salon', logo_url: '', address: '', city: '', phone: '', email: '' }

function html(salon: typeof fallback, appt: any) {
  const total = Number(appt.total || appt.service_price || 0)
  const sp = Number(appt.service_price || 0)
  const pp = Number(appt.products_price || 0)
  const inv = `#${String(appt.id).slice(-8).toUpperCase()}`
  const date = new Date(appt.created_at || appt.date).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const time = (appt.start_time || '').slice(0, 5) || '--:--'
  const fmt = (n: number | string | null | undefined) =>
    Number(n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="utf-8">
<title>فاتورة - ${salon.name}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 80mm; margin: 0 auto; padding: 0;
    color: #000; font-size: 11px; line-height: 1.4;
    font-family: 'Courier New', 'Courier', 'Arial', sans-serif;
    direction: rtl;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .r { width: 74mm; margin: 3mm auto; }
  .c { text-align: center; }
  .hdr { text-align: center; margin-bottom: 4mm; }
  .hdr img { max-width: 60px; max-height: 60px; margin: 0 auto 2mm; display: block; }
  .hdr h1 { font-size: 16px; font-weight: 900; margin-bottom: 1mm; letter-spacing: 1px; }
  .hdr .s { font-size: 10px; color: #444; margin-bottom: 0.5mm; }
  .div { border-top: 1px dashed #555; margin: 3mm 0; }
  .tdiv { border-top: 2px solid #000; margin: 3mm 0; }
  .ir { display: flex; justify-content: space-between; padding: 0.5mm 0; font-size: 10px; }
  .ir .l { color: #555; }
  .ir .v { font-weight: 700; }
  .th { display: flex; justify-content: space-between; padding: 1mm 0; font-weight: 900; font-size: 10px; border-bottom: 1px solid #000; margin-bottom: 1mm; }
  .th .a { flex: 1; text-align: right; }
  .th .b { width: 10mm; text-align: center; }
  .th .c2 { width: 14mm; text-align: left; }
  .th .d { width: 16mm; text-align: left; }
  .tr { display: flex; justify-content: space-between; padding: 0.8mm 0; font-size: 10px; }
  .tr .a { flex: 1; text-align: right; }
  .tr .b { width: 10mm; text-align: center; }
  .tr .c2 { width: 14mm; text-align: left; }
  .tr .d { width: 16mm; text-align: left; }
  .sr { display: flex; justify-content: space-between; padding: 0.5mm 0; font-size: 10px; }
  .sr .v { font-weight: 700; }
  .gt { display: flex; justify-content: space-between; padding: 1.5mm 0; font-size: 14px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 2mm 0; }
  .ps { text-align: center; margin: 2mm 0; font-size: 10px; }
  .paid { color: #16a34a; font-weight: 900; }
  .ftr { text-align: center; margin-top: 4mm; padding-top: 3mm; border-top: 1px dashed #555; }
  .ftr p { margin: 0.5mm 0; font-size: 10px; }
  .tk { font-size: 12px; font-weight: 900; margin: 1mm 0; }
  .br { font-size: 9px; color: #555; margin-top: 1mm; }
  .bc { text-align: center; font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 1px; margin: 2mm 0; color: #333; }
</style>
</head>
<body>
<div class="r">
  <div class="hdr">
    ${salon.logo_url ? `<img src="${salon.logo_url}" onerror="this.style.display='none'" />` : ''}
    <h1>${salon.name}</h1>
    <div class="s">${salon.name_en}</div>
    ${salon.address ? `<div class="s">${salon.address}${salon.city ? `، ${salon.city}` : salon.city}</div>` : ''}
    ${salon.phone ? `<div class="s">${salon.phone}</div>` : ''}
    ${salon.email ? `<div class="s">${salon.email}</div>` : ''}
  </div>

  <div class="div"></div>

  <div class="ir"><span class="l">رقم الفاتورة</span><span class="v">${inv}</span></div>
  <div class="ir"><span class="l">التاريخ</span><span class="v">${date}</span></div>
  <div class="ir"><span class="l">الوقت</span><span class="v">${time}</span></div>
  <div class="ir"><span class="l">العميل</span><span class="v">${appt.customer_name}</span></div>
  <div class="ir"><span class="l">الموظف</span><span class="v">${appt.staff_name}</span></div>
  <div class="ir"><span class="l">طريقة الدفع</span><span class="v">نقداً</span></div>

  <div class="div"></div>

  <div class="th">
    <span class="a">الخدمة</span>
    <span class="b">العدد</span>
    <span class="c2">السعر</span>
    <span class="d">الإجمالي</span>
  </div>
  <div class="tr">
    <span class="a">${appt.service_name}</span>
    <span class="b">1</span>
    <span class="c2">${fmt(sp)}</span>
    <span class="d">${fmt(sp)}</span>
  </div>
  ${pp > 0 ? `<div class="tr"><span class="a">منتجات</span><span class="b">1</span><span class="c2">${fmt(pp)}</span><span class="d">${fmt(pp)}</span></div>` : ''}

  <div class="tdiv"></div>

  <div class="sr"><span>المجموع الفرعي</span><span class="v">${fmt(total)} ر.س</span></div>
  <div class="sr"><span>الخصم</span><span class="v">0.00 ر.س</span></div>
  <div class="sr"><span>الضريبة %15</span><span class="v">${fmt(Math.round(total * 0.15 * 100) / 100)} ر.س</span></div>

  <div class="gt"><span>الإجمالي النهائي</span><span>${fmt(total)} ر.س</span></div>

  <div class="sr"><span>المدفوع</span><span class="v">${fmt(total)} ر.س</span></div>
  <div class="sr"><span>المتبقي</span><span class="v">0.00 ر.س</span></div>

  <div class="ps"><span class="paid">مدفوع بالكامل</span></div>

  <div class="bc">${'*'.repeat(34)}</div>

  <div class="ftr">
    <p class="tk">شكراً لزيارتكم</p>
    <p>Thank You For Visiting Us</p>
    <p class="br">${salon.name} | ${salon.name_en}</p>
  </div>
</div>

<script>
  window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 300); };
<\/script>
</body>
</html>`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let salon = { ...fallback }
  try {
    const r = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    if (r.rows.length > 0) {
      const s = r.rows[0]
      salon = {
        name: s.name || fallback.name,
        name_en: s.name_en || fallback.name_en,
        logo_url: s.logo_url || '',
        address: s.address || '',
        city: s.city || '',
        phone: s.phone || '',
        email: s.email || '',
      }
    }
  } catch {}

  let appt: any = null
  try {
    const r = await pool.query(`
      SELECT a.*, u.name AS customer_name, s.name_ar AS service_name, st_u.name AS staff_name
      FROM appointments a
      JOIN users u ON u.id = a.customer_id
      JOIN services s ON s.id = a.service_id
      JOIN staff st ON st.id = a.staff_id
      JOIN users st_u ON st_u.id = st.user_id
      WHERE a.id = $1
    `, [id])
    if (r.rows.length > 0) appt = r.rows[0]
  } catch {}

  if (!appt) {
    return new NextResponse('<h1>الفاتورة غير موجودة</h1>', {
      status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const body = html(salon, appt)
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
