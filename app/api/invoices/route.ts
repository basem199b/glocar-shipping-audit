import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import * as XLSX from 'xlsx'

// ---- helpers ----

async function parseExcel(buffer: ArrayBuffer, waybillColumn: string, amountColumn: string, typeColumn: string) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  if (!rows.length) return { shipments: [], columns: [] }
  const columns = Object.keys(rows[0])
  const shipments = rows.map(row => ({
    waybill: String(row[waybillColumn] || row[columns[0]] || '').trim(),
    amount_charged: parseFloat(String(row[amountColumn] || row[columns[1]] || '0').replace(/[^\d.]/g, '')) || 0,
    type: String(row[typeColumn] || '').includes('مرتجع') || String(row[typeColumn] || '').toLowerCase().includes('return') ? 'return' : 'outbound',
  })).filter(s => s.waybill)
  return { shipments, columns }
}

async function parsePDF(buffer: ArrayBuffer): Promise<{ shipments: { waybill: string; amount_charged: number; type: string }[]; columns: string[] }> {
  const mod = await import('pdf-parse/lib/pdf-parse.js')
  const pdfParse = mod.default || mod
  const uint8 = new Uint8Array(buffer)
  const result = await pdfParse(Buffer.from(uint8))
  const text: string = result.text
  const lines = text.split(/\n/)
  const shipments: { waybill: string; amount_charged: number; type: string }[] = []
  for (const line of lines) {
    const waybillMatch = line.match(/\b(\d{8,})\b/)
    const amountMatch = line.match(/([\d,]+\.?\d*)/)
    if (waybillMatch) {
      const waybill = waybillMatch[1]
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0
      const isReturn = line.includes('مرتجع') || line.toLowerCase().includes('return')
      shipments.push({ waybill, amount_charged: amount, type: isReturn ? 'return' : 'outbound' })
    }
  }
  return { shipments, columns: ['waybill', 'amount'] }
}

// GET - جلب الفواتير
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')

  let query = supabaseAdmin
    .from('invoices')
    .select('*, invoice_shipments(*), payments(*)')
    .order('created_at', { ascending: false })

  if (company) query = query.eq('company_name', company)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST - رفع فاتورة شركة شحن
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const company_name = formData.get('company_name') as string
  const month = formData.get('month') as string
  const waybillColumn = formData.get('waybillColumn') as string || 'رقم البوليصة'
  const amountColumn = formData.get('amountColumn') as string || 'المبلغ'
  const typeColumn = formData.get('typeColumn') as string || 'النوع'

  if (!file || !company_name || !month) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const fileName = file.name.toLowerCase()
  const isPDF = fileName.endsWith('.pdf') || file.type === 'application/pdf'

  let shipments: { waybill: string; amount_charged: number; type: string }[] = []
  let columns: string[] = []
  let fileType = 'Excel'

  try {
    if (isPDF) {
      fileType = 'PDF'
      const parsed = await parsePDF(buffer)
      shipments = parsed.shipments
      columns = parsed.columns
    } else {
      const parsed = await parseExcel(buffer, waybillColumn, amountColumn, typeColumn)
      shipments = parsed.shipments
      columns = parsed.columns
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'تعذر قراءة الملف: ' + e.message }, { status: 400 })
  }

  if (!shipments.length) return NextResponse.json({ error: 'الملف فارغ أو لا توجد بوالص صالحة' }, { status: 400 })

  // كشف البوالص المكررة في فواتير سابقة
  const waybills = shipments.map(s => s.waybill)
  const { data: duplicates } = await supabaseAdmin
    .from('invoice_shipments')
    .select('waybill, invoice_id, invoices(month, company_name)')
    .in('waybill', waybills)

  const duplicateMap: Record<string, string> = {}
  if (duplicates) {
    duplicates.forEach((d: any) => {
      duplicateMap[d.waybill] = d.invoices?.month || 'سابق'
    })
  }

  const duplicateList = shipments
    .filter(s => duplicateMap[s.waybill])
    .map(s => ({ waybill: s.waybill, found_in_month: duplicateMap[s.waybill] }))

  const total_amount = shipments.reduce((sum, s) => sum + s.amount_charged, 0)

  // إنشاء الفاتورة
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .insert({ company_name, month, file_name: file.name, total_amount })
    .select()
    .single()

  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

  // حفظ شحنات الفاتورة
  const invoiceShipments = shipments.map(s => ({ ...s, invoice_id: invoice.id }))
  const { error: shipmentsError } = await supabaseAdmin
    .from('invoice_shipments')
    .insert(invoiceShipments)

  if (shipmentsError) return NextResponse.json({ error: shipmentsError.message }, { status: 500 })

  return NextResponse.json({
    invoice,
    total_shipments: shipments.length,
    total_amount,
    duplicates: duplicateList,
    columns,
    fileType,
  })
}
