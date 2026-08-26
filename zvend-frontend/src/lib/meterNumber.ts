export const METER_NUMBER_PATTERN = /^5810\d{7}$/

export function normalizeMeterNumber(raw: string): string {
  const cleaned = raw.replace(/[^0-9]/g, '')
  const match = cleaned.match(/5810\d{7}/)
  return match ? match[0] : cleaned
}