import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
export const dynamic = 'force-dynamic'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')
  let query = getSupabaseAdmin().from('salla_shipments').select('*').order('uploaded_at', { ascending: false })
  if (company) query = query.eq('company_name', company)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const waybillColumn = (formData.get('waybillColumn') as string) || 'رقم التتبع'
  const companyColumn = (formData.get('companyColumn') as string) || 'شركة الشحن'
  const orderColumn = (formData.get('orderColumn') as string) || 'رقم الطلب'
  const weightColumn = (formData.get('weightColumn') as string) || 'الوزن'
  const typeColumn = (formData.get('typeColumn') as string) || 'نوع الشحنة'

  if (!file) return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  if (!rows.length) return NextResponse.json({ error: 'الملف فارغ' }, { status: 400 })

  const columns = Object.keys(rows[0])
  const findCol = (preferred: string, keywords: string[]) => {
    if (columns.includes(preferred)) return preferred
    return columns.find(c => keywords.some(k => c.includes(k))) || ''
  }
  const wCol = findCol(waybillColumn, ['تتبع', 'بوليصة', 'بوليص', 'waybill', 'tracking'])
  const cCol = findCol(companyColumn, ['شركة', 'شحن', 'ناقل', 'carrier', 'company'])
  const oCol = findCol(orderColumn, ['طلب', 'order'])
  const gCol = findCol(weightColumn, ['وزن', 'weight', 'kg', 'كيلو'])
  const tCol = findCol(typeColumn, ['نوع', 'حالة', 'type', 'status'])

  const batch = new Date().toISOString()
  const shipments = rows.map(row => ({
    waybill: String(row[wCol] || row[columns[0]] || '').trim(),
    order_id: String(row[oCol] || '').trim(),
    company_name: String(row[cCol] || 'غير محدد').trim(),
    weight_kg: parseFloat(String(row[gCol] || '0').replace(/[^\d.]/g, '')) || 0,
    type: (String(row[tCol] || '').includes('مرتجع') || String(row[tCol] || '').includes('مسترجع') || String(row[tCol] || '').toLowerCase().includes('return')) ? 'return' : 'outbound',
    upload_batch: batch,
  })).filter(s => s.waybill)

  const grouped: Record<string, number> = {}
  shipments.forEach(s => { grouped[s.company_name] = (grouped[s.company_name] || 0) + 1 })

  const { error } = await getSupabaseAdmin().from('salla_shipments').insert(shipments)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    total: shipments.length,
    grouped,
    columns,
    detected: { waybill: wCol, company: cCol, order: oCol, weight: gCol, type: tCol },
  })
}
