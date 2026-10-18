/**
 * Calculate rental days between start and end date (inclusive).
 * days = (end - start) + 1
 */
export function calculateRentalDays(
  startDate: string | Date,
  endDate: string | Date
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const utcStart = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  )
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  const diffDays = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

/**
 * Format date in id-ID locale with Asia/Jakarta timezone.
 * Example: 10 Okt 2026
 */
export function formatDateID(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date))
}

/**
 * Format full date and time in id-ID locale.
 */
export function formatDateTimeID(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date))
}
