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

const stats = [
  { label: 'إجمالي المحصل من العملاء', value: '134 ر.س' },
  { label: 'إجمالي فواتير الشحن', value: '162 ر.س' },
  { label: 'صافي ربح/خسارة الشحن', value: '-28 ر.س' },
  { label: 'شحنات تحتاج مراجعة', value: '3' },
]

export default function HomePage() {
  const [activeMenu, setActiveMenu] = useState('salla')
  const [selectedCarrier, setSelectedCarrier] = useState('')
  const [excelFile, setExcelFile] = useState('')
  const [pdfFile, setPdfFile] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6fb', direction: 'rtl', fontFamily: 'Arial', display: 'flex' }}>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={menuButton}>☰</button>

      <aside style={{ ...sidebarStyle, ...(sidebarOpen ? sidebarMobileOpen : {}) }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ margin: 0, fontSize: 38 }}>GLO CAR</h1>
          <p style={{ color: '#d8d0bd', marginTop: 8 }}>تدقيق فواتير الشحن</p>
        </div>

        <nav style={{ display: 'grid', gap: 12 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id)
                setSidebarOpen(false)
              }}
              style={{
                ...navButton,
                ...(activeMenu === item.id ? activeButton : {}),
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section style={{ flex: 1, padding: 28 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 34 }}>
              {activeMenu === 'salla' && 'رفع بيانات سلة'}
              {activeMenu === 'invoice' && 'رفع فاتورة جديدة'}
              {activeMenu === 'carrier' && 'إضافة شركة شحن'}
              {activeMenu === 'companies' && 'شركات الشحن'}
            </h2>
            <p style={{ color: '#667085' }}>نظام ذكي لمراجعة ومطابقة تكاليف الشحن.</p>
          </div>

          <button style={primaryButton}>+ فاتورة شحن جديدة</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 22 }}>
          {stats.map((card) => (
            <div key={card.label} style={cardStyle}>
              <p style={{ color: '#667085', margin: 0 }}>{card.label}</p>
              <strong style={{ display: 'block', marginTop: 14, fontSize: 32 }}>{card.value}</strong>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: 28 }}>رفع ملف شحنات سلة</h3>
            <p style={desc}>ارفع ملف Excel الصادر من سلة لبدء المطابقة.</p>

            <label style={uploadButton}>
              رفع ملف Excel
              <input
                hidden
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setExcelFile(file.name)
                }}
              />
            </label>

            {excelFile && <div style={successBox}>✅ تم رفع: {excelFile}</div>}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: 28 }}>رفع فاتورة جديدة</h3>
            <p style={desc}>ارفع الفاتورة ثم اختر شركة الشحن قبل الحفظ.</p>

            <div style={{ display: 'grid', gap: 12 }}>
              <label style={uploadButton}>
                رفع ملف PDF
                <input
                  hidden
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setPdfFile(file.name)
                  }}
                />
              </label>

              {pdfFile && <div style={successBox}>📄 تم رفع: {pdfFile}</div>}

              <select value={selectedCarrier} onChange={(e) => setSelectedCarrier(e.target.value)} style={selectStyle}>
                <option value="">اختر شركة الشحن</option>
                {carriers.map((carrier) => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>

              <button
                disabled={!selectedCarrier || !pdfFile}
                onClick={() => alert(`تم حفظ الفاتورة داخل شركة ${selectedCarrier}`)}
                style={{
                  ...saveButton,
                  opacity: !selectedCarrier || !pdfFile ? 0.5 : 1,
                  cursor: !selectedCarrier || !pdfFile ? 'not-allowed' : 'pointer',
                }}
              >
                حفظ الفاتورة
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

const sidebarStyle: CSSProperties = {
  width: 260,
  background: '#142143',
  color: 'white',
  minHeight: '100vh',
  padding: 24,
  transition: '.3s',
}

const sidebarMobileOpen: CSSProperties = {
  transform: 'translateX(0)',
}

const menuButton: CSSProperties = {
  position: 'fixed',
  top: 14,
  right: 14,
  zIndex: 999,
  background: '#142143',
  color: 'white',
  border: 0,
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 22,
  cursor: 'pointer',
}

const navButton: CSSProperties = {
  width: '100%',
  border: 0,
  background: 'transparent',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px',
  borderRadius: 16,
  fontWeight: 700,
  cursor: 'pointer',
}

const activeButton: CSSProperties = {
  background: '#d8d0bd',
  color: '#142143',
}

const cardStyle: CSSProperties = {
  background: 'white',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 10px 30px rgba(20,33,67,.08)',
}

const primaryButton: CSSProperties = {
  background: '#142143',
  color: 'white',
  border: 0,
  borderRadius: 14,
  padding: '14px 18px',
  fontWeight: 700,
}

const uploadButton: CSSProperties = {
  width: '100%',
  background: '#142143',
  color: 'white',
  border: 0,
  borderRadius: 14,
  padding: '16px',
  fontWeight: 700,
  textAlign: 'center',
  cursor: 'pointer',
}

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '15px',
  borderRadius: 14,
  border: '1px solid #d0d5dd',
  background: '#f8fafc',
  fontWeight: 700,
}

const saveButton: CSSProperties = {
  width: '100%',
  background: '#d8d0bd',
  color: '#142143',
  border: 0,
  borderRadius: 14,
  padding: '16px',
  fontWeight: 700,
}

const successBox: CSSProperties = {
  background: '#ecfdf3',
  color: '#027a48',
  padding: 12,
  borderRadius: 12,
  fontWeight: 700,
}

const desc: CSSProperties = {
  color: '#667085',
  lineHeight: 1.9,
}
