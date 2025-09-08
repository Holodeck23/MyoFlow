import { describe, it, expect } from 'vitest'
import { AUSTRIAN_TEST_DATA } from './setup'

describe('Web Application Smoke Tests', () => {
  it('should have Austrian test data constants', () => {
    expect(AUSTRIAN_TEST_DATA.VAT_RATES.STANDARD).toBe(0.2)
    expect(AUSTRIAN_TEST_DATA.KLEINUNTERNEHMER_THRESHOLD).toBe(35000)
  })

  it('should have test therapist data', () => {
    expect(AUSTRIAN_TEST_DATA.TEST_THERAPIST.email).toBe('test@myoflow.at')
    expect(AUSTRIAN_TEST_DATA.TEST_THERAPIST.name).toBe('Dr. Test Müller')
  })

  it('should have NODE_ENV set to test', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })
})