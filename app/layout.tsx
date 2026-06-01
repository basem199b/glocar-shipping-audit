export const metadata = {
  title: 'GLO CAR Shipping Audit',
  description: 'Shipping Invoice Audit System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <style>{`
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          * { box-sizing: border-box; }
          body { margin: 0; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}