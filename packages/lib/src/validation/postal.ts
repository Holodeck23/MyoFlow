const AUSTRIAN_POSTAL_CODE_REGEX = /^[1-9]\d{3}$/

export function normalizeAustrianPostalCode(postalCode: string | null | undefined): string | null {
  if (postalCode == null) {
    return null
  }
  const trimmed = postalCode.toString().trim()
  return trimmed.length === 0 ? null : trimmed
}

export function isValidAustrianPostalCode(postalCode: string | null | undefined): boolean {
  const normalized = normalizeAustrianPostalCode(postalCode)
  if (!normalized) {
    return false
  }
  return AUSTRIAN_POSTAL_CODE_REGEX.test(normalized)
}

export function assertValidAustrianPostalCode(postalCode: string | null | undefined): void {
  if (!isValidAustrianPostalCode(postalCode)) {
    throw new Error('Invalid Austrian postal code (expected format 1xxx-9xxx)')
  }
}
