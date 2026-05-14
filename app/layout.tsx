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
      <body>{children}</body>
    </html>
  )
}
