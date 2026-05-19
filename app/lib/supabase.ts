import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('متغيرات Supabase غير مضبوطة (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY)')
  _admin = createClient(url, key, { auth: { persistSession: false } })
  return _admin
}
