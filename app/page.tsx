"use client"

import type { CSSProperties } from 'react'
import { useState } from 'react'

const menuItems = [
  { id: 'salla', label: 'رفع بيانات سلة', icon: '📤' },
  { id: 'invoice', label: 'رفع فاتورة جديدة', icon: '📄' },
  { id: 'carrier', label: 'إضافة شركة شحن', icon: '➕' },
  { id: 'companies', label: 'شركات الشحن', icon: '🚚' },
]

const carriers = ['أرامكس', 'DHL', 'سمسا', 'ناقل', 'سبل']
const companyRows = [
  { name: 'أرامكس', invoices: 12, status: 'نشطة' },
  { name: 'DHL', invoices: 4, status: 'نشطة' },
  { name: 'سمسا', invoices: 7, status: 'نشطة' },
]

export default function HomePage() {
  const [activeMenu, setActiveMenu] = useState('salla')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCarrier, setSelectedCarrier] = useState('')
  const [excelFile, setExcelFile] = useState('')
  const [pdfFile, setPdfFile] = useState('')
  const [newCarrierName, setNewCarrierName] = useState('')

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6fb', direction: 'rtl', fontFamily: 'Arial', display: 'flex' }}>
      <aside style={{ ...sidebarStyle, width: sidebarOpen ? 270 : 86 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={collapseButton}>{sidebarOpen ? '✕' : '☰'}</button>
        <div style={{ marginBottom: 34, overflow: 'hidden' }}>
          <h1 style={{ margin: 0, fontSize: sidebarOpen ? 34 : 22, whiteSpace: 'nowrap' }}>GLO CAR</h1>
          {sidebarOpen && <p style={{ color: '#d8d0bd', marginTop: 8 }}>تدقيق فواتير الشحن</p>}
        </div>
        <nav style={{ display: 'grid', gap: 12 }}>
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)} style={{ ...navButton, ...(activeMenu === item.id ? activeButton : {}) }}>
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <section style={{ flex: 1, padding: 28, overflowX: 'hidden' }}>
        {activeMenu === 'salla' && <SallaPage excelFile={excelFile} setExcelFile={setExcelFile} />}
        {activeMenu === 'invoice' && <InvoicePage pdfFile={pdfFile} setPdfFile={setPdfFile} selectedCarrier={selectedCarrier} setSelectedCarrier={setSelectedCarrier} />}
        {activeMenu === 'carrier' && <AddCarrierPage newCarrierName={newCarrierName} setNewCarrierName={setNewCarrierName} />}
        {activeMenu === 'companies' && <CompaniesPage />}
      </section>
    </main>
  )
}

function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <header style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: 34 }}>{title}</h2>
      <p style={{ color: '#667085', marginTop: 8 }}>{desc}</p>
    </header>
  )
}

function SallaPage({ excelFile, setExcelFile }: { excelFile: string; setExcelFile: (v: string) => void }) {
  return (
    <>
      <PageHeader title="رفع بيانات سلة" desc="استيراد ملف شحنات سلة وتجهيزه للمطابقة مع فواتير شركات الشحن." />
      <Stats />
      <div style={cardStyle}>
        <h3 style={titleStyle}>رفع ملف شحنات سلة</h3>
        <p style={descStyle}>ارفع ملف Excel الصادر من سلة ويحتوي على رقم الطلب، رقم البوليصة، شركة الشحن، ومبلغ الشحن المحصل من العميل.</p>
        <label style={uploadButton}>رفع ملف Excel<input hidden type="file" accept=".xlsx,.xls" onChange={(e) => { const file = e.target.files?.[0]; if (file) setExcelFile(file.name) }} /></label>
        {excelFile && <div style={successBox}>✅ تم رفع ملف سلة: {excelFile}</div>}
      </div>
    </>
  )
}

function InvoicePage({ pdfFile, setPdfFile, selectedCarrier, setSelectedCarrier }: { pdfFile: string; setPdfFile: (v: string) => void; selectedCarrier: string; setSelectedCarrier: (v: string) => void }) {
  return (
    <>
      <PageHeader title="رفع فاتورة جديدة" desc="ارفع PDF الفاتورة ثم اختر شركة الشحن قبل الحفظ حتى تُدرج الفاتورة داخل سجل الشركة نفسها." />
      <div style={cardStyle}>
        <h3 style={titleStyle}>بيانات فاتورة شركة الشحن</h3>
        <div style={{ display: 'grid', gap: 14 }}>
          <label style={uploadButton}>رفع ملف PDF<input hidden type="file" accept="application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPdfFile(file.name) }} /></label>
          {pdfFile && <div style={successBox}>📄 تم رفع الفاتورة: {pdfFile}</div>}
          <select value={selectedCarrier} onChange={(e) => setSelectedCarrier(e.target.value)} style={selectStyle}>
            <option value="">اختر شركة الشحن قبل الحفظ</option>
            {carriers.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}
          </select>
          <button disabled={!selectedCarrier || !pdfFile} onClick={() => alert(`تم حفظ الفاتورة داخل شركة ${selectedCarrier}`)} style={{ ...saveButton, opacity: !selectedCarrier || !pdfFile ? .5 : 1, cursor: !selectedCarrier || !pdfFile ? 'not-allowed' : 'pointer' }}>حفظ الفاتورة داخل سجل الشركة</button>
        </div>
      </div>
    </>
  )
}

function AddCarrierPage({ newCarrierName, setNewCarrierName }: { newCarrierName: string; setNewCarrierName: (v: string) => void }) {
  return (
    <>
      <PageHeader title="إضافة شركة شحن" desc="أضف شركة شحن جديدة حتى تظهر في خيارات رفع الفواتير والمطابقة." />
      <div style={cardStyle}>
        <h3 style={titleStyle}>بيانات الشركة</h3>
        <input value={newCarrierName} onChange={(e) => setNewCarrierName(e.target.value)} placeholder="مثال: أرامكس" style={inputStyle} />
        <button disabled={!newCarrierName} onClick={() => alert(`تمت إضافة شركة: ${newCarrierName}`)} style={{ ...saveButton, marginTop: 14, opacity: newCarrierName ? 1 : .5 }}>حفظ شركة الشحن</button>
      </div>
    </>
  )
}

function CompaniesPage() {
  return (
    <>
      <PageHeader title="شركات الشحن" desc="عرض شركات الشحن المسجلة وعدد الفواتير المرتبطة بكل شركة." />
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead><tr style={{ background: '#eef2f7' }}><th style={th}>شركة الشحن</th><th style={th}>عدد الفواتير</th><th style={th}>الحالة</th></tr></thead>
          <tbody>{companyRows.map((row) => <tr key={row.name} style={{ borderBottom: '1px solid #edf0f5' }}><td style={td}>{row.name}</td><td style={td}>{row.invoices}</td><td style={td}>{row.status}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}

function Stats() {
  const stats = [
    { label: 'إجمالي المحصل من العملاء', value: '134 ر.س' },
    { label: 'إجمالي فواتير الشحن', value: '162 ر.س' },
    { label: 'صافي ربح/خسارة الشحن', value: '-28 ر.س' },
    { label: 'شحنات تحتاج مراجعة', value: '3' },
  ]
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 22 }}>{stats.map((card) => <div key={card.label} style={cardStyle}><p style={{ color: '#667085', margin: 0 }}>{card.label}</p><strong style={{ display: 'block', marginTop: 14, fontSize: 32 }}>{card.value}</strong></div>)}</div>
}

const sidebarStyle: CSSProperties = { background: '#142143', color: 'white', minHeight: '100vh', padding: 24, transition: '.25s ease', position: 'sticky', top: 0 }
const collapseButton: CSSProperties = { background: 'transparent', border: 0, color: 'white', fontSize: 26, cursor: 'pointer', marginBottom: 18 }
const navButton: CSSProperties = { width: '100%', border: 0, background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderRadius: 16, fontWeight: 700, cursor: 'pointer' }
const activeButton: CSSProperties = { background: '#d8d0bd', color: '#142143' }
const cardStyle: CSSProperties = { background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(20,33,67,.08)', marginBottom: 18 }
const uploadButton: CSSProperties = { display: 'block', width: '100%', background: '#142143', color: 'white', borderRadius: 14, padding: '16px', fontWeight: 700, textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box' }
const selectStyle: CSSProperties = { width: '100%', padding: '15px', borderRadius: 14, border: '1px solid #d0d5dd', background: '#f8fafc', fontWeight: 700 }
const saveButton: CSSProperties = { width: '100%', background: '#d8d0bd', color: '#142143', border: 0, borderRadius: 14, padding: '16px', fontWeight: 700 }
const successBox: CSSProperties = { background: '#ecfdf3', color: '#027a48', padding: 12, borderRadius: 12, fontWeight: 700, marginTop: 12 }
const descStyle: CSSProperties = { color: '#667085', lineHeight: 1.9 }
const titleStyle: CSSProperties = { marginTop: 0, fontSize: 28 }
const inputStyle: CSSProperties = { width: '100%', padding: 15, borderRadius: 14, border: '1px solid #d0d5dd', fontWeight: 700, boxSizing: 'border-box' }
const th: CSSProperties = { padding: 14 }
const td: CSSProperties = { padding: 14, color: '#344054' }
