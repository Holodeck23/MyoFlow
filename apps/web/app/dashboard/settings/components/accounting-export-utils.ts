'use client'

export function getPreviousMonthRange(): { start: string; end: string } {
  const now = new Date()
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
  return {
    start: formatDateInputValue(startDate),
    end: formatDateInputValue(endDate)
  }
}

export function formatDateInputValue(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function extractFilenameFromHeaders(headers: Headers, fallback: string): string {
  const disposition =
    headers.get('Content-Disposition') ?? headers.get('content-disposition')

  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  }

  return fallback
}

export function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === 'undefined') {
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function formatEuroFromCents(cents: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100)
}

export function formatShortDate(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed)
}
