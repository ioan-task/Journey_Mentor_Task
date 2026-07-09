
const HAS_ZONE = /(?:Z|[+-]\d{2}:\d{2})$/i

export function timePart(isoLocal: string): string {
  return isoLocal.slice(11, 16)
}

export function datePart(isoLocal: string): string {
  return isoLocal.slice(0, 10)
}

export function minutesFromMidnight(isoLocal: string): number {
  return Number(isoLocal.slice(11, 13)) * 60 + Number(isoLocal.slice(14, 16))
}

function utcMsOfDate(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

export function dayDiff(fromIsoLocal: string, toIsoLocal: string): number {
  return Math.round(
    (utcMsOfDate(datePart(toIsoLocal)) - utcMsOfDate(datePart(fromIsoLocal))) / 86_400_000,
  )
}

export function layoverMinutes(arrivingAt: string, departingAt: string): number {
  const asUtc = (stamp: string) => new Date(HAS_ZONE.test(stamp) ? stamp : `${stamp}Z`).getTime()
  return Math.round((asUtc(departingAt) - asUtc(arrivingAt)) / 60_000)
}

export function addDays(isoDate: string, delta: number): string {
  const date = new Date(utcMsOfDate(isoDate) + delta * 86_400_000)
  return date.toISOString().slice(0, 10)
}

export function todayLocalIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const DAY_LABEL = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function formatDayLabel(isoDate: string): string {
  const parts = new Map(
    DAY_LABEL.formatToParts(utcMsOfDate(isoDate)).map((part) => [part.type, part.value]),
  )
  return `${parts.get('weekday')} ${parts.get('day')} ${parts.get('month')}`
}
