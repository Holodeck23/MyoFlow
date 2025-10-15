const AUSTRIAN_IBAN_REGEX = /^AT\d{18}$/

export function normalizeAustrianIban(iban: string | null | undefined): string | null {
  if (iban == null) {
    return null
  }

  const normalized = iban.replace(/\s+/g, '').toUpperCase()
  return normalized.length === 0 ? null : normalized
}

function ibanToNumericString(iban: string) {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let numericString = ''

  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 55).toString()
    } else {
      numericString += char
    }
  }

  return numericString
}

function mod97(numericString: string) {
  let remainder = 0

  for (let i = 0; i < numericString.length; i += 7) {
    const block = remainder.toString() + numericString.substring(i, i + 7)
    remainder = Number(block) % 97
  }

  return remainder
}

export function isValidAustrianIban(iban: string | null | undefined): boolean {
  const normalized = normalizeAustrianIban(iban)
  if (!normalized) {
    return false
  }

  if (!AUSTRIAN_IBAN_REGEX.test(normalized)) {
    return false
  }

  const numericString = ibanToNumericString(normalized)
  return mod97(numericString) === 1
}

export function assertValidAustrianIban(iban: string | null | undefined): void {
  if (!isValidAustrianIban(iban)) {
    throw new Error('Invalid Austrian IBAN (expected format ATkk#########...)')
  }
}
