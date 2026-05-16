const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL || ''

async function request(action: string, payload?: Record<string, unknown>) {
  if (!API_URL) throw new Error('رابط قاعدة بيانات Google Sheet غير مضبوط')

  if (!payload) {
    const res = await fetch(`${API_URL}?action=${action}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('تعذر الاتصال بقاعدة البيانات')
    return res.json()
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  })

  if (!res.ok) throw new Error('تعذر الحفظ في قاعدة البيانات')
  return res.json()
}

export async function getCompanies() {
  const rows = await request('companies')
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row['الحالة'] !== 'محذوفة')
    .map((row, index) => ({
      id: index + 1,
      name: row['اسم الشركة'] || '',
      invoices: Number(row['عدد الفواتير'] || 0),
      status: row['الحالة'] || 'نشطة',
    }))
    .filter((row) => row.name)
}

export async function saveCompany(name: string) {
  return request('add_company', { name })
}

export async function removeCompany(name: string) {
  return request('delete_company', { name })
}

export async function restoreCompany(name: string) {
  return request('restore_company', { name })
}
