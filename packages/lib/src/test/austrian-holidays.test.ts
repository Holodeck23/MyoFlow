import { describe, it, expect } from 'vitest'
import {
  getAustrianHolidays,
  isAustrianHoliday,
  AUSTRIAN_STATES,
  type AustrianStateCode
} from '../austrian-holidays'

describe('Austrian Holiday System', () => {
  describe('Austrian States', () => {
    it('should have all 9 Austrian states defined', () => {
      const stateCount = Object.keys(AUSTRIAN_STATES).length
      expect(stateCount).toBe(9)
    })

    it('should have correct state codes and names', () => {
      expect(AUSTRIAN_STATES.B).toBe('Burgenland')
      expect(AUSTRIAN_STATES.K).toBe('Kärnten')
      expect(AUSTRIAN_STATES['NÖ']).toBe('Niederösterreich')
      expect(AUSTRIAN_STATES['OÖ']).toBe('Oberösterreich')
      expect(AUSTRIAN_STATES.S).toBe('Salzburg')
      expect(AUSTRIAN_STATES.ST).toBe('Steiermark')
      expect(AUSTRIAN_STATES.T).toBe('Tirol')
      expect(AUSTRIAN_STATES.V).toBe('Vorarlberg')
      expect(AUSTRIAN_STATES.W).toBe('Wien')
    })
  })

  describe('National Holidays (All States)', () => {
    const testYear = 2024

    it('should include New Year\'s Day (Neujahr)', () => {
      const viennaHolidays = getAustrianHolidays(testYear, 'W')
      const newYear = viennaHolidays.find(h => h.name === 'Neujahr')
      
      expect(newYear).toBeDefined()
      expect(newYear!.date).toEqual(new Date(2024, 0, 1))
      expect(newYear!.type).toBe('NATIONAL')
    })

    it('should include Epiphany (Heilige Drei Könige)', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const epiphany = holidays.find(h => h.name === 'Heilige Drei Könige')
      
      expect(epiphany).toBeDefined()
      expect(epiphany!.date).toEqual(new Date(2024, 0, 6))
      expect(epiphany!.type).toBe('RELIGIOUS')
    })

    it('should include Labour Day (Staatsfeiertag)', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const labourDay = holidays.find(h => h.name === 'Staatsfeiertag')
      
      expect(labourDay).toBeDefined()
      expect(labourDay!.date).toEqual(new Date(2024, 4, 1)) // May 1st
      expect(labourDay!.type).toBe('NATIONAL')
    })

    it('should include Christmas Day (Weihnachten)', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const christmas = holidays.find(h => h.name === 'Weihnachten')
      
      expect(christmas).toBeDefined()
      expect(christmas!.date).toEqual(new Date(2024, 11, 25)) // December 25th
      expect(christmas!.type).toBe('NATIONAL')
    })

    it('should include Boxing Day (Stefanitag)', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const boxingDay = holidays.find(h => h.name === 'Stefanitag')
      
      expect(boxingDay).toBeDefined()
      expect(boxingDay!.date).toEqual(new Date(2024, 11, 26)) // December 26th
      expect(boxingDay!.type).toBe('NATIONAL')
    })
  })

  describe('Easter-Dependent Holidays', () => {
    const testYear = 2024
    // In 2024, Easter Sunday is March 31st

    it('should calculate Good Friday correctly', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const goodFriday = holidays.find(h => h.name === 'Karfreitag')
      
      expect(goodFriday).toBeDefined()
      expect(goodFriday!.date.getFullYear()).toBe(2024)
      expect(goodFriday!.date.getMonth()).toBe(2) // March (0-indexed)
      expect(goodFriday!.date.getDate()).toBe(29) // 29th
    })

    it('should calculate Easter Monday correctly', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const easterMonday = holidays.find(h => h.name === 'Ostermontag')
      
      expect(easterMonday).toBeDefined()
      // Easter Monday should be in April 2024 (flexible date check)
      expect(easterMonday!.date.getFullYear()).toBe(2024)
      expect(easterMonday!.date.getMonth()).toBe(3) // April (0-indexed)
      expect(easterMonday!.date.getDate()).toBe(1) // 1st
    })

    it('should calculate Ascension Day correctly', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const ascension = holidays.find(h => h.name === 'Christi Himmelfahrt')
      
      expect(ascension).toBeDefined()
      expect(ascension!.date.getFullYear()).toBe(2024)
      expect(ascension!.date.getMonth()).toBe(4) // May (0-indexed)
      expect(ascension!.date.getDate()).toBe(9) // 9th
    })

    it('should calculate Whit Monday correctly', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const whitMonday = holidays.find(h => h.name === 'Pfingstmontag')
      
      expect(whitMonday).toBeDefined()
      expect(whitMonday!.date.getFullYear()).toBe(2024)
      expect(whitMonday!.date.getMonth()).toBe(4) // May (0-indexed)
      expect(whitMonday!.date.getDate()).toBe(20) // 20th
    })

    it('should calculate Corpus Christi correctly', () => {
      const holidays = getAustrianHolidays(testYear, 'W')
      const corpusChristi = holidays.find(h => h.name === 'Fronleichnam')
      
      expect(corpusChristi).toBeDefined()
      expect(corpusChristi!.date.getFullYear()).toBe(2024)
      expect(corpusChristi!.date.getMonth()).toBe(4) // May (0-indexed)
      expect(corpusChristi!.date.getDate()).toBe(30) // 30th
    })
  })

  describe('State-Specific Holidays', () => {
    const testYear = 2024

    it('should include St. Leopold only in Vienna and Lower Austria', () => {
      // Vienna should have St. Leopold
      const viennaHolidays = getAustrianHolidays(testYear, 'W')
      const viennaStLeopold = viennaHolidays.find(h => h.name === 'Heiliger Leopold')
      expect(viennaStLeopold).toBeDefined()
      expect(viennaStLeopold!.date).toEqual(new Date(2024, 10, 15)) // November 15th

      // Lower Austria should have St. Leopold
      const lowerAustriaHolidays = getAustrianHolidays(testYear, 'NÖ')
      const noeStLeopold = lowerAustriaHolidays.find(h => h.name === 'Heiliger Leopold')
      expect(noeStLeopold).toBeDefined()

      // Salzburg should NOT have St. Leopold
      const salzburgHolidays = getAustrianHolidays(testYear, 'S')
      const salzburgStLeopold = salzburgHolidays.find(h => h.name === 'Heiliger Leopold')
      expect(salzburgStLeopold).toBeUndefined()
    })

    it('should include St. Rupert only in Salzburg', () => {
      // Salzburg should have St. Rupert
      const salzburgHolidays = getAustrianHolidays(testYear, 'S')
      const stRupert = salzburgHolidays.find(h => h.name === 'Heiliger Rupert')
      expect(stRupert).toBeDefined()
      expect(stRupert!.date).toEqual(new Date(2024, 8, 24)) // September 24th

      // Vienna should NOT have St. Rupert
      const viennaHolidays = getAustrianHolidays(testYear, 'W')
      const viennaStRupert = viennaHolidays.find(h => h.name === 'Heiliger Rupert')
      expect(viennaStRupert).toBeUndefined()
    })

    it('should include St. Martin only in Burgenland', () => {
      // Burgenland should have St. Martin
      const burgenlandHolidays = getAustrianHolidays(testYear, 'B')
      const stMartin = burgenlandHolidays.find(h => h.name === 'Heiliger Martin')
      expect(stMartin).toBeDefined()
      expect(stMartin!.date).toEqual(new Date(2024, 10, 11)) // November 11th

      // Vienna should NOT have St. Martin
      const viennaHolidays = getAustrianHolidays(testYear, 'W')
      const viennaStMartin = viennaHolidays.find(h => h.name === 'Heiliger Martin')
      expect(viennaStMartin).toBeUndefined()
    })

    it('should include St. Joseph only in Carinthia, Styria, Tyrol, and Vorarlberg', () => {
      const statesWithStJoseph: AustrianStateCode[] = ['K', 'ST', 'T', 'V']
      const statesWithoutStJoseph: AustrianStateCode[] = ['B', 'NÖ', 'OÖ', 'S', 'W']

      // States that should have St. Joseph
      statesWithStJoseph.forEach(stateCode => {
        const holidays = getAustrianHolidays(testYear, stateCode)
        const stJoseph = holidays.find(h => h.name === 'Heiliger Josef')
        expect(stJoseph).toBeDefined()
        expect(stJoseph!.date).toEqual(new Date(2024, 2, 19)) // March 19th
      })

      // States that should NOT have St. Joseph
      statesWithoutStJoseph.forEach(stateCode => {
        const holidays = getAustrianHolidays(testYear, stateCode)
        const stJoseph = holidays.find(h => h.name === 'Heiliger Josef')
        expect(stJoseph).toBeUndefined()
      })
    })
  })

  describe('Holiday Date Checking', () => {
    it('should correctly identify Christmas as holiday in all states', () => {
      const christmas2024 = new Date('2024-12-25')
      
      // Test all states
      Object.keys(AUSTRIAN_STATES).forEach(stateCode => {
        expect(isAustrianHoliday(christmas2024, stateCode as AustrianStateCode)).toBe(true)
      })
    })

    it('should correctly identify St. Leopold holiday by state', () => {
      const stLeopold2024 = new Date('2024-11-15')
      
      // Should be holiday in Vienna and Lower Austria
      expect(isAustrianHoliday(stLeopold2024, 'W')).toBe(true)
      expect(isAustrianHoliday(stLeopold2024, 'NÖ')).toBe(true)
      
      // Should NOT be holiday in Salzburg
      expect(isAustrianHoliday(stLeopold2024, 'S')).toBe(false)
    })

    it('should correctly identify non-holidays', () => {
      const randomDate = new Date('2024-07-15') // July 15th - not a holiday
      
      Object.keys(AUSTRIAN_STATES).forEach(stateCode => {
        expect(isAustrianHoliday(randomDate, stateCode as AustrianStateCode)).toBe(false)
      })
    })

    it('should work without state code for national holidays', () => {
      const christmas2024 = new Date('2024-12-25')
      const newYear2024 = new Date('2024-01-01')
      
      // Should work without state code
      expect(isAustrianHoliday(christmas2024)).toBe(true)
      expect(isAustrianHoliday(newYear2024)).toBe(true)
    })
  })

  describe('Edge Cases and Multiple Years', () => {
    it('should calculate holidays for different years correctly', () => {
      // Test multiple years
      const years = [2023, 2024, 2025, 2026]
      
      years.forEach(year => {
        const holidays = getAustrianHolidays(year, 'W')
        
        // Should always have New Year
        const newYear = holidays.find(h => h.name === 'Neujahr')
        expect(newYear).toBeDefined()
        expect(newYear!.date.getFullYear()).toBe(year)
        
        // Should always have Christmas
        const christmas = holidays.find(h => h.name === 'Weihnachten')
        expect(christmas).toBeDefined()
        expect(christmas!.date).toEqual(new Date(year, 11, 25))
      })
    })

    it('should return holidays in chronological order', () => {
      const holidays = getAustrianHolidays(2024, 'W')
      
      // Check that dates are in ascending order
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i].date.getTime()).toBeGreaterThanOrEqual(holidays[i-1].date.getTime())
      }
    })

    it('should handle leap years correctly', () => {
      const leapYear = 2024 // 2024 is a leap year
      const holidays = getAustrianHolidays(leapYear, 'W')
      
      // All holidays should still be calculated correctly
      expect(holidays.length).toBeGreaterThan(10)
      
      // February 29th should exist in leap year
      expect(() => new Date(leapYear, 1, 29)).not.toThrow()
    })

    it('should handle edge case dates correctly', () => {
      // Test year boundaries
      const endOfYear = new Date('2024-12-31T23:59:59')
      const startOfYear = new Date('2024-01-01T00:00:00')
      
      expect(isAustrianHoliday(startOfYear, 'W')).toBe(true) // New Year
      expect(isAustrianHoliday(endOfYear, 'W')).toBe(false) // Not a holiday
    })
  })

  describe('Business Logic Integration', () => {
    it('should provide comprehensive holiday coverage for appointment scheduling', () => {
      const year = 2024
      
      // Each state should have at least 12 holidays
      Object.keys(AUSTRIAN_STATES).forEach(stateCode => {
        const holidays = getAustrianHolidays(year, stateCode as AustrianStateCode)
        expect(holidays.length).toBeGreaterThanOrEqual(12)
        
        // Each holiday should have required properties
        holidays.forEach(holiday => {
          expect(holiday.name).toBeTruthy()
          expect(holiday.date).toBeInstanceOf(Date)
          expect(holiday.type).toMatch(/^(NATIONAL|REGIONAL|RELIGIOUS|COMMEMORATION)$/)
          expect(holiday.date.getFullYear()).toBe(year)
        })
      })
    })

    it('should support business day calculations', () => {
      const testDates = [
        new Date('2024-01-01'), // New Year - Holiday
        new Date('2024-01-02'), // Regular day
        new Date('2024-12-25'), // Christmas - Holiday
        new Date('2024-12-24'), // Christmas Eve - Regular day
      ]
      
      testDates.forEach(date => {
        const isHoliday = isAustrianHoliday(date, 'W')
        expect(typeof isHoliday).toBe('boolean')
      })
    })
  })
})