/**
 * Austrian-specific formatting utilities for MyoFlow
 * Handles phone numbers, postal codes, and business formatting
 */

/**
 * Format Austrian phone number
 * Converts various formats to +43 123 456 789 format
 */
export function formatAustrianPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Handle different input formats
  let formatted = digits
  
  // If starts with 43 (country code), add +
  if (formatted.startsWith('43')) {
    formatted = '+43' + formatted.substring(2)
  }
  // If starts with 0 (national format), replace with +43
  else if (formatted.startsWith('0')) {
    formatted = '+43' + formatted.substring(1)
  }
  // If no country code, assume Austrian
  else if (formatted.length >= 7) {
    formatted = '+43' + formatted
  }
  
  // Format with spaces: +43 123 456 789
  const match = formatted.match(/^(\+43)(\d{1,4})(\d{0,3})(\d{0,4})$/)
  if (match) {
    const [, country, area, first, second] = match
    let result = country
    if (area) result += ' ' + area
    if (first) result += ' ' + first
    if (second) result += ' ' + second
    return result.trim()
  }
  
  return phone // Return original if formatting fails
}

/**
 * Format Austrian postal code
 * Ensures 4-digit format
 */
export function formatAustrianPostalCode(postalCode: string): string {
  if (!postalCode) return ''
  
  const digits = postalCode.replace(/\D/g, '')
  
  // Austrian postal codes are 4 digits
  if (digits.length <= 4) {
    return digits.padStart(4, '0')
  }
  
  return postalCode
}

/**
 * Format Austrian currency
 * Uses European format with comma decimal separator
 */
export function formatAustrianCurrency(cents: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

/**
 * Format Austrian date
 * DD.MM.YYYY format
 */
export function formatAustrianDate(date: Date): string {
  return date.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Validate Austrian phone number
 */
export function isValidAustrianPhoneNumber(phone: string): boolean {
  const formatted = formatAustrianPhoneNumber(phone)
  // Basic validation: should start with +43 and have reasonable length
  return /^\+43\s\d{1,4}(\s\d{3})?(\s\d{3,4})?$/.test(formatted)
}

/**
 * Validate Austrian postal code
 */
export function isValidAustrianPostalCode(postalCode: string): boolean {
  const digits = postalCode.replace(/\D/g, '')
  return /^\d{4}$/.test(digits) && parseInt(digits) >= 1000 && parseInt(digits) <= 9999
}