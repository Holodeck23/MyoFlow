'use strict'

const CHAMBER_ID_PATTERN = /^[A-ZÄÖÜ]{2,5}\d{3,6}$/i

export function normalizeChamberId(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }

  const normalized = value.trim()
  return normalized.length === 0 ? null : normalized.toUpperCase()
}

export function isValidChamberId(value: string | null | undefined): boolean {
  const normalized = normalizeChamberId(value)
  if (!normalized) {
    return false
  }

  return CHAMBER_ID_PATTERN.test(normalized)
}

export function assertValidChamberId(value: string | null | undefined): void {
  if (!isValidChamberId(value)) {
    throw new Error('Invalid Chamber ID (expected provincial prefix + digits, e.g. WKT1234)')
  }
}
