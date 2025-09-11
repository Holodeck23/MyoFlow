/**
 * SEPA QR Code Generator for Austrian Banking
 * Compliant with European Central Bank EPC QR Code standard
 */

import QRCode from 'qrcode'

export interface SEPAQRData {
  serviceTag: string
  version: string
  characterSet: string
  identification: string
  bic?: string
  beneficiaryName: string
  beneficiaryIBAN: string
  amount?: string
  currency: string
  purpose?: string
  structuredReference?: string
  unstructuredReference?: string
  information?: string
}

/**
 * Generate Austrian SEPA QR code data string
 * Following EPC QR Code standard for Austrian banks
 */
export function generateSEPAQRData(params: {
  beneficiaryName: string
  beneficiaryIBAN: string
  amount: number // in euros
  reference: string
  bic?: string
}): string {
  const { beneficiaryName, beneficiaryIBAN, amount, reference, bic } = params

  // EPC QR Code format components
  const sepaData: SEPAQRData = {
    serviceTag: 'BCD', // Service Tag for EPC QR Code
    version: '002', // Version 2 is standard for Austrian banks
    characterSet: '1', // UTF-8 encoding
    identification: 'SCT', // SEPA Credit Transfer
    bic: bic || '', // Optional BIC (can be empty for Austrian IBANs)
    beneficiaryName: beneficiaryName.substring(0, 70), // Max 70 characters
    beneficiaryIBAN: beneficiaryIBAN.replace(/\s/g, ''), // Remove spaces
    amount: `EUR${amount.toFixed(2)}`, // Amount with currency
    currency: 'EUR',
    purpose: '', // Optional purpose code
    structuredReference: '', // Optional structured reference
    unstructuredReference: reference.substring(0, 140), // Max 140 characters
    information: '' // Optional remittance information
  }

  // Build QR code data string according to EPC standard
  const qrDataParts = [
    sepaData.serviceTag,
    sepaData.version,
    sepaData.characterSet,
    sepaData.identification,
    sepaData.bic,
    sepaData.beneficiaryName,
    sepaData.beneficiaryIBAN,
    sepaData.amount,
    sepaData.purpose,
    sepaData.structuredReference,
    sepaData.unstructuredReference,
    sepaData.information
  ]

  return qrDataParts.join('\n')
}

/**
 * Generate SEPA QR code as base64 PNG for invoices
 */
export async function generateSEPAQRCode(params: {
  beneficiaryName: string
  beneficiaryIBAN: string
  amount: number
  reference: string
  bic?: string
}): Promise<string> {
  const qrData = generateSEPAQRData(params)
  
  try {
    // Generate QR code with Austrian banking optimal settings
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      type: 'image/png',
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' // Medium error correction for banking
    })

    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating SEPA QR code:', error)
    throw new Error('Failed to generate SEPA QR code')
  }
}

/**
 * Validate Austrian IBAN format
 */
export function validateAustrianIBAN(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  
  // Austrian IBAN format: AT + 2 check digits + 5 bank code + 11 account number
  const austrianIBANPattern = /^AT\d{2}\d{5}\d{11}$/
  
  if (!austrianIBANPattern.test(cleanIBAN)) {
    return false
  }

  // IBAN checksum validation (mod 97)
  const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4)
  const numericString = rearranged.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  )
  
  // Calculate mod 97
  let remainder = 0
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97
  }
  
  return remainder === 1
}

/**
 * Format IBAN for display with spaces
 */
export function formatIBAN(iban: string): string {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  return cleanIBAN.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Get Austrian bank name from IBAN (simplified mapping)
 */
export function getAustrianBankFromIBAN(iban: string): string | null {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  
  if (!cleanIBAN.startsWith('AT')) {
    return null
  }
  
  const bankCode = cleanIBAN.substring(4, 9)
  
  // Common Austrian bank codes (simplified mapping)
  const bankMappings: Record<string, string> = {
    '11000': 'Oesterreichische Nationalbank',
    '12000': 'Bank Austria',
    '19043': 'Erste Bank',
    '20111': 'Erste Bank',
    '32000': 'Raiffeisen Bank',
    '14000': 'BAWAG P.S.K.',
    '60000': 'Hypo Tirol Bank',
    '51000': 'Oberbank AG'
  }
  
  return bankMappings[bankCode] || 'Österreichische Bank'
}