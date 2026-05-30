/**
 * Generates available HH:mm time slots for a barber on a given date (UTC).
 * Slots run 09:00–17:xx based on duration, stopping before 18:00.
 */
export function generateSlots(date: string, durationMinutes: number, bookedAt: Date[]): string[] {
  const [year, month, day] = date.split('-').map(Number)
  const slots: string[] = []

  for (let totalMinutes = 9 * 60; totalMinutes < 18 * 60; totalMinutes += durationMinutes) {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    const slotMs = Date.UTC(year, month - 1, day, h, m)
    const isBooked = bookedAt.some((b) => Math.abs(b.getTime() - slotMs) < 60_000)
    if (!isBooked) slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  return slots
}
