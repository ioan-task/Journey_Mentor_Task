const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/

export function parseIsoDurationMinutes(value: string | null | undefined): number | null {
  if (!value) return null
  const match = ISO_DURATION.exec(value)
  if (!match) return null
  const [, days, hours, minutes, seconds] = match
  if (days === undefined && hours === undefined && minutes === undefined && seconds === undefined) {
    return null
  }
  return (
    Number(days ?? 0) * 24 * 60 +
    Number(hours ?? 0) * 60 +
    Number(minutes ?? 0) +
    Math.round(Number(seconds ?? 0) / 60)
  )
}

export function formatMinutes(total: number | null | undefined): string {
  if (total == null || total < 0 || !Number.isFinite(total)) return '—'
  const rounded = Math.round(total)
  const hours = Math.floor(rounded / 60)
  const minutes = rounded % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
