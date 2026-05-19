import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { invoice_id, receipt_file_name, amount, action } = body

  if (action === 'pay') {
    await getSupabaseAdmin().from('invoices').update({ status: 'paid' }).eq('id', invoice_id)
    const { data, error } = await getSupabaseAdmin().from('payments')
      .upsert({ invoice_id, receipt_file_name, amount, paid_at: new Date().toISOString().slice(0, 10) }, { onConflict: 'invoice_id' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
  if (action === 'unpay') {
    await getSupabaseAdmin().from('invoices').update({ status: 'unpaid' }).eq('id', invoice_id)
    await getSupabaseAdmin().from('payments').delete().eq('invoice_id', invoice_id)
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
}
