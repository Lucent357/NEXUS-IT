export function formatDate(value: string | null): string {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

// Tanggal hari ini menurut zona waktu lokal (format YYYY-MM-DD)
export function todayISO(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}