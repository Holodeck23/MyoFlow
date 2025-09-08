// Test setup file for @myoflow/web package
// This file runs before each test suite

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Global test setup
beforeAll(() => {
  // Mock environment variables for testing
  ;(process.env as any).NODE_ENV = 'test'
  ;(process.env as any).NEXTAUTH_SECRET = 'test-secret'
  ;(process.env as any).NEXTAUTH_URL = 'http://localhost:3000'
  
  console.log('🧪 Starting @myoflow/web test suite')
})

afterAll(() => {
  console.log('✅ @myoflow/web test suite completed')
})

// Per-test setup and cleanup
beforeEach(() => {
  // Reset any test state
})

afterEach(() => {
  // Cleanup after each test
})

// Test utilities for API route testing
export const mockRequest = (method: string, body?: any) => {
  return {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  }
}

export const mockResponse = () => {
  const res: any = {}
  res.status = () => res
  res.json = () => res
  res.end = () => res
  return res
}

// Austrian business constants for web testing
export const AUSTRIAN_TEST_DATA = {
  VAT_RATES: {
    STANDARD: 0.2,
    REDUCED_LOW: 0.1,
    REDUCED_HIGH: 0.13,
  },
  KLEINUNTERNEHMER_THRESHOLD: 35000,
  TEST_THERAPIST: {
    email: 'test@myoflow.at',
    name: 'Dr. Test Müller',
    businessName: 'Praxis Test',
  }
} as const