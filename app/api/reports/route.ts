import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
export const dynamic = 'force-dynamic'

// محرّك التسعير: يحسب المبلغ المتوقع لطلب واحد حسب قواعد الشركة
function calcExpectedForOrder(outboundShipments: any[], company: any) {
  const base = Number(company.base_price) || 0
  const baseWeight = Number(company.base_weight_kg) || 0
  const extraKg = Number(company.extra_kg_price) || 0
  const freeCount = Number(company.free_waybill_count) || 0
  const extraWaybill = Number(company.extra_waybill_price) || 0

  let total = 0
  outboundShipments.forEach((s, idx) => {
    if (freeCount > 0 && idx >= freeCount) {
      // بوليصة زائدة في نفس الطلب
      total += extraWaybill
    } else {
      // بوليصة ضمن المسموح: السعر الأساسي + رسوم الوزن الإضافي
      const w = Number(s.weight_kg) || 0
      const overWeight = Math.max(0, w - baseWeight)
      total += base + overWeight * extraKg
    }
  })
  return total
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')

  const { data: companies } = await getSupabaseAdmin().from('shipping_companies').select('*').eq('status', 'active')
  if (!companies) return NextResponse.json([])

  const targets = company ? companies.filter(c => c.name === company) : companies

  const reports = await Promise.all(targets.map(async (c) => {
    const { data: sallaShipments } = await getSupabaseAdmin().from('salla_shipments').select('*').eq('company_name', c.name)
    const { data: invoices } = await getSupabaseAdmin()
      .from('invoices').select('*, invoice_shipments(*), payments(*)')
      .eq('company_name', c.name).order('created_at', { ascending: false })

    const salla = sallaShipments || []
    const invs = invoices || []

    const sallaOut = salla.filter(s => s.type === 'outbound')
    const sallaRet = salla.filter(s => s.type === 'return')

    // تجميع الصادر حسب رقم الطلب وحساب المتوقع بمحرّك التسعير
    const byOrder: Record<string, any[]> = {}
    sallaOut.forEach(s => {
      const key = s.order_id || s.waybill
      if (!byOrder[key]) byOrder[key] = []
      byOrder[key].push(s)
    })
    let expectedOutbound = 0
    Object.values(byOrder).forEach(orderShipments => {
      expectedOutbound += calcExpectedForOrder(orderShipments, c)
    })
    const expectedReturns = sallaRet.length * (Number(c.return_price) || 0)
    const expectedAmount = expectedOutbound + expectedReturns

    // ما حسبته الشركة فعلياً من الفواتير
    const allShipments = invs.flatMap(inv => inv.invoice_shipments || [])
    const actualAmount = allShipments.reduce((sum: number, s: any) => sum + (Number(s.amount_charged) || 0), 0)
    const returnCost = allShipments.filter((s: any) => s.type === 'return').reduce((sum: number, s: any) => sum + (Number(s.amount_charged) || 0), 0)

    const totalPaid = invs.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0)
    const totalUnpaid = invs.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0)

    return {
      company: c,
      salla: { total: salla.length, outbound: sallaOut.length, return: sallaRet.length, orders: Object.keys(byOrder).length },
      financial: {
        expectedAmount,
        actualAmount,
        difference: expectedAmount - actualAmount,
        profit: expectedAmount >= actualAmount,
        returnCost,
        totalPaid,
        totalUnpaid,
      },
      invoices: invs,
    }
  }))

  return NextResponse.json(reports)
}
