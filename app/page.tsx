"use client"

import type { CSSProperties } from 'react'
import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type Company = {
  id: string
  name: string
  agreed_price_outbound: number
  agreed_price_return: number
  status: string
}
type Invoice = {
  id: string
  company_id: string
  company_name: string
  month: string
  file_name: string
  total_amount: number
  status: string
  invoice_shipments?: any[]
  payments?: any[]
}
type Report = {
  company: Company
  salla: { total: number; outbound: number; return: number }
  financial: {
    expectedAmount: number
    actualAmount: number
    difference: number
    profit: boolean
    returnCost: number
    totalPaid: number
    totalUnpaid: number
  }
  invoices: Invoice[]
}

const menuItems = [
  { id: 'salla', label: 'رفع بيانات سلة', icon: '📤' },
  { id: 'invoice', label: 'رفع فاتورة', icon: '📄' },
  { id: 'companies', label: 'شركات الشحن', icon: '🚚' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
]

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div style={overlayStyle}>
      <div style={overlayCard}>
        <div style={spinnerStyle} />
        <p style={{ margin: '18px 0 4px', fontWeight: 800, fontSize: 18 }}>
          جاري رفع ومعالجة الملف
        </p>
        <p style={{ margin: 0, color: '#667085', fontSize: 14 }}>
          لا تغلق الصفحة أو تنتقل بعيداً
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeMenu, setActiveMenu] = useState('salla')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [companiesRes, invoicesRes, reportsRes] = await Promise.all([
        fetch('/api/companies').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/reports').then(r => r.json()),
      ])
      setCompanies(Array.isArray(companiesRes) ? companiesRes : [])
      setInvoices(Array.isArray(invoicesRes) ? invoicesRes : [])
      setReports(Array.isArray(reportsRes) ? reportsRes : [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const activeCompanies = companies.filter(c => c.status === 'active')
  const deletedCompanies = companies.filter(c => c.status === 'deleted')

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f4f6fb',
        direction: 'rtl',
        fontFamily: 'Tahoma, Arial',
        display: 'flex',
      }}
    >
      <LoadingOverlay visible={uploading} />

      <aside style={{ ...sidebarStyle, width: sidebarOpen ? 260 : 64 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginBottom: 28,
            alignItems: sidebarOpen ? 'flex-start' : 'center',
          }}
        >
          <div style={brandWrap}>
            <div style={logoCircle}>G</div>
            {sidebarOpen && (
              <div>
                <h1 style={brandTitle}>GLO CAR</h1>
                <p style={brandSub}>تدقيق فواتير الشحن</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={collapseButton}
          >
            {sidebarOpen ? '×' : '☰'}
          </button>
        </div>
        <nav
          style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}
        >
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              title={item.label}
              style={{
                ...navButton,
                ...(sidebarOpen ? navButtonOpen : navButtonClosed),
                ...(activeMenu === item.id ? activeButton : {}),
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && loading && (
          <p
            style={{
              color: '#d8d0bd',
              fontSize: 12,
              marginTop: 'auto',
              padding: '10px 0',
            }}
          >
            جاري التحميل...
          </p>
        )}
      </aside>

      <section style={{ flex: 1, padding: 28, overflowX: 'hidden' }}>
        {activeMenu === 'salla' && (
          <SallaPage
            companies={activeCompanies}
            onRefresh={fetchAll}
            setUploading={setUploading}
          />
        )}
        {activeMenu === 'invoice' && (
          <InvoicePage
            companies={activeCompanies}
            onRefresh={fetchAll}
            setUploading={setUploading}
          />
        )}
        {activeMenu === 'companies' && (
          <CompaniesPage
            active={activeCompanies}
            deleted={deletedCompanies}
            onRefresh={fetchAll}
          />
        )}
        {activeMenu === 'reports' && (
          <ReportsPage reports={reports} invoices={invoices} onRefresh={fetchAll} />
        )}
      </section>
    </main>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <header style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: 30, color: '#142143' }}>{title}</h2>
      <p style={{ color: '#667085', marginTop: 8 }}>{desc}</p>
    </header>
  )
}

// ─── Salla Page ───────────────────────────────────────────────────────────────
function SallaPage({
  companies,
  onRefresh,
  setUploading,
}: {
  companies: Company[]
  onRefresh: () => void
  setUploading: (v: boolean) => void
}) {
  const [result, setResult] = useState<any>(null)
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLocalLoading(true)
    setUploading(true)
    setError('')
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/salla', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'خطأ في الرفع')
        return
      }
      setResult(data)
      onRefresh()
    } catch {
      setError('تعذر الاتصال')
    } finally {
      setLocalLoading(false)
      setUploading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="رفع بيانات سلة"
        desc="ارفع ملف Excel من سلة والنظام يفرز الطلبات تلقائياً لكل شركة شحن."
      />
      <div style={cardStyle}>
        <h3 style={titleStyle}>رفع ملف Excel</h3>
        <label style={{ ...uploadButton, opacity: localLoading ? 0.6 : 1 }}>
          {localLoading ? 'جاري الرفع والتحليل...' : '📤 اختر ملف Excel من سلة'}
          <input
            hidden
            type="file"
            accept=".xlsx,.xls"
            disabled={localLoading}
            onChange={handleFile}
          />
        </label>
        {error && <div style={errorBox}>❌ {error}</div>}
        {result && (
          <>
            <div style={successBox}>✅ تم رفع {result.total} شحنة وفرزها تلقائياً</div>
            {result.unregistered?.length > 0 && (
              <div
                style={{
                  ...errorBox,
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #f59e0b',
                  marginTop: 10,
                }}
              >
                ⚠️ شركات غير مسجلة في النظام: {result.unregistered.join('، ')}
              </div>
            )}
            <h4 style={{ margin: '16px 0 10px', color: '#142143' }}>
              الفرز حسب شركة الشحن:
            </h4>
            <div style={miniGrid}>
              {Object.entries(result.grouped || {}).map(([name, count]) => {
                const known = companies.find(c => c.name === name)
                return (
                  <div
                    key={name}
                    style={{
                      ...miniCard,
                      borderRight: `4px solid ${known ? '#142143' : '#f59e0b'}`,
                    }}
                  >
                    <strong>{name}</strong>
                    <span
                      style={{ fontSize: 22, fontWeight: 900, color: '#142143' }}
                    >
                      {String(count)}
                    </span>
                    <small style={{ color: known ? '#027a48' : '#92400e' }}>
                      {known ? 'شركة مسجلة ✓' : '⚠️ غير مسجلة'}
                    </small>
                  </div>
                )
              })}
            </div>
            {result.columns && (
              <p style={noteStyle}>أعمدة الملف: {result.columns.join(' | ')}</p>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── Invoice Page ─────────────────────────────────────────────────────────────
function InvoicePage({
  companies,
  onRefresh,
  setUploading,
}: {
  companies: Company[]
  onRefresh: () => void
  setUploading: (v: boolean) => void
}) {
  const [companyId, setCompanyId] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [localLoading, setLocalLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId || !month) {
      setError('اختر شركة الشحن والشهر أولاً')
      return
    }
    setLocalLoading(true)
    setUploading(true)
    setError('')
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('company_id', companyId)
    fd.append('month', month)
    try {
      const res = await fetch('/api/invoices', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'خطأ')
        return
      }
      setResult(data)
      onRefresh()
    } catch {
      setError('تعذر الاتصال')
    } finally {
      setLocalLoading(false)
      setUploading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="رفع فاتورة شركة شحن"
        desc="ارفع ملف Excel أو PDF للفاتورة والنظام يحللها ويكشف أي بوليصة مكررة في فواتير سابقة."
      />
      <div style={cardStyle}>
        <h3 style={titleStyle}>بيانات الفاتورة</h3>
        <div style={{ display: 'grid', gap: 14 }}>
          <select
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            style={selectStyle}
          >
            <option value="">اختر شركة الشحن</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div>
            <label
              style={{
                color: '#344054',
                fontWeight: 700,
                display: 'block',
                marginBottom: 6,
              }}
            >
              شهر الفاتورة
            </label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={inputStyle}
            />
          </div>
          <label
            style={{
              ...uploadButton,
              opacity: !companyId || localLoading ? 0.5 : 1,
            }}
          >
            {localLoading
              ? 'جاري التحليل...'
              : '📄 رفع ملف الفاتورة (Excel أو PDF)'}
            <input
              hidden
              type="file"
              accept=".xlsx,.xls,.pdf"
              disabled={!companyId || localLoading}
              onChange={handleFile}
            />
          </label>
        </div>
        {error && <div style={errorBox}>❌ {error}</div>}
        {result && (
          <>
            <div style={successBox}>
              ✅ تم حفظ الفاتورة — {result.total_shipments} بوليصة —
              إجمالي {result.total_amount.toFixed(2)} ر.س
              {result.fileType && (
                <span
                  style={{
                    marginRight: 10,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    borderRadius: 8,
                    padding: '2px 10px',
                    fontSize: 13,
                  }}
                >
                  {result.fileType}
                </span>
              )}
            </div>
            {result.duplicates?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    ...errorBox,
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #f59e0b',
                  }}
                >
                  ⚠️ تنبيه: {result.duplicates.length} بوليصة مكررة موجودة في
                  فواتير سابقة!
                </div>
                <table style={{ ...tableStyle, marginTop: 10 }}>
                  <thead>
                    <tr style={{ background: '#fef3c7' }}>
                      <th style={th}>رقم البوليصة</th>
                      <th style={th}>وجدت في شهر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.duplicates.map((d: any) => (
                      <tr
                        key={d.waybill}
                        style={{ borderBottom: '1px solid #fde68a' }}
                      >
                        <td style={td}>{d.waybill}</td>
                        <td style={{ ...td, color: '#92400e', fontWeight: 700 }}>
                          {d.found_in_month}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.columns && (
              <p style={noteStyle}>
                أعمدة الملف المكتشفة: {result.columns.join(' | ')}
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── Companies Page ───────────────────────────────────────────────────────────
function CompaniesPage({
  active,
  deleted,
  onRefresh,
}: {
  active: Company[]
  deleted: Company[]
  onRefresh: () => void
}) {
  const [name, setName] = useState('')
  const [priceOut, setPriceOut] = useState('')
  const [priceRet, setPriceRet] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editOut, setEditOut] = useState('')
  const [editRet, setEditRet] = useState('')

  const addCompany = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        name: name.trim(),
        agreed_price_outbound: parseFloat(priceOut) || 0,
        agreed_price_return: parseFloat(priceRet) || 0,
      }),
    })
    setName('')
    setPriceOut('')
    setPriceRet('')
    onRefresh()
    setSaving(false)
  }

  const deleteCompany = async (id: string) => {
    await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    onRefresh()
  }

  const restoreCompany = async (id: string) => {
    await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore', id }),
    })
    onRefresh()
  }

  const savePrices = async (id: string) => {
    await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_prices',
        id,
        agreed_price_outbound: parseFloat(editOut) || 0,
        agreed_price_return: parseFloat(editRet) || 0,
      }),
    })
    setEditId(null)
    onRefresh()
  }

  return (
    <>
      <PageHeader
        title="شركات الشحن"
        desc="أضف شركات الشحن وحدد سعر الاتفاق لكل شحنة صادرة ومسترجعة."
      />

      <div style={cardStyle}>
        <h3 style={titleStyle}>إضافة شركة شحن جديدة</h3>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="اسم شركة الشحن (مثال: أرامكس)"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>سعر الشحنة الصادرة (ر.س) — شامل الضريبة</label>
            <input
              type="number"
              value={priceOut}
              onChange={e => setPriceOut(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>سعر الشحنة المسترجعة (ر.س) — شامل الضريبة</label>
            <input
              type="number"
              value={priceRet}
              onChange={e => setPriceRet(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              disabled={!name.trim() || saving}
              onClick={addCompany}
              style={{ ...saveButton, width: '100%', opacity: name.trim() ? 1 : 0.5 }}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
        <p style={{ ...noteStyle, marginTop: 14 }}>
          💡 جميع الأسعار شاملة الضريبة المضافة (15%)
        </p>
      </div>

      <div style={cardStyle}>
        <h3 style={titleStyle}>شركات الشحن النشطة</h3>
        {active.length === 0 ? (
          <div style={emptyState}>لا توجد شركات شحن مضافة بعد.</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#eef2f7' }}>
                <th style={th}>الشركة</th>
                <th style={th}>سعر الصادر</th>
                <th style={th}>سعر المسترجع</th>
                <th style={th}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {active.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #edf0f5' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{c.name}</td>
                  <td style={td}>
                    {editId === c.id ? (
                      <input
                        type="number"
                        value={editOut}
                        onChange={e => setEditOut(e.target.value)}
                        style={{ ...inputStyle, padding: '8px', width: 80 }}
                      />
                    ) : (
                      <span>{c.agreed_price_outbound} ر.س</span>
                    )}
                  </td>
                  <td style={td}>
                    {editId === c.id ? (
                      <input
                        type="number"
                        value={editRet}
                        onChange={e => setEditRet(e.target.value)}
                        style={{ ...inputStyle, padding: '8px', width: 80 }}
                      />
                    ) : (
                      <span>{c.agreed_price_return} ر.س</span>
                    )}
                  </td>
                  <td style={{ ...td, display: 'flex', gap: 8 }}>
                    {editId === c.id ? (
                      <>
                        <button
                          onClick={() => savePrices(c.id)}
                          style={saveSmallButton}
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          style={grayButton}
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditId(c.id)
                            setEditOut(String(c.agreed_price_outbound))
                            setEditRet(String(c.agreed_price_return))
                          }}
                          style={grayButton}
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => deleteCompany(c.id)}
                          style={dangerButton}
                        >
                          حذف
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleted.length > 0 && (
        <div style={cardStyle}>
          <h3 style={titleStyle}>المحذوفات</h3>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#fee2e2' }}>
                <th style={th}>الشركة</th>
                <th style={th}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {deleted.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #fecaca' }}>
                  <td style={td}>{c.name}</td>
                  <td style={td}>
                    <button
                      onClick={() => restoreCompany(c.id)}
                      style={restoreButton}
                    >
                      استرجاع
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
function ReportsPage({
  reports,
  invoices,
  onRefresh,
}: {
  reports: Report[]
  invoices: Invoice[]
  onRefresh: () => void
}) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState('')

  const filteredReports =
    selectedCompanyId === 'all'
      ? reports
      : reports.filter(r => r.company.id === selectedCompanyId)

  const pay = async (invoiceId: string) => {
    await fetch('/api/invoices/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pay',
        invoice_id: invoiceId,
        receipt_file_name: receiptName,
        amount: invoices.find(i => i.id === invoiceId)?.total_amount || 0,
      }),
    })
    setPayingInvoiceId(null)
    setReceiptName('')
    onRefresh()
  }

  const unpay = async (invoiceId: string) => {
    await fetch('/api/invoices/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unpay', invoice_id: invoiceId }),
    })
    onRefresh()
  }

  return (
    <>
      <PageHeader
        title="التقارير"
        desc="ملخص مالي شامل — ما المتوقع، ما حسبته الشركة، الفرق، وتكلفة المسترجعات."
      />

      {/* فلتر الشركة */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <button
          onClick={() => setSelectedCompanyId('all')}
          style={{
            ...carrierButton,
            ...(selectedCompanyId === 'all' ? activeCarrierButton : {}),
          }}
        >
          الكل
        </button>
        {reports.map(r => (
          <button
            key={r.company.id}
            onClick={() => setSelectedCompanyId(r.company.id)}
            style={{
              ...carrierButton,
              ...(selectedCompanyId === r.company.id ? activeCarrierButton : {}),
            }}
          >
            {r.company.name}
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <div style={emptyState}>
          لا توجد بيانات. أضف شركات شحن ثم ارفع بيانات سلة والفواتير.
        </div>
      ) : (
        filteredReports.map(r => (
          <div key={r.company.id} style={{ ...cardStyle, marginBottom: 24 }}>
            {/* رأس التقرير */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 26, color: '#142143' }}>
                🚚 {r.company.name}
              </h3>
              <span style={r.financial.profit ? greenBadge : redBadge}>
                {r.financial.profit ? '✅ لصالحك' : '❌ خسارة'} — الفرق:{' '}
                {Math.abs(r.financial.difference).toFixed(2)} ر.س
              </span>
            </div>

            {/* الأرقام المالية */}
            <div style={reportGrid}>
              <MetricCard
                label="شحنات سلة (صادر)"
                value={String(r.salla.outbound)}
                sub="شحنة"
              />
              <MetricCard
                label="شحنات سلة (مسترجع)"
                value={String(r.salla.return)}
                sub="شحنة"
              />
              <MetricCard
                label="المبلغ المتوقع (حسب الاتفاق)"
                value={`${r.financial.expectedAmount.toFixed(2)}`}
                sub="ر.س"
                color="#142143"
              />
              <MetricCard
                label="ما حسبته الشركة فعلياً"
                value={`${r.financial.actualAmount.toFixed(2)}`}
                sub="ر.س"
                color={r.financial.profit ? '#027a48' : '#b42318'}
              />
              <MetricCard
                label="تكلفة المسترجعات"
                value={`${r.financial.returnCost.toFixed(2)}`}
                sub="ر.س"
                color="#92400e"
              />
              <MetricCard
                label="المسدد"
                value={`${r.financial.totalPaid.toFixed(2)}`}
                sub="ر.س"
                color="#027a48"
              />
              <MetricCard
                label="المتبقي غير المسدد"
                value={`${r.financial.totalUnpaid.toFixed(2)}`}
                sub="ر.س"
                color="#b42318"
              />
            </div>

            {/* الفواتير */}
            {r.invoices.length > 0 && (
              <>
                <h4
                  style={{ marginTop: 24, marginBottom: 10, color: '#142143' }}
                >
                  سجل الفواتير
                </h4>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: '#eef2f7' }}>
                      <th style={th}>الشهر</th>
                      <th style={th}>عدد البوالص</th>
                      <th style={th}>المبلغ</th>
                      <th style={th}>الحالة</th>
                      <th style={th}>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.invoices.map(inv => (
                      <tr
                        key={inv.id}
                        style={{ borderBottom: '1px solid #edf0f5' }}
                      >
                        <td style={td}>{inv.month}</td>
                        <td style={td}>
                          {inv.invoice_shipments?.length || 0}
                        </td>
                        <td style={{ ...td, fontWeight: 700 }}>
                          {(inv.total_amount || 0).toFixed(2)} ر.س
                        </td>
                        <td style={td}>
                          <span
                            style={
                              inv.status === 'paid' ? greenBadge : yellowBadge
                            }
                          >
                            {inv.status === 'paid' ? 'مسدد ✓' : 'غير مسدد'}
                          </span>
                        </td>
                        <td style={td}>
                          {inv.status === 'paid' ? (
                            <button
                              onClick={() => unpay(inv.id)}
                              style={dangerButton}
                            >
                              إلغاء السداد
                            </button>
                          ) : payingInvoiceId === inv.id ? (
                            <div
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                              }}
                            >
                              <input
                                value={receiptName}
                                onChange={e => setReceiptName(e.target.value)}
                                placeholder="رقم الحوالة أو اسم الإيصال"
                                style={{
                                  ...inputStyle,
                                  padding: '8px',
                                  flex: 1,
                                }}
                              />
                              <button
                                onClick={() => pay(inv.id)}
                                style={saveSmallButton}
                              >
                                تأكيد
                              </button>
                              <button
                                onClick={() => setPayingInvoiceId(null)}
                                style={grayButton}
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPayingInvoiceId(inv.id)}
                              style={saveSmallButton}
                            >
                              تسجيل سداد
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        ))
      )}
    </>
  )
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div style={reportMetric}>
      <p style={{ margin: 0, color: '#667085', fontSize: 13 }}>{label}</p>
      <strong
        style={{
          display: 'block',
          marginTop: 8,
          fontSize: 26,
          color: color || '#344054',
        }}
      >
        {value}
      </strong>
      {sub && <small style={{ color: '#667085' }}>{sub}</small>}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const overlayCard: CSSProperties = {
  background: 'white',
  borderRadius: 20,
  padding: '40px 50px',
  textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  color: '#142143',
}
const spinnerStyle: CSSProperties = {
  width: 52,
  height: 52,
  border: '5px solid #eef2f7',
  borderTop: '5px solid #142143',
  borderRadius: '50%',
  margin: '0 auto',
  animation: 'spin 0.8s linear infinite',
}
const sidebarStyle: CSSProperties = {
  background: '#142143',
  color: 'white',
  minHeight: '100vh',
  padding: '14px 8px',
  transition: '.25s ease',
  position: 'sticky',
  top: 0,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}
const collapseButton: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: '#0f1b39',
  border: '1px solid rgba(255,255,255,.16)',
  color: 'white',
  fontSize: 22,
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
}
const brandWrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }
const logoCircle: CSSProperties = { width: 48, height: 48, borderRadius: '50%', background: '#d8d0bd', color: '#142143', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, flexShrink: 0 }
const brandTitle: CSSProperties = { margin: 0, fontSize: 22, letterSpacing: 1, whiteSpace: 'nowrap' }
const brandSub: CSSProperties = { margin: '4px 0 0', color: '#d8d0bd', fontSize: 12, whiteSpace: 'nowrap' }
const navButton: CSSProperties = { border: 0, background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 999, fontWeight: 700, cursor: 'pointer', boxSizing: 'border-box', transition: '.15s' }
const navButtonOpen: CSSProperties = { width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }
const navButtonClosed: CSSProperties = { width: 48, height: 48, justifyContent: 'center', padding: 0 }
const activeButton: CSSProperties = { background: '#d8d0bd', color: '#142143' }
const cardStyle: CSSProperties = { background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(20,33,67,.08)', marginBottom: 18 }
const emptyState: CSSProperties = { background: '#f8fafc', border: '1px dashed #d0d5dd', borderRadius: 16, padding: 24, color: '#667085', fontWeight: 700, textAlign: 'center' }
const uploadButton: CSSProperties = { display: 'block', width: '100%', background: '#142143', color: 'white', borderRadius: 14, padding: '16px', fontWeight: 700, textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box' }
const selectStyle: CSSProperties = { width: '100%', padding: '15px', borderRadius: 14, border: '1px solid #d0d5dd', background: '#f8fafc', fontWeight: 700, fontFamily: 'Tahoma, Arial', direction: 'rtl' }
const saveButton: CSSProperties = { background: '#142143', color: 'white', border: 0, borderRadius: 14, padding: '16px', fontWeight: 700, cursor: 'pointer' }
const saveSmallButton: CSSProperties = { background: '#142143', color: 'white', border: 0, borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }
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
const noteStyle: CSSProperties = { color: '#667085', background: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 14, fontSize: 13 }
const miniGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 14 }
const miniCard: CSSProperties = { background: '#f8fafc', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }
const reportGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }
const reportMetric: CSSProperties = { background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 16, padding: 16 }
const titleStyle: CSSProperties = { marginTop: 0, fontSize: 22, color: '#142143' }
const labelStyle: CSSProperties = { color: '#344054', fontWeight: 700, display: 'block', marginBottom: 6, fontSize: 14 }
const inputStyle: CSSProperties = { width: '100%', padding: '13px', borderRadius: 12, border: '1px solid #d0d5dd', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'Tahoma, Arial', direction: 'rtl' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' }
const th: CSSProperties = { padding: 12, fontWeight: 700, color: '#344054' }
const td: CSSProperties = { padding: 12, color: '#344054' }
