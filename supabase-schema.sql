-- نظام تدقيق فواتير الشحن - GLO CAR
-- شغّل هذا الكود في Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shipping_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  base_price NUMERIC DEFAULT 0,
  base_weight_kg NUMERIC DEFAULT 0,
  extra_kg_price NUMERIC DEFAULT 0,
  return_price NUMERIC DEFAULT 0,
  free_waybill_count INTEGER DEFAULT 0,
  extra_waybill_price NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salla_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  waybill TEXT NOT NULL,
  order_id TEXT,
  company_name TEXT NOT NULL,
  weight_kg NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'outbound' CHECK (type IN ('outbound', 'return')),
  upload_batch TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  month TEXT NOT NULL,
  file_name TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  waybill TEXT NOT NULL,
  type TEXT DEFAULT 'outbound' CHECK (type IN ('outbound', 'return')),
  amount_charged NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE UNIQUE,
  receipt_file_name TEXT,
  paid_at DATE,
  amount NUMERIC DEFAULT 0
);

ALTER TABLE shipping_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE salla_shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
