/**
 * Validation utilities for user input
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Minimum 12 characters for security
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }

  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Must contain number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Must contain special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*etc.)')
  }

  // No common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin']
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password cannot contain common patterns')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateAustrianPostalCode(postalCode: string): boolean {
  // Austrian postal codes: 4 digits, first digit 1-9
  const austrianPostalRegex = /^[1-9]\d{3}$/
  return austrianPostalRegex.test(postalCode)
}

export function validateAustrianVATNumber(vatNumber: string): boolean {
  // Austrian VAT format: ATUxxxxxxxx
  const austrianVATRegex = /^ATU\d{8}$/
  return austrianVATRegex.test(vatNumber)
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic phone validation - allows Austrian and international formats
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Normalize email address to prevent case-sensitivity issues
 * Trims whitespace and converts to lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}