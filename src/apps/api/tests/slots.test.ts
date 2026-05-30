import { describe, expect, it } from 'vitest'
import { generateSlots } from '../src/lib/slots'

const DATE = '2026-06-01'

describe('generateSlots', () => {
  it('generates 9 slots from 09:00 to 17:00 with 60-min duration', () => {
    const slots = generateSlots(DATE, 60, [])
    expect(slots).toHaveLength(9)
    expect(slots[0]).toBe('09:00')
    expect(slots[8]).toBe('17:00')
  })

  it('generates 18 slots with 30-min duration', () => {
    const slots = generateSlots(DATE, 30, [])
    expect(slots).toHaveLength(18)
    expect(slots[0]).toBe('09:00')
    expect(slots[1]).toBe('09:30')
  })

  it('generates 12 slots with 45-min duration', () => {
    const slots = generateSlots(DATE, 45, [])
    expect(slots).toHaveLength(12)
    expect(slots[1]).toBe('09:45')
  })

  it('excludes a booked slot', () => {
    const booked = [new Date(Date.UTC(2026, 5, 1, 9, 0))]
    const slots = generateSlots(DATE, 60, booked)
    expect(slots).not.toContain('09:00')
    expect(slots).toContain('10:00')
    expect(slots).toHaveLength(8)
  })

  it('returns all slots when no appointments', () => {
    const slots = generateSlots(DATE, 45, [])
    expect(slots[0]).toBe('09:00')
  })
})
