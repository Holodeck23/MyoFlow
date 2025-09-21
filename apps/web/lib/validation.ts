/**
 * Validation utilities for user input
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, contains letters and numbers
  const minLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  return minLength && hasLetter && hasNumber
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