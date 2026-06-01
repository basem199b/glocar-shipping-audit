import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import * as XLSX from 'xlsx'

// GET - جلب شحنات سلة
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')
  const companyName = searchParams.get('company') // backward compat

  let query = supabaseAdmin
    .from('salla_shipments')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)
  else if (companyName) query = query.eq('company_name', companyName)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST - رفع ملف سلة Excel وتحليله
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const companyColumn = (formData.get('companyColumn') as string) || 'شركة الشحن'
  const waybillColumn = (formData.get('waybillColumn') as string) || 'رقم التتبع'
  const orderColumn = (formData.get('orderColumn') as string) || 'رقم الطلب'
  const typeColumn = (formData.get('typeColumn') as string) || 'نوع الشحنة'

  if (!file) return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (!rows.length) return NextResponse.json({ error: 'الملف فارغ' }, { status: 400 })

  const columns = Object.keys(rows[0])
  const batch = new Date().toISOString()

  // بناء الشحنات من الملف
  const rawShipments = rows.map(row => ({
    waybill: String(row[waybillColumn] || row[columns[0]] || '').trim(),
    order_id: String(row[orderColumn] || '').trim(),
    company_name: String(row[companyColumn] || 'غير محدد').trim(),
    type:
      String(row[typeColumn] || '').includes('مرتجع') ||
      String(row[typeColumn] || '').includes('return')
        ? 'return'
        : 'outbound',
    upload_batch: batch,
  })).filter(s => s.waybill)

  // جلب company_id لكل شركة مذكورة في الملف
  const distinctNames = [...new Set(rawShipments.map(s => s.company_name))]
  const { data: companies } = await supabaseAdmin
    .from('shipping_companies')
    .select('id, name')
    .in('name', distinctNames)

  const nameToId: Record<string, string> = {}
  if (companies) {
    companies.forEach((c: { id: string; name: string }) => {
      nameToId[c.name] = c.id
    })
  }

  // إضافة company_id لكل شحنة
  const shipments = rawShipments.map(s => ({
    ...s,
    company_id: nameToId[s.company_name] || null,
  }))

  // تجميع للعرض
  const grouped: Record<string, number> = {}
  shipments.forEach(s => {
    grouped[s.company_name] = (grouped[s.company_name] || 0) + 1
  })

  // حفظ في قاعدة البيانات
  const { error } = await supabaseAdmin.from('salla_shipments').insert(shipments)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    total: shipments.length,
    grouped,
    columns,
    batch,
    unregistered: distinctNames.filter(n => !nameToId[n]),
  })
}
