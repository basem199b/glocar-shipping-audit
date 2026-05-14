export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#142143',
      color: 'white',
      fontFamily: 'sans-serif',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '42px', fontWeight: 'bold' }}>
        GLO CAR
      </h1>

      <p style={{ fontSize: '20px' }}>
        نظام تدقيق فواتير شركات الشحن
      </p>

      <div style={{
        background: 'white',
        color: '#142143',
        padding: '12px 20px',
        borderRadius: '12px',
        fontWeight: 'bold'
      }}>
        النظام يعمل بنجاح 🚚
      </div>
    </main>
  )
}
