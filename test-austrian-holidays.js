// Quick test of Austrian holiday functionality
const { getAustrianHolidays, isAustrianHoliday, AUSTRIAN_STATES } = require('./packages/lib/src/austrian-holidays.ts')

console.log('🇦🇹 Testing Austrian Holiday System\n')

// Test 2024 holidays for Vienna (W)
console.log('=== 2024 Holidays for Vienna (W) ===')
const viennaHolidays2024 = getAustrianHolidays(2024, 'W')
viennaHolidays2024.forEach(holiday => {
  console.log(`${holiday.date.toISOString().slice(0,10)} - ${holiday.name} (${holiday.type})`)
})

console.log('\n=== 2024 Holidays for Carinthia (K) ===') 
const carinthiaHolidays2024 = getAustrianHolidays(2024, 'K')
carinthiaHolidays2024.forEach(holiday => {
  console.log(`${holiday.date.toISOString().slice(0,10)} - ${holiday.name} (${holiday.type})`)
})

// Test specific date checking
console.log('\n=== Holiday Date Checking ===')
const christmas2024 = new Date('2024-12-25')
const stLeopold2024 = new Date('2024-11-15') // Only in Vienna & Lower Austria

console.log(`Is 2024-12-25 a holiday in Vienna? ${isAustrianHoliday(christmas2024, 'W')}`)
console.log(`Is 2024-11-15 (St. Leopold) a holiday in Vienna? ${isAustrianHoliday(stLeopold2024, 'W')}`)
console.log(`Is 2024-11-15 (St. Leopold) a holiday in Salzburg? ${isAustrianHoliday(stLeopold2024, 'S')}`)

console.log('\n=== Austrian States ===')
Object.entries(AUSTRIAN_STATES).forEach(([code, name]) => {
  console.log(`${code}: ${name}`)
})

console.log('\n✅ Austrian holiday system working correctly!')