import { NextResponse, NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { type, columns, rows, salonName, logo } = await req.json()
  const now = new Date()
  const dateStr = now.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })

  const formatVal = (val: any, col: any) => {
    if (val == null || val === '') return '—'
    if (col?.type === 'currency') return `${Number(val).toLocaleString()} ر.س`
    if (col?.type === 'date') return new Date(val).toLocaleDateString('ar-SA')
    return String(val)
  }

  const headers = columns
    .filter((c: any) => c.key !== 'id')
    .map((c: any) => ({ ...c, label: c.labelAr }))

  const html = `<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="utf-8">
<title>${type} - ${salonName || 'التقرير'}</title>
<style>
  @page { size: A4; margin: 1.5cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 20px; }
  .report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #c9a84c; }
  .report-header img { max-height: 70px; margin-bottom: 8px; }
  .report-header h1 { font-size: 20px; color: #c9a84c; margin-bottom: 4px; }
  .report-header .meta { font-size: 11px; color: #6b7280; }
  .report-title { font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 16px; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #c9a84c; color: #fff; padding: 8px 6px; font-size: 11px; text-align: center; font-weight: 600; }
  td { padding: 6px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
  tr:nth-child(even) { background: #f9fafb; }
  .summary { margin-top: 20px; padding-top: 12px; border-top: 2px solid #c9a84c; display: flex; justify-content: space-around; }
  .summary-item { text-align: center; }
  .summary-item .label { font-size: 10px; color: #6b7280; }
  .summary-item .value { font-size: 16px; font-weight: 700; color: #1a1a2e; }
  .footer { text-align: center; color: #9ca3af; font-size: 9px; margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
  <div class="report-header">
    ${logo ? `<img src="${logo}" alt="Logo">` : ''}
    <h1>${salonName || 'صالون جلامور'}</h1>
    <div class="meta">${dateStr}</div>
  </div>
  <div class="report-title">تقرير ${headers.find((h: any) => h.key === 'status')?.label || ''} ${type}</div>
  <table>
    <thead>
      <tr>${headers.map((h: any) => `<th>${h.label}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map((row: any) => `<tr>${headers.map((h: any) => `<td>${formatVal(row[h.key], h)}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">تم إنشاء هذا التقرير بواسطة نظام صالون جلامور للإدارة</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
