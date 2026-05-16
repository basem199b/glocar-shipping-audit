"use client"

import type { CSSProperties } from 'react'
import { useState } from 'react'

const menuItems = [
  { id: 'salla', label: 'رفع بيانات سلة', icon: '📤' },
  { id: 'invoice', label: 'رفع فاتورة جديدة', icon: '📄' },
  { id: 'carrier', label: 'إضافة شركة شحن', icon: '➕' },
  { id: 'companies', label: 'شركات الشحن', icon: '🚗' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
]

const initialCarriers = [
  { id: 1, name: 'أرامكس', invoices: 12, status: 'نشطة' },
  { id: 2, name: 'DHL', invoices: 4, status: 'نشطة' },
  { id: 3, name: 'سمسا', invoices: 7, status: 'نشطة' },
]

const initialInvoices = [
  { id: 1, carrier: 'أرامكس', month: 'مارس 2026', shipments: 128, amount: 2460, invoiceFile: 'invoice-aramex-mar.pdf', paid: true, receipt: 'receipt-aramex-mar.pdf', paidAt: '2026-04-03' },
  { id: 2, carrier: 'أرامكس', month: 'أبريل 2026', shipments: 96, amount: 1880, invoiceFile: 'invoice-aramex-apr.pdf', paid: false, receipt: '', paidAt: '' },
  { id: 3, carrier: 'DHL', month: 'أبريل 2026', shipments: 41, amount: 1320, invoiceFile: 'invoice-dhl-apr.pdf', paid: false, receipt: '', paidAt: '' },
  { id: 4, carrier: 'سمسا', month: 'مايو 2026', shipments: 64, amount: 1125, invoiceFile: 'invoice-smsa-may.pdf', paid: true, receipt: 'receipt-smsa-may.pdf', paidAt: '2026-05-15' },
]

const sampleShipments = [
  { carrier: 'أرامكس', waybill: '341997001', source: 'سلة', order: 'ORD-1001', amount: 18, status: 'مفوترة' },
  { carrier: 'أرامكس', waybill: '341997002', source: 'سلة', order: 'ORD-1002', amount: 0, status: 'غير مفوترة' },
  { carrier: 'أرامكس', waybill: '341997003', source: 'الفاتورة', order: 'غير مطابق', amount: 22, status: 'مفوترة' },
  { carrier: 'DHL', waybill: 'DHL-7781', source: 'سلة', order: 'ORD-1008', amount: 35, status: 'غير مفوترة' },
  { carrier: 'سمسا', waybill: 'SMSA-4491', source: 'الفاتورة', order: 'ORD-1012', amount: 19, status: 'مفوترة' },
]

export default function HomePage() {
  const [activeMenu, setActiveMenu] = useState('salla')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCarrier, setSelectedCarrier] = useState('')
  const [excelFile, setExcelFile] = useState('')
  const [pdfFile, setPdfFile] = useState('')
  const [newCarrierName, setNewCarrierName] = useState('')
  const [carriers, setCarriers] = useState(initialCarriers)
  const [deletedCarriers, setDeletedCarriers] = useState<typeof initialCarriers>([])
  const [invoices, setInvoices] = useState(initialInvoices)

  const addCarrier = () => { if (!newCarrierName.trim()) return; setCarriers([...carriers, { id: Date.now(), name: newCarrierName.trim(), invoices: 0, status: 'نشطة' }]); setNewCarrierName('') }
  const deleteCarrier = (id: number) => { const carrier = carriers.find((item) => item.id === id); if (!carrier) return; setCarriers(carriers.filter((item) => item.id !== id)); setDeletedCarriers([{ ...carrier, status: 'محذوفة' }, ...deletedCarriers]) }
  const restoreCarrier = (id: number) => { const carrier = deletedCarriers.find((item) => item.id === id); if (!carrier) return; setDeletedCarriers(deletedCarriers.filter((item) => item.id !== id)); setCarriers([{ ...carrier, status: 'نشطة' }, ...carriers]) }
  const attachReceipt = (invoiceId: number, fileName: string) => { const today = new Date().toISOString().slice(0, 10); setInvoices(invoices.map((invoice) => invoice.id === invoiceId ? { ...invoice, paid: true, receipt: fileName, paidAt: today } : invoice)) }
  const deleteReceipt = (invoiceId: number) => { setInvoices(invoices.map((invoice) => invoice.id === invoiceId ? { ...invoice, paid: false, receipt: '', paidAt: '' } : invoice)) }
  const carrierNames = carriers.map((carrier) => carrier.name)

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6fb', direction: 'rtl', fontFamily: 'Arial', display: 'flex' }}>
      <aside style={{ ...sidebarStyle, width: sidebarOpen ? 260 : 64 }}>
        <div style={{ display: 'grid', placeItems: sidebarOpen ? 'stretch' : 'center', gap: 14, marginBottom: 28 }}>
          <div style={brandWrap}>
            <div style={logoCircle}>G</div>
            {sidebarOpen && <div><h1 style={brandTitle}>GLO CAR</h1><p style={brandSub}>تدقيق فواتير الشحن</p></div>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={collapseButton}>{sidebarOpen ? '×' : '☰'}</button>
        </div>
        <nav style={{ display: 'grid', gap: 12 }}>{menuItems.map((item) => <button key={item.id} onClick={() => setActiveMenu(item.id)} title={item.label} style={{ ...navButton, ...(sidebarOpen ? navButtonOpen : navButtonClosed), ...(activeMenu === item.id ? activeButton : {}) }}><span>{item.icon}</span>{sidebarOpen && <span>{item.label}</span>}</button>)}</nav>
      </aside>
      <section style={{ flex: 1, padding: 28, overflowX: 'hidden' }}>
        {activeMenu === 'salla' && <SallaPage excelFile={excelFile} setExcelFile={setExcelFile} carriers={carrierNames} />}
        {activeMenu === 'invoice' && <InvoicePage pdfFile={pdfFile} setPdfFile={setPdfFile} selectedCarrier={selectedCarrier} setSelectedCarrier={setSelectedCarrier} carriers={carrierNames} />}
        {activeMenu === 'carrier' && <CarrierManagementPage newCarrierName={newCarrierName} setNewCarrierName={setNewCarrierName} addCarrier={addCarrier} carriers={carriers} deletedCarriers={deletedCarriers} deleteCarrier={deleteCarrier} restoreCarrier={restoreCarrier} />}
        {activeMenu === 'companies' && <CarrierReportsPage carriers={carriers} invoices={invoices} attachReceipt={attachReceipt} deleteReceipt={deleteReceipt} />}
        {activeMenu === 'reports' && <ReportsPage />}
      </section>
    </main>
  )
}

function PageHeader({ title, desc }: { title: string; desc: string }) { return <header style={{ marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 34 }}>{title}</h2><p style={{ color: '#667085', marginTop: 8 }}>{desc}</p></header> }
function openAttachment(fileName: string) { if (!fileName) return; alert(`معاينة الملف: ${fileName}\n\nفي النسخة القادمة سيتم فتح الملف الفعلي من التخزين بعد ربط قاعدة البيانات والملفات.`) }

function ReportsPage() {
  return <><PageHeader title="التقارير" desc="ملخص عام لأداء الشحن والفواتير والسداد." /><div style={miniGrid}><div style={cardStyle}><h3 style={titleStyle}>إجمالي الفواتير</h3><strong style={bigNumber}>4</strong></div><div style={cardStyle}><h3 style={titleStyle}>الفواتير المسددة</h3><strong style={bigNumber}>2</strong></div><div style={cardStyle}><h3 style={titleStyle}>غير المسدد</h3><strong style={bigNumber}>2</strong></div><div style={cardStyle}><h3 style={titleStyle}>إجمالي مبالغ الفواتير</h3><strong style={bigNumber}>6,785 ر.س</strong></div></div></>
}

function SallaPage({ excelFile, setExcelFile, carriers }: { excelFile: string; setExcelFile: (v: string) => void; carriers: string[] }) {
  const grouped = carriers.map((carrier) => ({ carrier, count: sampleShipments.filter((s) => s.carrier === carrier && s.source === 'سلة').length }))
  return <><PageHeader title="رفع بيانات سلة" desc="ارفع ملف سلة فقط، والنظام يفرز كل طلب تلقائيًا حسب شركة الشحن المسجلة في الملف." /><div style={cardStyle}><h3 style={titleStyle}>رفع ملف بيانات سلة</h3><label style={uploadButton}>رفع ملف Excel<input hidden type="file" accept=".xlsx,.xls" onChange={(e) => { const file = e.target.files?.[0]; if (file) setExcelFile(file.name) }} /></label>{excelFile && <div style={successBox}>✅ تم رفع ملف سلة: {excelFile}</div>}<p style={noteStyle}>قاعدة الفرز: لا يتم خلط الطلبات. طلبات أرامكس تذهب لأرامكس، وطلبات DHL تذهب لـ DHL، وكل شركة تُسجل طلباتها في ملفها وتقريرها الخاص.</p>{excelFile && <div style={miniGrid}>{grouped.map((item) => <div key={item.carrier} style={miniCard}><strong>{item.carrier}</strong><span>{item.count} شحنات موجهة</span></div>)}</div>}</div></>
}

function CarrierReportsPage({ carriers, invoices, attachReceipt, deleteReceipt }: { carriers: typeof initialCarriers; invoices: typeof initialInvoices; attachReceipt: (invoiceId: number, fileName: string) => void; deleteReceipt: (invoiceId: number) => void }) {
  const [selectedReportCarrier, setSelectedReportCarrier] = useState(carriers[0]?.name || '')
  const [reportView, setReportView] = useState<'shipments' | 'invoices'>('shipments')
  const selectedInvoices = invoices.filter((item) => item.carrier === selectedReportCarrier)
  const selectedShipments = sampleShipments.filter((item) => item.carrier === selectedReportCarrier)
  return <><PageHeader title="شركات الشحن" desc="تقارير فواتير وشحنات كل شركة شحن مضافة في النظام." /><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>{carriers.map((carrier) => <button key={carrier.id} onClick={() => setSelectedReportCarrier(carrier.name)} style={{ ...carrierButton, ...(selectedReportCarrier === carrier.name ? activeCarrierButton : {}) }}>{carrier.name}</button>)}</div><div style={cardStyle}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}><div><h3 style={titleStyle}>تقرير {selectedReportCarrier || 'شركة الشحن'}</h3><p style={descStyle}>اختر عرض الفواتير أو قائمة الشحنات المسجلة من سلة ومن الفواتير.</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => setReportView('shipments')} style={{ ...tabButton, ...(reportView === 'shipments' ? activeTabButton : {}) }}>قائمة الشحنات</button><button onClick={() => setReportView('invoices')} style={{ ...tabButton, ...(reportView === 'invoices' ? activeTabButton : {}) }}>الفواتير</button></div></div>{reportView === 'shipments' && <table style={tableStyle}><thead><tr style={{ background: '#eef2f7' }}><th style={th}>رقم البوليصة</th><th style={th}>المصدر</th><th style={th}>رقم الطلب</th><th style={th}>المبلغ</th><th style={th}>الحالة</th></tr></thead><tbody>{selectedShipments.map((row) => <tr key={row.waybill} style={{ borderBottom: '1px solid #edf0f5' }}><td style={td}>{row.waybill}</td><td style={td}>{row.source}</td><td style={td}>{row.order}</td><td style={td}>{row.amount} ر.س</td><td style={td}><span style={row.status === 'مفوترة' ? greenBadge : yellowBadge}>{row.status}</span></td></tr>)}</tbody></table>}{reportView === 'invoices' && <table style={tableStyle}><thead><tr style={{ background: '#eef2f7' }}><th style={th}>شهر الفاتورة</th><th style={th}>عدد الشحنات</th><th style={th}>مبلغ الفاتورة</th><th style={th}>الفاتورة</th><th style={th}>حالة السداد</th><th style={th}>إيصال السداد</th><th style={th}>تاريخ السداد</th><th style={th}>تعديل الإيصال</th></tr></thead><tbody>{selectedInvoices.map((row) => <tr key={row.id} style={{ borderBottom: '1px solid #edf0f5' }}><td style={td}>{row.month}</td><td style={td}>{row.shipments}</td><td style={td}>{row.amount} ر.س</td><td style={td}><button onClick={() => openAttachment(row.invoiceFile)} style={viewButton}>رؤية الفاتورة</button></td><td style={td}><span style={row.paid ? greenBadge : yellowBadge}>{row.paid ? 'مسدد' : 'غير مسدد'}</span></td><td style={td}>{row.receipt ? <button onClick={() => openAttachment(row.receipt)} style={viewButton}>رؤية الإيصال</button> : <label style={smallUploadButton}>إرفاق إيصال<input hidden type="file" accept="image/*,application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) attachReceipt(row.id, file.name) }} /></label>}</td><td style={td}>{row.paidAt || '—'}</td><td style={td}>{row.receipt ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={() => deleteReceipt(row.id)} style={dangerButton}>حذف الإيصال</button><label style={smallUploadButton}>إعادة إرفاق<input hidden type="file" accept="image/*,application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) attachReceipt(row.id, file.name) }} /></label></div> : '—'}</td></tr>)}</tbody></table>}</div></>
}

function InvoicePage({ pdfFile, setPdfFile, selectedCarrier, setSelectedCarrier, carriers }: { pdfFile: string; setPdfFile: (v: string) => void; selectedCarrier: string; setSelectedCarrier: (v: string) => void; carriers: string[] }) { return <><PageHeader title="رفع فاتورة جديدة" desc="ارفع PDF الفاتورة ثم اختر شركة الشحن قبل الحفظ حتى تُدرج الفاتورة داخل سجل الشركة نفسها." /><div style={cardStyle}><h3 style={titleStyle}>بيانات فاتورة شركة الشحن</h3><div style={{ display: 'grid', gap: 14 }}><label style={uploadButton}>رفع ملف PDF<input hidden type="file" accept="application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPdfFile(file.name) }} /></label>{pdfFile && <div style={successBox}>📄 تم رفع الفاتورة: {pdfFile}</div>}<select value={selectedCarrier} onChange={(e) => setSelectedCarrier(e.target.value)} style={selectStyle}><option value="">اختر شركة الشحن قبل الحفظ</option>{carriers.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}</select><button disabled={!selectedCarrier || !pdfFile} onClick={() => alert(`تم حفظ الفاتورة داخل شركة ${selectedCarrier}`)} style={{ ...saveButton, opacity: !selectedCarrier || !pdfFile ? .5 : 1, cursor: !selectedCarrier || !pdfFile ? 'not-allowed' : 'pointer' }}>حفظ الفاتورة داخل سجل الشركة</button></div></div></> }
function CarrierManagementPage({ newCarrierName, setNewCarrierName, addCarrier, carriers, deletedCarriers, deleteCarrier, restoreCarrier }: { newCarrierName: string; setNewCarrierName: (v: string) => void; addCarrier: () => void; carriers: typeof initialCarriers; deletedCarriers: typeof initialCarriers; deleteCarrier: (id: number) => void; restoreCarrier: (id: number) => void }) { return <><PageHeader title="إضافة شركة شحن" desc="أضف شركة شحن جديدة، واستعرض الشركات الحالية، واحذف أو استرجع الشركات من سجل المحذوفات." /><div style={cardStyle}><h3 style={titleStyle}>إضافة شركة شحن</h3><input value={newCarrierName} onChange={(e) => setNewCarrierName(e.target.value)} placeholder="مثال: أرامكس" style={inputStyle} /><button disabled={!newCarrierName.trim()} onClick={addCarrier} style={{ ...saveButton, marginTop: 14, opacity: newCarrierName.trim() ? 1 : .5 }}>حفظ شركة الشحن</button></div><div style={cardStyle}><h3 style={titleStyle}>شركات الشحن</h3><p style={descStyle}>عند حذف شركة شحن يتم حذف ربطها من القواعد والاختيارات الحالية، ويمكن استرجاعها لاحقًا من سجل المحذوفات.</p><table style={tableStyle}><thead><tr style={{ background: '#eef2f7' }}><th style={th}>شركة الشحن</th><th style={th}>عدد الفواتير</th><th style={th}>الحالة</th><th style={th}>إجراء</th></tr></thead><tbody>{carriers.map((row) => <tr key={row.id} style={{ borderBottom: '1px solid #edf0f5' }}><td style={td}>{row.name}</td><td style={td}>{row.invoices}</td><td style={td}>{row.status}</td><td style={td}><button onClick={() => deleteCarrier(row.id)} style={dangerButton}>حذف</button></td></tr>)}</tbody></table></div><div style={cardStyle}><h3 style={titleStyle}>سجل المحذوفات والاسترجاع</h3>{deletedCarriers.length === 0 ? <p style={descStyle}>لا توجد شركات محذوفة حاليًا.</p> : <table style={tableStyle}><thead><tr style={{ background: '#eef2f7' }}><th style={th}>شركة الشحن</th><th style={th}>الحالة</th><th style={th}>إجراء</th></tr></thead><tbody>{deletedCarriers.map((row) => <tr key={row.id} style={{ borderBottom: '1px solid #edf0f5' }}><td style={td}>{row.name}</td><td style={td}>{row.status}</td><td style={td}><button onClick={() => restoreCarrier(row.id)} style={restoreButton}>استرجاع</button></td></tr>)}</tbody></table>}</div></> }

const sidebarStyle: CSSProperties = { background: '#142143', color: 'white', minHeight: '100vh', padding: '14px 8px', transition: '.25s ease', position: 'sticky', top: 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }
const collapseButton: CSSProperties = { width: 44, height: 44, borderRadius: '50%', background: '#0f1b39', border: '1px solid rgba(255,255,255,.16)', color: 'white', fontSize: 24, cursor: 'pointer', display: 'grid', placeItems: 'center' }
const brandWrap: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden' }
const logoCircle: CSSProperties = { width: 48, height: 48, borderRadius: '50%', background: '#d8d0bd', color: '#142143', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, flexShrink: 0 }
const brandTitle: CSSProperties = { margin: 0, fontSize: 22, letterSpacing: 1, whiteSpace: 'nowrap' }
const brandSub: CSSProperties = { margin: '4px 0 0', color: '#d8d0bd', fontSize: 12, whiteSpace: 'nowrap' }
const navButton: CSSProperties = { border: 0, background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 999, fontWeight: 700, cursor: 'pointer', boxSizing: 'border-box' }
const navButtonOpen: CSSProperties = { width: '100%', justifyContent: 'flex-start', padding: '14px 16px' }
const navButtonClosed: CSSProperties = { width: 48, height: 48, justifyContent: 'center', padding: 0 }
const activeButton: CSSProperties = { background: '#d8d0bd', color: '#142143' }
const cardStyle: CSSProperties = { background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(20,33,67,.08)', marginBottom: 18 }
const uploadButton: CSSProperties = { display: 'block', width: '100%', background: '#142143', color: 'white', borderRadius: 14, padding: '16px', fontWeight: 700, textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box' }
const smallUploadButton: CSSProperties = { display: 'inline-block', background: '#142143', color: 'white', borderRadius: 10, padding: '9px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }
const viewButton: CSSProperties = { background: '#eef2f7', color: '#142143', border: '1px solid #d0d5dd', borderRadius: 10, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }
const selectStyle: CSSProperties = { width: '100%', padding: '15px', borderRadius: 14, border: '1px solid #d0d5dd', background: '#f8fafc', fontWeight: 700 }
const saveButton: CSSProperties = { width: '100%', background: '#d8d0bd', color: '#142143', border: 0, borderRadius: 14, padding: '16px', fontWeight: 700 }
const dangerButton: CSSProperties = { background: '#fee2e2', color: '#b42318', border: 0, borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }
const restoreButton: CSSProperties = { background: '#dcfce7', color: '#027a48', border: 0, borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }
const carrierButton: CSSProperties = { background: 'white', color: '#142143', border: '1px solid #d0d5dd', borderRadius: 14, padding: '14px 20px', fontWeight: 800, cursor: 'pointer' }
const activeCarrierButton: CSSProperties = { background: '#142143', color: 'white' }
const tabButton: CSSProperties = { background: '#f8fafc', color: '#142143', border: '1px solid #d0d5dd', borderRadius: 12, padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }
const activeTabButton: CSSProperties = { background: '#d8d0bd', borderColor: '#d8d0bd' }
const greenBadge: CSSProperties = { background: '#dcfce7', color: '#027a48', borderRadius: 999, padding: '7px 12px', fontWeight: 800 }
const yellowBadge: CSSProperties = { background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '7px 12px', fontWeight: 800 }
const successBox: CSSProperties = { background: '#ecfdf3', color: '#027a48', padding: 12, borderRadius: 12, fontWeight: 700, marginTop: 12 }
const noteStyle: CSSProperties = { color: '#344054', lineHeight: 1.9, background: '#f8fafc', padding: 14, borderRadius: 14, marginTop: 14 }
const miniGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginTop: 14 }
const miniCard: CSSProperties = { background: '#eef2f7', borderRadius: 14, padding: 14, display: 'grid', gap: 6 }
const bigNumber: CSSProperties = { display: 'block', marginTop: 12, fontSize: 34 }
const descStyle: CSSProperties = { color: '#667085', lineHeight: 1.9 }
const titleStyle: CSSProperties = { marginTop: 0, fontSize: 28 }
const inputStyle: CSSProperties = { width: '100%', padding: 15, borderRadius: 14, border: '1px solid #d0d5dd', fontWeight: 700, boxSizing: 'border-box' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' }
const th: CSSProperties = { padding: 14 }
const td: CSSProperties = { padding: 14, color: '#344054' }
