import { describe, it, expect } from 'vitest'
import { AUSTRIAN_VAT_RATES, KLEINUNTERNEHMER_THRESHOLD } from './setup'

describe('Austrian Business Logic Smoke Tests', () => {
  it('should have correct Austrian VAT rates', () => {
    expect(AUSTRIAN_VAT_RATES.STANDARD).toBe(0.2) // 20%
    expect(AUSTRIAN_VAT_RATES.REDUCED_LOW).toBe(0.1) // 10%
    expect(AUSTRIAN_VAT_RATES.REDUCED_HIGH).toBe(0.13) // 13%
  })

  it('should have correct Kleinunternehmer threshold', () => {
    expect(KLEINUNTERNEHMER_THRESHOLD).toBe(35000) // €35,000
  })

  it('should calculate basic VAT correctly', () => {
    const netAmount = 1000
    const vatAmount = netAmount * AUSTRIAN_VAT_RATES.STANDARD
    const grossAmount = netAmount + vatAmount
    
    expect(vatAmount).toBe(200) // 20% of 1000
    expect(grossAmount).toBe(1200)
  })
})