// Test setup file for @myoflow/lib package
// This file runs before each test suite

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Global test setup
beforeAll(() => {
  // Initialize any global test dependencies
  console.log('🧪 Starting @myoflow/lib test suite')
})

afterAll(() => {
  // Cleanup global test dependencies
  console.log('✅ @myoflow/lib test suite completed')
})

// Per-test setup and cleanup
beforeEach(() => {
  // Reset state before each test
})

afterEach(() => {
  // Cleanup after each test
})

// Austrian business logic test utilities
export const AUSTRIAN_VAT_RATES = {
  STANDARD: 0.2, // 20%
  REDUCED_LOW: 0.1, // 10%
  REDUCED_HIGH: 0.13, // 13%
} as const

export const KLEINUNTERNEHMER_THRESHOLD = 35000 // €35,000 annual revenue

export const AUSTRIAN_STATES = [
  'BURGENLAND',
  'CARINTHIA', 
  'LOWER_AUSTRIA',
  'UPPER_AUSTRIA',
  'SALZBURG',
  'STYRIA',
  'TYROL',
  'VORARLBERG',
  'VIENNA'
] as const