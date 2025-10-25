export interface WizardFormValues {
  businessName: string
  businessEmail: string
  businessAddress: string
  businessPostalCode: string
  businessCity: string
  businessCountry: string
  iban: string
  designation: string
  vatStatus: string
  chamberRegistration: string
  certificatesInput: string
}

export interface ProfileSnapshot {
  businessName: string | null
  businessEmail: string | null
  iban: string | null
  businessAddress: string | null
  businessCity: string | null
  businessPostalCode: string | null
  businessCountry: string | null
  designation: string | null
  vatStatus: string | null
  chamberRegistration: string | null
  certificates: string[] | null
  profileCompletionScore: number | null
}
