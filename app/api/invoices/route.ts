import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
export const dynamic = 'force-dynamic'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')
  let query = getSupabaseAdmin().from('invoices').select('*, invoice_shipments(*), payments(*)').order('created_at', { ascending: false })
  if (company) query = query.eq('company_name', company)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const company_name = formData.get('company_name') as string
  const month = formData.get('month') as string
  const waybillColumn = (formData.get('waybillColumn') as string) || 'رقم البوليصة'
  const amountColumn = (formData.get('amountColumn') as string) || 'المبلغ'
  const typeColumn = (formData.get('typeColumn') as string) || 'النوع'

  if (!file || !company_name || !month)
    return NextResponse.json({ error: 'بيانات ناقصة: ملف، شركة، شهر' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  if (!rows.length) return NextResponse.json({ error: 'الملف فارغ' }, { status: 400 })

  const columns = Object.keys(rows[0])
  const shipments = rows.map(row => ({
    waybill: String(row[waybillColumn] || row[columns[0]] || '').trim(),
    amount_charged: parseFloat(String(row[amountColumn] || row[columns[1]] || '0').replace(/[^\d.]/g, '')) || 0,
    type: (String(row[typeColumn] || '').includes('مرتجع') || String(row[typeColumn] || '').toLowerCase().includes('return')) ? 'return' : 'outbound',
  })).filter(s => s.waybill)

  // كشف البوالص المكررة
  const waybills = shipments.map(s => s.waybill)
  const { data: duplicates } = await getSupabaseAdmin()
    .from('invoice_shipments')
    .select('waybill, invoice_id, invoices(month, company_name)')
    .in('waybill', waybills)

  const duplicateMap: Record<string, string> = {}
  if (duplicates) {
    duplicates.forEach((d: any) => {
      duplicateMap[d.waybill] = d.invoices?.month || 'فاتورة سابقة'
    })
  }
  const duplicateList = shipments.filter(s => duplicateMap[s.waybill]).map(s => ({ waybill: s.waybill, found_in_month: duplicateMap[s.waybill] }))

  const total_amount = shipments.reduce((sum, s) => sum + s.amount_charged, 0)

  const { data: invoice, error: invoiceError } = await getSupabaseAdmin()
    .from('invoices')
    .insert({ company_name, month, file_name: file.name, total_amount })
    .select().single()
  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

  const { error: shipmentsError } = await getSupabaseAdmin()
    .from('invoice_shipments')
    .insert(shipments.map(s => ({ ...s, invoice_id: invoice.id })))
  if (shipmentsError) return NextResponse.json({ error: shipmentsError.message }, { status: 500 })

  return NextResponse.json({ invoice, total_shipments: shipments.length, total_amount, duplicates: duplicateList, columns })
}
