import { describe, expect, it } from 'vitest'
import { getAustrianHolidays, isAustrianHoliday } from '../src/austrian-holidays'

describe('Austrian Holidays', () => {
  it('includes state specific holidays', () => {
    const holidays = getAustrianHolidays(2024, 'W')
    const names = holidays.map(h => h.name)
    expect(names).toContain('Heiliger Leopold')
  })

  it('detects holidays correctly', () => {
    expect(isAustrianHoliday(new Date('2024-12-25'), 'W')).toBe(true)
    expect(isAustrianHoliday(new Date('2024-11-15'), 'S')).toBe(false)
  })
})
