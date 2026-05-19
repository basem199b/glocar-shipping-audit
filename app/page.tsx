"use client"

import type { CSSProperties } from 'react'
import { useState, useEffect, useCallback } from 'react'

type Company = {
  id: string; name: string; base_price: number; base_weight_kg: number; extra_kg_price: number;
  return_price: number; free_waybill_count: number; extra_waybill_price: number; notes: string; status: string
}
type Invoice = { id: string; company_name: string; month: string; file_name: string; total_amount: number; status: string; invoice_shipments?: any[]; payments?: any[] }
type Report = {
  company: Company
  salla: { total: number; outbound: number; return: number; orders: number }
  financial: { expectedAmount: number; actualAmount: number; difference: number; profit: boolean; returnCost: number; totalPaid: number; totalUnpaid: number }
  invoices: Invoice[]
}

const menuItems = [
  { id: 'salla', label: 'رفع بيانات سلة', icon: '📤' },
  { id: 'invoice', label: 'رفع فاتورة', icon: '📄' },
  { id: 'companies', label: 'شركات الشحن', icon: '🚚' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
]

export default function HomePage() {
  const [activeMenu, setActiveMenu] = useState('salla')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [cr, ir, rr] = await Promise.all([
        fetch('/api/companies').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/reports').then(r => r.json()),
      ])
      setCompanies(Array.isArray(cr) ? cr : [])
      setInvoices(Array.isArray(ir) ? ir : [])
      setReports(Array.isArray(rr) ? rr : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const activeCompanies = companies.filter(c => c.status === 'active')
  const deletedCompanies = companies.filter(c => c.status === 'deleted')

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6fb', direction: 'rtl', fontFamily: 'Tahoma, Arial', display: 'flex' }}>
      <aside style={{ ...sidebarStyle, width: sidebarOpen ? 260 : 64 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28, alignItems: sidebarOpen ? 'flex-start' : 'center' }}>
          <div style={brandWrap}>
            <div style={logoCircle}>G</div>
            {sidebarOpen && <div><h1 style={brandTitle}>GLO CAR</h1><p style={brandSub}>تدقيق فواتير الشحن</p></div>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={collapseButton}>{sidebarOpen ? '×' : '☰'}</button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)} title={item.label}
              style={{ ...navButton, ...(sidebarOpen ? navButtonOpen : navButtonClosed), ...(activeMenu === item.id ? activeButton : {}) }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && loading && <p style={{ color: '#d8d0bd', fontSize: 12, marginTop: 'auto', paddingTop: 20 }}>جاري التحميل...</p>}
      </aside>
      <section style={{ flex: 1, padding: 28, overflowX: 'hidden' }}>
        {activeMenu === 'salla' && <SallaPage companies={activeCompanies} onRefresh={fetchAll} />}
        {activeMenu === 'invoice' && <InvoicePage companies={activeCompanies} onRefresh={fetchAll} />}
        {activeMenu === 'companies' && <CompaniesPage active={activeCompanies} deleted={deletedCompanies} onRefresh={fetchAll} />}
        {activeMenu === 'reports' && <ReportsPage reports={reports} invoices={invoices} onRefresh={fetchAll} />}
      </section>
    </main>
  )
}

function PageHeader({ title, desc }: { title: string; desc: string }) {
  return <header style={{ marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 30, color: '#142143' }}>{title}</h2><p style={{ color: '#667085', marginTop: 8 }}>{desc}</p></header>
}

function SallaPage({ companies, onRefresh }: { companies: Company[]; onRefresh: () => void }) {
  const [result, setResult] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(''); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/salla', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'خطأ'); return }
      setResult(data); onRefresh()
    } catch { setError('تعذر الاتصال') }
    finally { setUploading(false) }
  }

  return <>
    <PageHeader title="رفع بيانات سلة" desc="ارفع ملف Excel من سلة والنظام يفرز الطلبات تلقائياً حسب شركة الشحن. تأكد أن الملف فيه: رقم البوليصة، رقم الطلب، الوزن." />
    <div style={cardStyle}>
      <h3 style={titleStyle}>رفع ملف Excel</h3>
      <label style={{ ...uploadButton, opacity: uploading ? 0.6 : 1 }}>
        {uploading ? 'جاري الرفع والتحليل...' : '📤 اختر ملف Excel من سلة'}
        <input hidden type="file" accept=".xlsx,.xls" disabled={uploading} onChange={handleFile} />
      </label>
      {error && <div style={errorBox}>❌ {error}</div>}
      {result && <>
        <div style={successBox}>✅ تم رفع {result.total} شحنة وفرزها تلقائياً</div>
        <h4 style={{ margin: '16px 0 10px', color: '#142143' }}>الفرز حسب شركة الشحن:</h4>
        <div style={miniGrid}>
          {Object.entries(result.grouped || {}).map(([name, count]) => {
            const known = companies.find(c => c.name === name)
            return (
              <div key={name} style={{ ...miniCard, borderRight: `4px solid ${known ? '#142143' : '#f59e0b'}` }}>
                <strong>{name}</strong>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#142143' }}>{String(count)}</span>
                <small style={{ color: known ? '#027a48' : '#92400e' }}>{known ? '✓ مسجلة' : '⚠️ غير مسجلة'}</small>
              </div>
            )
          })}
        </div>
        {result.detected && (
          <p style={noteStyle}>
            الأعمدة المكتشفة — البوليصة: {result.detected.waybill || '؟'} | الطلب: {result.detected.order || '؟'} | الوزن: {result.detected.weight || '؟'} | الشركة: {result.detected.company || '؟'}
          </p>
        )}
      </>}
    </div>
  </>
}

function InvoicePage({ companies, onRefresh }: { companies: Company[]; onRefresh: () => void }) {
  const [company, setCompany] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!company || !month) { setError('اختر شركة الشحن والشهر أولاً'); return }
    setUploading(true); setError(''); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('company_name', company)
    fd.append('month', month)
    try {
      const res = await fetch('/api/invoices', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'خطأ'); return }
      setResult(data); onRefresh()
    } catch { setError('تعذر الاتصال') }
    finally { setUploading(false) }
  }

  return <>
    <PageHeader title="رفع فاتورة شركة شحن" desc="ارفع Excel الفاتورة والنظام يحللها ويكشف البوالص المكررة في فواتير سابقة." />
    <div style={cardStyle}>
      <h3 style={titleStyle}>بيانات الفاتورة</h3>
      <div style={{ display: 'grid', gap: 14 }}>
        <select value={company} onChange={e => setCompany(e.target.value)} style={selectStyle}>
          <option value="">اختر شركة الشحن</option>
          {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <div>
          <label style={labelStyle}>شهر الفاتورة</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inputStyle} />
        </div>
        <label style={{ ...uploadButton, opacity: (!company || uploading) ? 0.5 : 1, cursor: (!company || uploading) ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'جاري التحليل...' : '📄 رفع ملف Excel للفاتورة'}
          <input hidden type="file" accept=".xlsx,.xls" disabled={!company || uploading} onChange={handleFile} />
        </label>
      </div>
      {error && <div style={errorBox}>❌ {error}</div>}
      {result && <>
        <div style={successBox}>✅ تم حفظ الفاتورة — {result.total_shipments} بوليصة — {Number(result.total_amount).toFixed(2)} ر.س</div>
        {result.duplicates?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ ...errorBox, background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
              ⚠️ تنبيه: {result.duplicates.length} بوليصة مكررة موجودة في فواتير سابقة!
            </div>
            <table style={{ ...tableStyle, marginTop: 10 }}>
              <thead><tr style={{ background: '#fef9c3' }}><th style={th}>رقم البوليصة</th><th style={th}>وجدت في شهر</th></tr></thead>
              <tbody>
                {result.duplicates.map((d: any) => (
                  <tr key={d.waybill}><td style={td}>{d.waybill}</td><td style={{ ...td, color: '#92400e', fontWeight: 700 }}>{d.found_in_month}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result.columns && <p style={noteStyle}>أعمدة الملف: {result.columns.join(' - ')}</p>}
      </>}
    </div>
  </>
}

const emptyCompany = { name: '', base_price: '', base_weight_kg: '', extra_kg_price: '', return_price: '', free_waybill_count: '', extra_waybill_price: '', notes: '' }

function CompaniesPage({ active, deleted, onRefresh }: { active: Company[]; deleted: Company[]; onRefresh: () => void }) {
  const [form, setForm] = useState<any>(emptyCompany)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const post = (body: object) => fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const num = (v: string) => parseFloat(v) || 0

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await post({
      action: editId ? 'update' : 'add',
      id: editId,
      name: form.name.trim(),
      base_price: num(form.base_price),
      base_weight_kg: num(form.base_weight_kg),
      extra_kg_price: num(form.extra_kg_price),
      return_price: num(form.return_price),
      free_waybill_count: num(form.free_waybill_count),
      extra_waybill_price: num(form.extra_waybill_price),
      notes: form.notes || '',
    })
    setForm(emptyCompany); setEditId(null); onRefresh(); setSaving(false)
  }

  const startEdit = (c: Company) => {
    setEditId(c.id)
    setForm({
      name: c.name, base_price: String(c.base_price), base_weight_kg: String(c.base_weight_kg),
      extra_kg_price: String(c.extra_kg_price), return_price: String(c.return_price),
      free_waybill_count: String(c.free_waybill_count), extra_waybill_price: String(c.extra_waybill_price),
      notes: c.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const field = (key: string, label: string, hint: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={key === 'name' ? 'text' : 'number'} value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={hint} style={inputStyle} />
    </div>
  )

  return <>
    <PageHeader title="شركات الشحن" desc="أضف شركة الشحن وقواعد التسعير كما تحسبها الشركة. النظام يستخدمها لحساب المبلغ المتوقع تلقائياً." />

    <div style={cardStyle}>
      <h3 style={titleStyle}>{editId ? 'تعديل شركة' : 'إضافة شركة جديدة'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>{field('name', 'اسم شركة الشحن', 'مثال: برولو مبرد')}</div>
        {field('base_price', 'السعر الأساسي للشحنة (ر.س)', '25')}
        {field('base_weight_kg', 'الوزن المشمول بالسعر (كجم)', '15')}
        {field('extra_kg_price', 'سعر الكيلو الإضافي (ر.س)', '2')}
        {field('return_price', 'سعر الشحنة المسترجعة (ر.س)', '0')}
        {field('free_waybill_count', 'عدد البوالص المشمول لكل طلب', '2')}
        {field('extra_waybill_price', 'سعر البوليصة الزائدة (ر.س)', '9')}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>شروط وملاحظات (اكتب أي اتفاق خاص)</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="مثال: السعر الأساسي يشمل 15 كجم، الكيلو الزائد بريالين، البوليصة الزائدة بعد بوليصتين بـ9 ريال"
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button disabled={!form.name.trim() || saving} onClick={save} style={{ ...saveButton, opacity: form.name.trim() ? 1 : 0.5 }}>
          {saving ? 'جاري الحفظ...' : editId ? 'حفظ التعديلات' : 'حفظ الشركة'}
        </button>
        {editId && <button onClick={() => { setForm(emptyCompany); setEditId(null) }} style={grayButton}>إلغاء</button>}
      </div>
    </div>

    <div style={cardStyle}>
      <h3 style={titleStyle}>الشركات النشطة</h3>
      {active.length === 0 ? <div style={emptyState}>لا توجد شركات بعد.</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr style={{ background: '#eef2f7' }}>
              <th style={th}>الشركة</th><th style={th}>أساسي</th><th style={th}>وزن مشمول</th><th style={th}>كيلو إضافي</th>
              <th style={th}>مسترجع</th><th style={th}>بوالص مجانية</th><th style={th}>بوليصة زائدة</th><th style={th}>إجراء</th>
            </tr></thead>
            <tbody>
              {active.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #edf0f5' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{c.name}{c.notes && <div style={{ fontSize: 12, color: '#667085', fontWeight: 400, marginTop: 4 }}>📝 {c.notes}</div>}</td>
                  <td style={td}>{c.base_price}</td>
                  <td style={td}>{c.base_weight_kg} كجم</td>
                  <td style={td}>{c.extra_kg_price}</td>
                  <td style={td}>{c.return_price}</td>
                  <td style={td}>{c.free_waybill_count}</td>
                  <td style={td}>{c.extra_waybill_price}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(c)} style={grayButton}>تعديل</button>
                      <button onClick={async () => { await post({ action: 'delete', id: c.id }); onRefresh() }} style={dangerButton}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {deleted.length > 0 && (
      <div style={cardStyle}>
        <h3 style={titleStyle}>المحذوفات</h3>
        <table style={tableStyle}>
          <thead><tr style={{ background: '#fee2e2' }}><th style={th}>الشركة</th><th style={th}>إجراء</th></tr></thead>
          <tbody>{deleted.map(c => <tr key={c.id}><td style={td}>{c.name}</td><td style={td}><button onClick={async () => { await post({ action: 'restore', id: c.id }); onRefresh() }} style={restoreButton}>استرجاع</button></td></tr>)}</tbody>
        </table>
      </div>
    )}
  </>
}

function ReportsPage({ reports, invoices, onRefresh }: { reports: Report[]; invoices: Invoice[]; onRefresh: () => void }) {
  const [sel, setSel] = useState('all')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState('')
  const filtered = sel === 'all' ? reports : reports.filter(r => r.company.name === sel)

  const pay = async (id: string) => {
    const inv = invoices.find(i => i.id === id)
    await fetch('/api/invoices/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pay', invoice_id: id, receipt_file_name: receiptName, amount: inv?.total_amount || 0 }) })
    setPayingId(null); setReceiptName(''); onRefresh()
  }

  const unpay = async (id: string) => {
    await fetch('/api/invoices/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unpay', invoice_id: id }) })
    onRefresh()
  }

  return <>
    <PageHeader title="التقارير المالية" desc="ملخص شامل — المبلغ المتوقع (حسب قواعدك)، ما حسبته الشركة فعلياً، الفرق، تكلفة المسترجعات، المسدد والمتبقي." />
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
      <button onClick={() => setSel('all')} style={{ ...carrierButton, ...(sel === 'all' ? activeCarrierButton : {}) }}>الكل</button>
      {reports.map(r => <button key={r.company.id} onClick={() => setSel(r.company.name)} style={{ ...carrierButton, ...(sel === r.company.name ? activeCarrierButton : {}) }}>{r.company.name}</button>)}
    </div>
    {filtered.length === 0
      ? <div style={emptyState}>لا توجد بيانات. أضف شركات شحن ثم ارفع بيانات سلة والفواتير.</div>
      : filtered.map(r => (
        <div key={r.company.id} style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 24, color: '#142143' }}>🚚 {r.company.name}</h3>
            <span style={r.financial.profit ? greenBadge : redBadge}>
              {r.financial.profit ? '✅ لصالحك' : '❌ خسارة / مبالغة'} {Math.abs(r.financial.difference).toFixed(2)} ر.س
            </span>
          </div>
          <div style={reportGrid}>
            <MetricCard label="طلبات سلة" value={String(r.salla.orders)} sub="طلب" />
            <MetricCard label="صادر (سلة)" value={String(r.salla.outbound)} sub="بوليصة" />
            <MetricCard label="مسترجع (سلة)" value={String(r.salla.return)} sub="بوليصة" />
            <MetricCard label="المتوقع (حسب قواعدك)" value={r.financial.expectedAmount.toFixed(2)} sub="ر.س" color="#142143" />
            <MetricCard label="ما حسبته الشركة فعلياً" value={r.financial.actualAmount.toFixed(2)} sub="ر.س" color={r.financial.profit ? '#027a48' : '#b42318'} />
            <MetricCard label="تكلفة المسترجعات" value={r.financial.returnCost.toFixed(2)} sub="ر.س" color="#92400e" />
            <MetricCard label="المسدد" value={r.financial.totalPaid.toFixed(2)} sub="ر.س" color="#027a48" />
            <MetricCard label="المتبقي غير المسدد" value={r.financial.totalUnpaid.toFixed(2)} sub="ر.س" color="#b42318" />
          </div>
          {r.invoices.length > 0 && <>
            <h4 style={{ marginTop: 24, marginBottom: 10, color: '#142143' }}>سجل الفواتير</h4>
            <table style={tableStyle}>
              <thead><tr style={{ background: '#eef2f7' }}><th style={th}>الشهر</th><th style={th}>البوالص</th><th style={th}>المبلغ</th><th style={th}>الحالة</th><th style={th}>إجراء</th></tr></thead>
              <tbody>
                {r.invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #edf0f5' }}>
                    <td style={td}>{inv.month}</td>
                    <td style={td}>{inv.invoice_shipments?.length || 0}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{Number(inv.total_amount).toFixed(2)} ر.س</td>
                    <td style={td}><span style={inv.status === 'paid' ? greenBadge : yellowBadge}>{inv.status === 'paid' ? '✓ مسدد' : 'غير مسدد'}</span></td>
                    <td style={td}>
                      {inv.status === 'paid'
                        ? <button onClick={() => unpay(inv.id)} style={dangerButton}>إلغاء السداد</button>
                        : payingId === inv.id
                          ? <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input value={receiptName} onChange={e => setReceiptName(e.target.value)} placeholder="رقم الحوالة" style={{ ...inputStyle, padding: 8, flex: 1, minWidth: 150 }} />
                              <button onClick={() => pay(inv.id)} style={saveSmallButton}>تأكيد</button>
                              <button onClick={() => setPayingId(null)} style={grayButton}>إلغاء</button>
                            </div>
                          : <button onClick={() => setPayingId(inv.id)} style={saveSmallButton}>تسجيل سداد</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>}
        </div>
      ))}
  </>
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={reportMetric}>
      <p style={{ margin: 0, color: '#667085', fontSize: 13 }}>{label}</p>
      <strong style={{ display: 'block', marginTop: 8, fontSize: 22, color: color || '#344054' }}>{value}</strong>
      {sub && <small style={{ color: '#667085' }}>{sub}</small>}
    </div>
  )
}

const sidebarStyle: CSSProperties = { background: '#142143', color: 'white', minHeight: '100vh', padding: '14px 8px', transition: '.25s ease', position: 'sticky', top: 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }
const collapseButton: CSSProperties = { width: 44, height: 44, borderRadius: '50%', background: '#0f1b39', border: '1px solid rgba(255,255,255,.16)', color: 'white', fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center' }
const brandWrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }
const logoCircle: CSSProperties = { width: 48, height: 48, borderRadius: '50%', background: '#d8d0bd', color: '#142143', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, flexShrink: 0 }
const brandTitle: CSSProperties = { margin: 0, fontSize: 22, letterSpacing: 1, whiteSpace: 'nowrap' }
const brandSub: CSSProperties = { margin: '4px 0 0', color: '#d8d0bd', fontSize: 12, whiteSpace: 'nowrap' }
const navButton: CSSProperties = { border: 0, background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 999, fontWeight: 700, cursor: 'pointer', boxSizing: 'border-box' }
const navButtonOpen: CSSProperties = { width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }
const navButtonClosed: CSSProperties = { width: 48, height: 48, justifyContent: 'center', padding: 0 }
const activeButton: CSSProperties = { background: '#d8d0bd', color: '#142143' }
const cardStyle: CSSProperties = { background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(20,33,67,.08)', marginBottom: 18 }
const emptyState: CSSProperties = { background: '#f8fafc', border: '1px dashed #d0d5dd', borderRadius: 16, padding: 24, color: '#667085', fontWeight: 700, textAlign: 'center' }
const uploadButton: CSSProperties = { display: 'block', width: '100%', background: '#142143', color: 'white', borderRadius: 14, padding: '16px', fontWeight: 700, textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box' }
const selectStyle: CSSProperties = { width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #d0d5dd', background: '#f8fafc', fontWeight: 700, fontFamily: 'Tahoma,Arial', direction: 'rtl', fontSize: 15 }
const saveButton: CSSProperties = { background: '#142143', color: 'white', border: 0, borderRadius: 14, padding: '14px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }
const saveSmallButton: CSSProperties = { background: '#142143', color: 'white', border: 0, borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }
const grayButton: CSSProperties = { background: '#f1f5f9', color: '#344054', border: '1px solid #d0d5dd', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }
const dangerButton: CSSProperties = { background: '#fee2e2', color: '#b42318', border: 0, borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }
const restoreButton: CSSProperties = { background: '#dcfce7', color: '#027a48', border: 0, borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }
const carrierButton: CSSProperties = { background: 'white', color: '#142143', border: '1px solid #d0d5dd', borderRadius: 14, padding: '12px 20px', fontWeight: 800, cursor: 'pointer' }
const activeCarrierButton: CSSProperties = { background: '#142143', color: 'white' }
const greenBadge: CSSProperties = { background: '#dcfce7', color: '#027a48', borderRadius: 999, padding: '7px 14px', fontWeight: 800, fontSize: 13 }
const yellowBadge: CSSProperties = { background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '7px 14px', fontWeight: 800, fontSize: 13 }
const redBadge: CSSProperties = { background: '#fee2e2', color: '#b42318', borderRadius: 999, padding: '7px 14px', fontWeight: 800, fontSize: 13 }
const successBox: CSSProperties = { background: '#ecfdf3', color: '#027a48', padding: 14, borderRadius: 12, fontWeight: 700, marginTop: 14 }
const errorBox: CSSProperties = { background: '#fee2e2', color: '#b42318', padding: 14, borderRadius: 12, fontWeight: 700, marginTop: 14 }
const noteStyle: CSSProperties = { color: '#667085', background: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 12, fontSize: 13 }
const miniGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 14 }
const miniCard: CSSProperties = { background: '#f8fafc', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }
const reportGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }
const reportMetric: CSSProperties = { background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 16, padding: 16 }
const titleStyle: CSSProperties = { marginTop: 0, fontSize: 20, color: '#142143' }
const labelStyle: CSSProperties = { color: '#344054', fontWeight: 700, display: 'block', marginBottom: 6, fontSize: 13 }
const inputStyle: CSSProperties = { width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #d0d5dd', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'Tahoma,Arial', direction: 'rtl', fontSize: 14 }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' }
const th: CSSProperties = { padding: 12, fontWeight: 700, color: '#344054', fontSize: 13, whiteSpace: 'nowrap' }
const td: CSSProperties = { padding: 12, color: '#344054', fontSize: 14 }
