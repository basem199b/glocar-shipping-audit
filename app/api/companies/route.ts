import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('shipping_companies')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, id } = body

  if (action === 'add' || action === 'update') {
    const payload = {
      name: body.name,
      base_price: body.base_price || 0,
      base_weight_kg: body.base_weight_kg || 0,
      extra_kg_price: body.extra_kg_price || 0,
      return_price: body.return_price || 0,
      free_waybill_count: body.free_waybill_count || 0,
      extra_waybill_price: body.extra_waybill_price || 0,
      notes: body.notes || '',
    }
    if (action === 'add') {
      const { data, error } = await getSupabaseAdmin().from('shipping_companies').insert(payload).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    } else {
      const { data, error } = await getSupabaseAdmin().from('shipping_companies').update(payload).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
  }
  if (action === 'delete') {
    const { error } = await getSupabaseAdmin().from('shipping_companies').update({ status: 'deleted' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }
  if (action === 'restore') {
    const { error } = await getSupabaseAdmin().from('shipping_companies').update({ status: 'active' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
}
