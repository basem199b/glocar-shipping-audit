const shipments = [
  { waybill: 'GLC-100245', order: 'ORD-8821', carrier: 'Aramex', collected: 35, billed: 18, status: 'مطابق', profit: 17 },
  { waybill: 'GLC-100246', order: 'ORD-8822', carrier: 'DHL', collected: 35, billed: 52, status: 'فرق تكلفة', profit: -17 },
  { waybill: 'GLC-100247', order: 'ORD-8823', carrier: 'SMSA', collected: 29, billed: 0, status: 'بانتظار الفوترة', profit: 29 },
  { waybill: 'GLC-100248', order: 'غير معروف', carrier: 'Aramex', collected: 0, billed: 22, status: 'غير تابع لنا', profit: -22 },
  { waybill: 'GLC-100249', order: 'ORD-8824', carrier: 'Aramex', collected: 35, billed: 70, status: 'رجيع', profit: -35 },
]

const cards = [
  { label: 'إجمالي المحصل من العملاء', value: '134 ر.س' },
  { label: 'إجمالي فواتير الشحن', value: '162 ر.س' },
  { label: 'صافي ربح/خسارة الشحن', value: '-28 ر.س' },
  { label: 'شحنات تحتاج مراجعة', value: '3' },
]

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f5f7fb', color: '#142143', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      <header style={{ background: '#142143', color: 'white', padding: '28px 42px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>GLO CAR</h1>
          <p style={{ margin: '8px 0 0', opacity: .85 }}>نظام تدقيق فواتير شركات الشحن</p>
        </div>
        <button style={{ background: '#fff', color: '#142143', border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 700 }}>+ فاتورة شحن جديدة</button>
      </header>

      <section style={{ padding: 32, display: 'grid', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          {cards.map((card) => (
            <div key={card.label} style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 8px 24px rgba(20,33,67,.08)' }}>
              <p style={{ margin: 0, color: '#667085', fontSize: 14 }}>{card.label}</p>
              <strong style={{ display: 'block', marginTop: 10, fontSize: 26 }}>{card.value}</strong>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 8px 24px rgba(20,33,67,.08)' }}>
            <h2 style={{ marginTop: 0 }}>رفع بيانات سلة</h2>
            <p style={{ color: '#667085' }}>ارفع ملف Excel الصادر من سلة ويحتوي على رقم الطلب، رقم البوليصة، شركة الشحن، ومبلغ الشحن المحصل من العميل.</p>
            <button style={uploadButton}>رفع ملف Excel</button>
          </div>
          <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 8px 24px rgba(20,33,67,.08)' }}>
            <h2 style={{ marginTop: 0 }}>رفع فاتورة شركة الشحن</h2>
            <p style={{ color: '#667085' }}>ارفع PDF فاتورة شركة الشحن لاستخراج البوالص والتكاليف ومطابقتها مع بيانات سلة.</p>
            <button style={uploadButton}>رفع ملف PDF</button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 8px 24px rgba(20,33,67,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>نتائج المطابقة</h2>
              <p style={{ margin: '6px 0 0', color: '#667085' }}>كشف البوالص المطابقة، المكررة، غير التابعة، والرجيع.</p>
            </div>
            <button style={{ background: '#18a058', color: 'white', border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 700 }}>اعتماد وإقفال الفاتورة</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#eef2f7' }}>
                {['رقم البوليصة', 'رقم الطلب', 'الشركة', 'محصل من العميل', 'فاتورة الشركة', 'النتيجة', 'الربح/الخسارة'].map((h) => (
                  <th key={h} style={{ padding: 14 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.waybill} style={{ borderBottom: '1px solid #edf0f5' }}>
                  <td style={td}>{s.waybill}</td>
                  <td style={td}>{s.order}</td>
                  <td style={td}>{s.carrier}</td>
                  <td style={td}>{s.collected} ر.س</td>
                  <td style={td}>{s.billed} ر.س</td>
                  <td style={td}><span style={badge(s.status)}>{s.status}</span></td>
                  <td style={{ ...td, color: s.profit >= 0 ? '#15803d' : '#b42318', fontWeight: 700 }}>{s.profit} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

const uploadButton = {
  width: '100%',
  background: '#142143',
  color: 'white',
  border: 0,
  borderRadius: 12,
  padding: '14px 18px',
  fontWeight: 700,
  cursor: 'pointer',
}

const td = { padding: 14, color: '#344054' }

function badge(status: string) {
  const colors: Record<string, string> = {
    'مطابق': '#dcfce7',
    'فرق تكلفة': '#fef3c7',
    'بانتظار الفوترة': '#e0f2fe',
    'غير تابع لنا': '#fee2e2',
    'رجيع': '#fde68a',
  }
  return { background: colors[status] || '#eee', padding: '7px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700 }
}
