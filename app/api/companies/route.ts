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

  // ─── إضافة أو تعديل ────────────────────────────────────────────────
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
      const { data, error } = await getSupabaseAdmin()
        .from('shipping_companies')
        .insert(payload)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    } else {
      const { data, error } = await getSupabaseAdmin()
        .from('shipping_companies')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
  }

  // ─── حذف ─────────────────────────────────────────────────────────────
  if (action === 'delete') {
    const supabase = getSupabaseAdmin()

    // 1. جلب اسم الشركة (نحتاجه للتحقق بالاسم كـ fallback)
    const { data: company, error: fetchErr } = await supabase
      .from('shipping_companies')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchErr || !company) {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 })
    }

    // 2. فحص الشحنات المرتبطة (company_id أو company_name)
    const { count: sallaCount, error: sallaErr } = await supabase
      .from('salla_shipments')
      .select('id', { count: 'exact', head: true })
      .or(`company_id.eq.${id},company_name.eq.${company.name}`)

    if (sallaErr) {
      return NextResponse.json({ error: sallaErr.message }, { status: 500 })
    }

    // 3. فحص الفواتير المرتبطة (company_id أو company_name)
    const { count: invoicesCount, error: invoicesErr } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .or(`company_id.eq.${id},company_name.eq.${company.name}`)

    if (invoicesErr) {
      return NextResponse.json({ error: invoicesErr.message }, { status: 500 })
    }

    const hasLinkedData = (sallaCount ?? 0) > 0 || (invoicesCount ?? 0) > 0

    // 4. إذا توجد بيانات → ارفض الحذف نهائياً
    if (hasLinkedData) {
      return NextResponse.json(
        {
          error:
            'لا يمكن حذف شركة الشحن لأنها مرتبطة ببيانات أو فواتير محفوظة داخل النظام.',
          details: {
            salla_shipments: sallaCount ?? 0,
            invoices: invoicesCount ?? 0,
          },
        },
        { status: 409 },
      )
    }

    // 5. لا توجد بيانات مرتبطة → احذف نهائياً
    const { error: deleteErr } = await supabase
      .from('shipping_companies')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: true })
  }

  // ─── استرجاع (للشركات القديمة المخفية soft-delete) ──────────────────
  if (action === 'restore') {
    const { error } = await getSupabaseAdmin()
      .from('shipping_companies')
      .update({ status: 'active' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
}
