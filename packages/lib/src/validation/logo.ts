'use strict'

const DATA_URL_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/i
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']

export function normalizeLogoUrl(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function isValidLogoUrl(value: string | null | undefined): boolean {
  const normalized = normalizeLogoUrl(value)
  if (!normalized) {
    return false
  }

  if (DATA_URL_IMAGE_REGEX.test(normalized)) {
    return true
  }

  try {
    const url = new URL(normalized)

    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
      return false
    }

    const pathname = url.pathname.toLowerCase()
    return ALLOWED_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  } catch (error) {
    return false
  }
}

export function assertValidLogoUrl(value: string | null | undefined): void {
  if (!isValidLogoUrl(value)) {
    throw new Error('Invalid logo URL (must be an http(s) image or valid data URL)')
  }
}
