/**
 * Austrian Public Holidays by State
 * 
 * Austria has 9 states (Bundesländer) with different public holidays:
 * - B: Burgenland
 * - K: Kärnten (Carinthia)  
 * - NÖ: Niederösterreich (Lower Austria)
 * - OÖ: Oberösterreich (Upper Austria)
 * - S: Salzburg
 * - ST: Steiermark (Styria)
 * - T: Tirol (Tyrol)
 * - V: Vorarlberg
 * - W: Wien (Vienna)
 */

export interface AustrianHolidayData {
  name: string
  type: 'NATIONAL' | 'REGIONAL' | 'RELIGIOUS' | 'COMMEMORATION'
  stateCodes?: string[] // null means national holiday
  description?: string
  calculateDate: (year: number) => Date | null
}

/**
 * Calculate Easter Sunday for a given year (Western Christian)
 */
function calculateEaster(year: number): Date {
  const f = Math.floor
  const G = year % 19
  const C = f(year / 100)
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
  const L = I - J
  const month = 3 + f((L + 40) / 44)
  const day = L + 28 - 31 * f(month / 4)
  return new Date(year, month - 1, day)
}

/**
 * All Austrian holidays with state-specific variations
 */
export const AUSTRIAN_HOLIDAYS: AustrianHolidayData[] = [
  // National holidays (all states)
  {
    name: 'Neujahr',
    type: 'NATIONAL',
    description: 'New Year\'s Day',
    calculateDate: (year) => new Date(year, 0, 1)
  },
  {
    name: 'Heilige Drei Könige', 
    type: 'RELIGIOUS',
    description: 'Epiphany',
    calculateDate: (year) => new Date(year, 0, 6)
  },
  {
    name: 'Karfreitag',
    type: 'RELIGIOUS', 
    description: 'Good Friday',
    calculateDate: (year) => {
      const easter = calculateEaster(year)
      return new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Ostermontag',
    type: 'RELIGIOUS',
    description: 'Easter Monday', 
    calculateDate: (year) => {
      const easter = calculateEaster(year)
      return new Date(easter.getTime() + 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Staatsfeiertag',
    type: 'NATIONAL',
    description: 'Labour Day',
    calculateDate: (year) => new Date(year, 4, 1)
  },
  {
    name: 'Christi Himmelfahrt', 
    type: 'RELIGIOUS',
    description: 'Ascension Day',
    calculateDate: (year) => {
      const easter = calculateEaster(year)
      return new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Pfingstmontag',
    type: 'RELIGIOUS',
    description: 'Whit Monday',
    calculateDate: (year) => {
      const easter = calculateEaster(year)
      return new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Fronleichnam',
    type: 'RELIGIOUS', 
    description: 'Corpus Christi',
    calculateDate: (year) => {
      const easter = calculateEaster(year)
      return new Date(easter.getTime() + 60 * 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Mariä Himmelfahrt',
    type: 'RELIGIOUS',
    description: 'Assumption of Mary',
    calculateDate: (year) => new Date(year, 7, 15)
  },
  {
    name: 'Nationalfeiertag',
    type: 'COMMEMORATION',
    description: 'National Day',
    calculateDate: (year) => new Date(year, 9, 26)
  },
  {
    name: 'Allerheiligen',
    type: 'RELIGIOUS',
    description: 'All Saints\' Day',
    calculateDate: (year) => new Date(year, 10, 1)
  },
  {
    name: 'Mariä Empfängnis',
    type: 'RELIGIOUS',
    description: 'Immaculate Conception',
    calculateDate: (year) => new Date(year, 11, 8)
  },
  {
    name: 'Weihnachten',
    type: 'NATIONAL',
    description: 'Christmas Day', 
    calculateDate: (year) => new Date(year, 11, 25)
  },
  {
    name: 'Stefanitag',
    type: 'NATIONAL',
    description: 'St. Stephen\'s Day',
    calculateDate: (year) => new Date(year, 11, 26)
  },

  // State-specific holidays
  {
    name: 'Heiliger Josef',
    type: 'REGIONAL',
    stateCodes: ['K', 'ST', 'T', 'V'], // Carinthia, Styria, Tyrol, Vorarlberg
    description: 'St. Joseph\'s Day',
    calculateDate: (year) => new Date(year, 2, 19)
  },
  {
    name: 'Heiliger Florian', 
    type: 'REGIONAL',
    stateCodes: ['OÖ'], // Upper Austria only
    description: 'St. Florian\'s Day',
    calculateDate: (year) => new Date(year, 4, 4)
  },
  {
    name: 'Heiliger Rupert',
    type: 'REGIONAL', 
    stateCodes: ['S'], // Salzburg only
    description: 'St. Rupert\'s Day',
    calculateDate: (year) => new Date(year, 8, 24)
  },
  {
    name: 'Tag der Volksabstimmung',
    type: 'REGIONAL',
    stateCodes: ['K'], // Carinthia only
    description: 'Plebiscite Day',
    calculateDate: (year) => new Date(year, 9, 10)
  },
  {
    name: 'Heiliger Martin',
    type: 'REGIONAL',
    stateCodes: ['B'], // Burgenland only  
    description: 'St. Martin\'s Day',
    calculateDate: (year) => new Date(year, 10, 11)
  },
  {
    name: 'Heiliger Leopold',
    type: 'REGIONAL',
    stateCodes: ['NÖ', 'W'], // Lower Austria and Vienna
    description: 'St. Leopold\'s Day',
    calculateDate: (year) => new Date(year, 10, 15)
  }
]

/**
 * Get all holidays for a specific year and Austrian state
 */
export function getAustrianHolidays(year: number, stateCode?: string): Array<{
  name: string
  date: Date
  type: string
  description?: string
}> {
  return AUSTRIAN_HOLIDAYS
    .filter(holiday => {
      // Include national holidays (no stateCodes) or holidays for this state
      return !holiday.stateCodes || 
             !stateCode || 
             holiday.stateCodes.includes(stateCode)
    })
    .map(holiday => {
      const date = holiday.calculateDate(year)
      return date ? {
        name: holiday.name,
        date,
        type: holiday.type,
        description: holiday.description
      } : null
    })
    .filter((holiday): holiday is NonNullable<typeof holiday> => holiday !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Check if a specific date is an Austrian holiday
 */
export function isAustrianHoliday(date: Date, stateCode?: string): boolean {
  const year = date.getFullYear()
  const holidays = getAustrianHolidays(year, stateCode)
  
  return holidays.some(holiday => 
    holiday.date.getFullYear() === date.getFullYear() &&
    holiday.date.getMonth() === date.getMonth() &&
    holiday.date.getDate() === date.getDate()
  )
}

/**
 * Austrian state codes and names
 */
export const AUSTRIAN_STATES = {
  'B': 'Burgenland',
  'K': 'Kärnten',
  'NÖ': 'Niederösterreich', 
  'OÖ': 'Oberösterreich',
  'S': 'Salzburg',
  'ST': 'Steiermark',
  'T': 'Tirol',
  'V': 'Vorarlberg',
  'W': 'Wien'
} as const

export type AustrianStateCode = keyof typeof AUSTRIAN_STATES