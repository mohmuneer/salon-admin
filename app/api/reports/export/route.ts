import { NextResponse, NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const { type, columns, rows, salonName } = await req.json()

  const headers = columns.filter((c: any) => c.key !== 'id')
  const headerLabels = headers.map((h: any) => h.labelAr || h.labelEn)

  const data = rows.map((row: any) => {
    const obj: Record<string, any> = {}
    headers.forEach((h: any) => {
      let val = row[h.key]
      if (h.type === 'currency' && val != null) val = Number(val)
      obj[h.labelAr || h.labelEn] = val ?? ''
    })
    return obj
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data, { header: headerLabels })

  ws['!cols'] = headers.map(() => ({ wch: 18 }))
  XLSX.utils.book_append_sheet(wb, ws, salonName || 'Report')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${type}-report.xlsx"`,
    },
  })
}
