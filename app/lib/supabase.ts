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

// Lazy proxy — routes that import supabaseAdmin directly will use this
// Calls getSupabaseAdmin() on first property access so env vars are read at runtime not import time
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop]
  },
  apply(_target, _this, args) {
    return (getSupabaseAdmin() as any)(...args)
  },
})