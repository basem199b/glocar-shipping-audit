import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// خوارزمية حساب تكلفة الشحنات الصادرة لطلب واحد
function calcExpectedForOrder(outboundShipments: any[], company: any) {
  const base = Number(company.base_price) || Number(company.agreed_price_outbound) || 0
  const baseWeight = Number(company.base_weight_kg) || 0
  const extraKg = Number(company.extra_kg_price) || 0
  const freeCount = Number(company.free_waybill_count) || 0
  const extraWaybill = Number(company.extra_waybill_price) || 0

  let total = 0
  outboundShipments.forEach((s, idx) => {
    if (freeCount > 0 && idx >= freeCount) {
      total += extraWaybill
    } else {
      const w = Number(s.weight_kg) || 0
      const overWeight = Math.max(0, w - baseWeight)
      total += base + overWeight * extraKg
    }
  })
  return total
}

// خوارزمية حساب تكلفة شحنة مسترجعة واحدة (مع وزن)
function calcReturnShipment(shipment: any, company: any): number {
  const base = Number(company.return_price) || Number(company.agreed_price_return) || 0
  const baseWeight = Number(company.return_base_weight_kg) || 0
  const extraKg = Number(company.return_extra_kg_price) || 0

  // إذا لم يُضبَط تسعير الوزن للمسترجع → السعر الثابت فقط
  if (baseWeight === 0 && extraKg === 0) return base

  const w = Number(shipment.weight_kg) || 0
  const overWeight = Math.max(0, w - baseWeight)
  return base + overWeight * extraKg
}

// GET - تقارير شاملة لكل شركة
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')
  const companyName = searchParams.get('company') // backward compat

  const { data: companies } = await supabaseAdmin
    .from('shipping_companies')
    .select('*')
    .eq('status', 'active')

  if (!companies) return NextResponse.json([])

  let targetCompanies = companies
  if (companyId) {
    targetCompanies = companies.filter((c: any) => c.id === companyId)
  } else if (companyName) {
    targetCompanies = companies.filter((c: any) => c.name === companyName)
  }

  const reports = await Promise.all(
    targetCompanies.map(async (c: any) => {
      // شحنات سلة — بالأولوية company_id ثم company_name
      const { data: sallaById } = await supabaseAdmin
        .from('salla_shipments')
        .select('*')
        .eq('company_id', c.id)

      let sallaShipments = sallaById || []
      if (!sallaShipments.length) {
        const { data: sallaByName } = await supabaseAdmin
          .from('salla_shipments')
          .select('*')
          .eq('company_name', c.name)
        sallaShipments = sallaByName || []
      }

      // فواتير الشركة
      const { data: invoicesById } = await supabaseAdmin
        .from('invoices')
        .select('*, invoice_shipments(*), payments(*)')
        .eq('company_id', c.id)
        .order('created_at', { ascending: false })

      let invoices = invoicesById || []
      if (!invoices.length) {
        const { data: invoicesByName } = await supabaseAdmin
          .from('invoices')
          .select('*, invoice_shipments(*), payments(*)')
          .eq('company_name', c.name)
          .order('created_at', { ascending: false })
        invoices = invoicesByName || []
      }

      const sallaOutbound = sallaShipments.filter((s: any) => s.type === 'outbound')
      const sallaReturn = sallaShipments.filter((s: any) => s.type === 'return')

      // ── المبلغ المتوقع للصادر (مجمَّع حسب الطلب) ─────────────────────
      const orderMap: Record<string, any[]> = {}
      sallaOutbound.forEach((s: any) => {
        const key = s.order_id || s.waybill
        if (!orderMap[key]) orderMap[key] = []
        orderMap[key].push(s)
      })

      let expectedOutbound = 0
      Object.values(orderMap).forEach(orderShipments => {
        expectedOutbound += calcExpectedForOrder(orderShipments, c)
      })

      // ── المبلغ المتوقع للمسترجع (مع حساب الوزن الزائد) ───────────────
      let expectedReturn = 0
      sallaReturn.forEach((s: any) => {
        expectedReturn += calcReturnShipment(s, c)
      })

      const expectedAmount = expectedOutbound + expectedReturn

      // ── ما حسبته الشركة فعلياً (من الفواتير) ─────────────────────────
      const allInvoiceShipments = invoices.flatMap((inv: any) => inv.invoice_shipments || [])
      const actualAmount = allInvoiceShipments.reduce(
        (sum: number, s: any) => sum + (s.amount_charged || 0),
        0,
      )

      // ── تكلفة المسترجعات (من الفواتير) ────────────────────────────────
      const returnShipments = allInvoiceShipments.filter((s: any) => s.type === 'return')
      const returnCost = returnShipments.reduce(
        (sum: number, s: any) => sum + (s.amount_charged || 0),
        0,
      )

      const difference = expectedAmount - actualAmount

      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid')
      const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'unpaid')
      const totalPaid = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)
      const totalUnpaid = unpaidInvoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)

      return {
        company: c,
        salla: {
          total: sallaShipments.length,
          outbound: sallaOutbound.length,
          return: sallaReturn.length,
        },
        financial: {
          expectedAmount,
          expectedOutbound,
          expectedReturn,
          actualAmount,
          difference,
          profit: difference >= 0,
          returnCost,
          totalPaid,
          totalUnpaid,
        },
        invoices,
      }
    }),
  )

  return NextResponse.json(reports)
}
