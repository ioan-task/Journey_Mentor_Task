const formatters = new Map<string, Intl.NumberFormat>()

function formatterFor(currency: string, rounded: boolean): Intl.NumberFormat {
  const cacheKey = `${currency}:${rounded}`
  let formatter = formatters.get(cacheKey)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      ...(rounded ? { maximumFractionDigits: 0 } : {}),
    })
    formatters.set(cacheKey, formatter)
  }
  return formatter
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return formatterFor(currency, false).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatMoneyRounded(amount: number, currency: string): string {
  try {
    return formatterFor(currency, true).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}
