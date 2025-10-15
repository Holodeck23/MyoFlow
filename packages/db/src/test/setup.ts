// Test setup file for @myoflow/db package
// This file runs before each test suite

import { beforeAll, afterAll } from 'vitest'
import { prisma } from '../..'

let isDatabaseAvailable = false

// Global test setup
beforeAll(async () => {
  // Set up test database URL if not already set
  if (!process.env.DATABASE_URL) {
    // Use a test database URL - this should be overridden in CI or local test setup
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/myoflow_test'
  }
  
  console.log('🧪 Starting @myoflow/db test suite')
  console.log(`📊 Using database: ${process.env.DATABASE_URL}`)
  
  // Test database connectivity
  try {
    await prisma.$connect()
    isDatabaseAvailable = true
    console.log('✅ Database connection successful')
  } catch (error) {
    isDatabaseAvailable = false
    console.log('⚠️  Database connection failed - integration tests will be skipped')
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

afterAll(() => {
  console.log('✅ @myoflow/db test suite completed')
})

// Export database availability for tests to check
export { isDatabaseAvailable }

// Test utilities for database testing
export const TEST_DATABASE_CONFIG = {
  url: process.env.DATABASE_URL,
  resetBetweenTests: true,
} as const

// Austrian business constants for database testing
export const AUSTRIAN_TEST_DATA = {
  VAT_RATES: {
    STANDARD: 0.2,
    REDUCED_LOW: 0.1,
    REDUCED_HIGH: 0.13,
  },
  KLEINUNTERNEHMER_THRESHOLD: 35000,
  TEST_THERAPIST: {
    email: 'db-test@myoflow.at',
    name: 'Dr. Database Test',
    businessName: 'Test Praxis DB',
  },
  POSTAL_CODES: {
    LINZ: '4020',
    VIENNA: '1010',
    SALZBURG: '5020',
  }
} as const