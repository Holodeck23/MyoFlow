const AUSTRIAN_VAT_REGEX = /^ATU\d{8}$/i

export function normalizeVatNumber(vatNumber: string | null | undefined): string | null {
  if (!vatNumber) {
    return null
  }

  const normalized = vatNumber.trim().toUpperCase()
  return normalized
}

export function isValidAustrianVatNumber(vatNumber: string | null | undefined): boolean {
  if (!vatNumber) {
    return false
  }

  return AUSTRIAN_VAT_REGEX.test(vatNumber.trim())
}

export function assertValidVatNumber(value: string | null | undefined): void {
  if (value && !isValidAustrianVatNumber(value)) {
    throw new Error('Invalid Austrian VAT number (expected format ATU########)')
  }
}
