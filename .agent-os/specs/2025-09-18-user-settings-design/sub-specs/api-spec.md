# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-18-user-settings-design/spec.md

> Created: 2025-09-18
> Version: 1.0.0

## Endpoints

### Authentication & Authorization
All settings endpoints require authenticated session with valid therapist ID.

```typescript
// Authentication middleware
const authenticateTherapist = async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new ApiError('Unauthorized', 401)
  }
  return session.user.id as string
}
```

### Settings Overview

#### GET /api/settings/overview
```typescript
interface SettingsOverviewResponse {
  profileCompletion: {
    score: number // 0-100
    totalItems: number
    completedItems: number
    missingItems: {
      category: string
      item: string
      priority: 'high' | 'medium' | 'low'
    }[]
  }
  complianceStatus: {
    vatCompliance: 'compliant' | 'warning' | 'error'
    kleinunternehmerStatus: 'active' | 'threshold_warning' | 'exceeded'
    credentialsStatus: 'valid' | 'expiring' | 'expired'
  }
  quickStats: {
    currentYearRevenue: number
    kleinunternehmerThreshold: number
    thresholdPercentage: number
    daysUntilCredentialExpiry: number | null
  }
  lastUpdated: string
}

// Implementation
export async function GET(request: NextRequest) {
  try {
    const therapistId = await authenticateTherapist(request)

    const [therapist, credentials, taxSettings] = await Promise.all([
      db.therapist.findUnique({ where: { id: therapistId } }),
      db.therapistCredentials.findMany({
        where: { therapistId, status: 'active' }
      }),
      db.taxComplianceSettings.findUnique({ where: { therapistId } })
    ])

    const profileCompletion = calculateProfileCompletion(therapist)
    const complianceStatus = assessComplianceStatus(therapist, taxSettings, credentials)

    return NextResponse.json({
      profileCompletion,
      complianceStatus,
      quickStats: {
        currentYearRevenue: taxSettings?.currentYearRevenue || 0,
        kleinunternehmerThreshold: taxSettings?.kleinunternehmerThreshold || 55000,
        thresholdPercentage: ((taxSettings?.currentYearRevenue || 0) / 55000) * 100,
        daysUntilCredentialExpiry: getNextExpiryDays(credentials)
      },
      lastUpdated: therapist?.settingsLastUpdated?.toISOString() || new Date().toISOString()
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Professional Profile Management

#### GET /api/settings/profile
```typescript
interface TherapistProfileResponse {
  businessInfo: {
    businessName: string | null
    businessType: string | null
    businessRegistrationNumber: string | null
    vatNumber: string | null
    chamberOfCommerceNumber: string | null
  }
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    bio: string | null
  }
  businessAddress: {
    addressLine1: string | null
    addressLine2: string | null
    city: string | null
    postalCode: string | null
    state: string | null
    country: string
    coordinates: { lat: number; lng: number } | null
  }
  contactInfo: {
    businessPhone: string | null
    businessEmail: string | null
    websiteUrl: string | null
  }
  publicProfile: {
    enabled: boolean
    slug: string | null
    description: string | null
    businessHoursDisplay: string | null
  }
  credentials: TherapistCredential[]
}

export async function GET(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)

  const therapist = await db.therapist.findUnique({
    where: { id: therapistId },
    include: {
      credentials: {
        where: { status: { not: 'archived' } },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!therapist) {
    return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
  }

  return NextResponse.json(formatTherapistProfile(therapist))
}
```

#### PUT /api/settings/profile
```typescript
interface UpdateProfileRequest {
  businessInfo?: Partial<BusinessInfo>
  personalInfo?: Partial<PersonalInfo>
  businessAddress?: Partial<BusinessAddress>
  contactInfo?: Partial<ContactInfo>
  publicProfile?: Partial<PublicProfile>
}

export async function PUT(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)
  const updateData: UpdateProfileRequest = await request.json()

  // Validate Austrian-specific fields
  if (updateData.businessAddress?.postalCode) {
    validateAustrianPostalCode(updateData.businessAddress.postalCode)
  }

  if (updateData.businessInfo?.vatNumber) {
    validateAustrianVATNumber(updateData.businessInfo.vatNumber)
  }

  // Update with coordinate resolution for address changes
  const updatePayload = await processProfileUpdate(updateData)

  const updatedTherapist = await db.therapist.update({
    where: { id: therapistId },
    data: {
      ...updatePayload,
      settingsLastUpdated: new Date(),
      settingsVersion: { increment: 1 }
    }
  })

  // Trigger related updates (travel settings, tax compliance)
  await updateRelatedSettings(therapistId, updateData)

  return NextResponse.json({ success: true })
}
```

### Austrian Tax Compliance

#### GET /api/settings/tax-compliance
```typescript
interface TaxComplianceResponse {
  vatRegistration: {
    isRegistered: boolean
    vatNumber: string | null
    registrationDate: string | null
    registrationAuthority: string | null
    returnFrequency: 'monthly' | 'quarterly' | 'annual' | null
    nextReturnDue: string | null
  }
  kleinunternehmer: {
    isActive: boolean
    startDate: string | null
    threshold: number
    currentYearRevenue: number
    previousYearRevenue: number | null
    thresholdPercentage: number
    breachDate: string | null
    warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded'
  }
  taxRates: {
    defaultVatRate: number
    reducedVatRate: number
    exemptVatRate: number
  }
  compliance: {
    status: 'compliant' | 'warning' | 'breach' | 'unknown'
    lastCheck: string
    notes: string | null
  }
  advisor: {
    firmName: string | null
    contactPerson: string | null
    phone: string | null
    email: string | null
  }
}

export async function GET(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)

  const [therapist, taxSettings] = await Promise.all([
    db.therapist.findUnique({ where: { id: therapistId } }),
    db.taxComplianceSettings.findUnique({ where: { therapistId } })
  ])

  const currentRevenue = await calculateCurrentYearRevenue(therapistId)
  const complianceStatus = await assessTaxCompliance(therapist, taxSettings, currentRevenue)

  return NextResponse.json(formatTaxComplianceResponse(therapist, taxSettings, complianceStatus))
}
```

#### PUT /api/settings/tax-compliance
```typescript
interface UpdateTaxComplianceRequest {
  vatRegistration?: {
    isRegistered: boolean
    vatNumber?: string
    registrationDate?: string
    returnFrequency?: 'monthly' | 'quarterly' | 'annual'
  }
  kleinunternehmer?: {
    isActive: boolean
    startDate?: string
    threshold?: number
  }
  taxRates?: {
    defaultVatRate: number
    reducedVatRate: number
    exemptVatRate: number
  }
  advisor?: {
    firmName?: string
    contactPerson?: string
    phone?: string
    email?: string
  }
}

export async function PUT(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)
  const updateData: UpdateTaxComplianceRequest = await request.json()

  // Validate tax compliance changes
  if (updateData.vatRegistration?.vatNumber) {
    await validateVATNumberWithAuthority(updateData.vatRegistration.vatNumber)
  }

  // Calculate impact of changes
  const currentRevenue = await calculateCurrentYearRevenue(therapistId)
  const impactAnalysis = analyzeComplianceImpact(updateData, currentRevenue)

  // Update therapist and tax compliance settings
  await db.$transaction(async (tx) => {
    await tx.therapist.update({
      where: { id: therapistId },
      data: {
        vatRegistered: updateData.vatRegistration?.isRegistered,
        vatNumber: updateData.vatRegistration?.vatNumber,
        kleinunternehmerStatus: updateData.kleinunternehmer?.isActive,
        settingsLastUpdated: new Date()
      }
    })

    await tx.taxComplianceSettings.upsert({
      where: { therapistId },
      create: { therapistId, ...buildTaxSettingsPayload(updateData) },
      update: buildTaxSettingsPayload(updateData)
    })
  })

  // Trigger compliance alerts if needed
  if (impactAnalysis.requiresAlert) {
    await sendComplianceAlert(therapistId, impactAnalysis)
  }

  return NextResponse.json({ success: true, impact: impactAnalysis })
}
```

### Travel & Location Settings

#### GET /api/settings/travel
```typescript
interface TravelSettingsResponse {
  baseLocation: {
    address: {
      line1: string
      line2: string | null
      city: string
      postalCode: string
      coordinates: { lat: number; lng: number }
    }
  }
  transport: {
    method: 'car' | 'public_transport' | 'bicycle' | 'walking' | 'motorcycle' | 'mixed'
    vehicleType: string | null
    ratePerKm: number
    minimumTravelCharge: number
    hourlyTravelRate: number | null
    fuelCostPer100km: number
    parkingFeeAverage: number
  }
  boundaries: {
    maximumTravelDistance: number
    serviceRadiusKm: number
    preferredRegions: string[]
    excludedRegions: string[]
  }
  timeManagement: {
    travelBufferMinutes: number
    minimumTravelTime: number
    maximumTravelTime: number
    preparationTime: number
  }
  routePreferences: {
    avoidHighways: boolean
    avoidTolls: boolean
    preferShortestRoute: boolean
    trafficConsideration: boolean
  }
  integrations: {
    googleMapsEnabled: boolean
    routeOptimization: boolean
    realTimeTraffic: boolean
  }
}

export async function GET(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)

  const travelSettings = await db.travelSettings.findUnique({
    where: { therapistId }
  })

  if (!travelSettings) {
    // Return default settings for new users
    return NextResponse.json(getDefaultTravelSettings())
  }

  return NextResponse.json(formatTravelSettingsResponse(travelSettings))
}
```

#### PUT /api/settings/travel
```typescript
export async function PUT(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)
  const updateData = await request.json()

  // Validate and geocode address if changed
  if (updateData.baseLocation?.address) {
    const coordinates = await geocodeAddress(updateData.baseLocation.address)
    updateData.baseLocation.coordinates = coordinates
  }

  // Validate Austrian postal codes and regions
  if (updateData.baseLocation?.address?.postalCode) {
    validateAustrianPostalCode(updateData.baseLocation.address.postalCode)
  }

  const updatedSettings = await db.travelSettings.upsert({
    where: { therapistId },
    create: {
      therapistId,
      ...buildTravelSettingsPayload(updateData),
      baseCoordinates: updateData.baseLocation?.coordinates
        ? `POINT(${updateData.baseLocation.coordinates.lng} ${updateData.baseLocation.coordinates.lat})`
        : undefined
    },
    update: {
      ...buildTravelSettingsPayload(updateData),
      baseCoordinates: updateData.baseLocation?.coordinates
        ? `POINT(${updateData.baseLocation.coordinates.lng} ${updateData.baseLocation.coordinates.lat})`
        : undefined,
      updatedAt: new Date()
    }
  })

  // Recalculate travel times for existing appointments
  await recalculateAppointmentTravelTimes(therapistId)

  return NextResponse.json({ success: true })
}
```

### Service Rates Management

#### GET /api/settings/service-rates
```typescript
interface ServiceRatesResponse {
  templates: {
    id: string
    serviceName: string
    serviceCategory: string
    serviceDescription: string | null
    basePrice: number
    currency: string
    pricingType: 'fixed' | 'hourly' | 'package'
    defaultDurationMinutes: number
    vatRate: number
    vatIncluded: boolean
    homeVisitAvailable: boolean
    travelIncluded: boolean
    travelSurcharge: number
    publicBookingEnabled: boolean
    active: boolean
    usageCount: number
    lastUsedAt: string | null
  }[]
  categories: string[]
  totalActiveServices: number
  averagePrice: number
}

export async function GET(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)

  const templates = await db.serviceRateTemplates.findMany({
    where: { therapistId, archived: false },
    orderBy: [
      { active: 'desc' },
      { usageCount: 'desc' },
      { serviceName: 'asc' }
    ]
  })

  const categories = await db.serviceRateTemplates.groupBy({
    by: ['serviceCategory'],
    where: { therapistId, active: true }
  })

  return NextResponse.json({
    templates: templates.map(formatServiceRateTemplate),
    categories: categories.map(c => c.serviceCategory),
    totalActiveServices: templates.filter(t => t.active).length,
    averagePrice: calculateAverageServicePrice(templates)
  })
}
```

#### POST /api/settings/service-rates
```typescript
interface CreateServiceRateRequest {
  serviceName: string
  serviceCategory: string
  serviceDescription?: string
  basePrice: number
  defaultDurationMinutes: number
  vatRate?: number
  homeVisitAvailable?: boolean
  travelIncluded?: boolean
  travelSurcharge?: number
  publicBookingEnabled?: boolean
  packageSessions?: number
  packageDiscountPercent?: number
}

export async function POST(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)
  const serviceData: CreateServiceRateRequest = await request.json()

  // Validate service data
  validateServiceRateData(serviceData)

  // Get therapist's tax settings for VAT handling
  const taxSettings = await db.taxComplianceSettings.findUnique({
    where: { therapistId }
  })

  const newTemplate = await db.serviceRateTemplates.create({
    data: {
      therapistId,
      serviceName: serviceData.serviceName,
      serviceCategory: serviceData.serviceCategory,
      serviceDescription: serviceData.serviceDescription,
      basePrice: serviceData.basePrice,
      defaultDurationMinutes: serviceData.defaultDurationMinutes,
      vatRate: serviceData.vatRate || getDefaultVATRate(taxSettings),
      vatIncluded: true,
      kleinunternehmerExempt: taxSettings?.kleinunternehmerStatus || false,
      homeVisitAvailable: serviceData.homeVisitAvailable ?? true,
      travelIncluded: serviceData.travelIncluded ?? false,
      travelSurcharge: serviceData.travelSurcharge ?? 0,
      publicBookingEnabled: serviceData.publicBookingEnabled ?? true,
      packageSessions: serviceData.packageSessions,
      packageDiscountPercent: serviceData.packageDiscountPercent,
      active: true
    }
  })

  return NextResponse.json(formatServiceRateTemplate(newTemplate), { status: 201 })
}
```

### System Preferences

#### GET /api/settings/preferences
```typescript
interface SystemPreferencesResponse {
  language: {
    preferred: 'de' | 'en'
    availableLanguages: ('de' | 'en')[]
  }
  localization: {
    timezone: string
    currencyFormat: string
    dateFormat: string
    numberFormat: {
      decimalSeparator: string
      thousandsSeparator: string
    }
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    appointmentReminders: boolean
    taxThresholdAlerts: boolean
    complianceWarnings: boolean
    quarterlyReviewReminder: boolean
    annualTaxReturnReminder: boolean
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    compactMode: boolean
    showTutorials: boolean
    defaultDashboardView: string
  }
}

export async function GET(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)

  const [therapist, preferences] = await Promise.all([
    db.therapist.findUnique({ where: { id: therapistId } }),
    db.userPreferences.findUnique({ where: { therapistId } })
  ])

  return NextResponse.json(formatPreferencesResponse(therapist, preferences))
}
```

### Export Configurations

#### GET /api/settings/export-configs
```typescript
interface ExportConfigurationsResponse {
  configurations: {
    id: string
    configurationName: string
    exportType: string
    targetSystem: string
    fileFormat: string
    autoExportEnabled: boolean
    lastExportAt: string | null
    exportCount: number
  }[]
  supportedSystems: {
    name: string
    displayName: string
    formats: string[]
    features: string[]
  }[]
}

export async function GET(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)

  const configurations = await db.exportConfigurations.findMany({
    where: { therapistId },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({
    configurations: configurations.map(formatExportConfiguration),
    supportedSystems: getSupportedExportSystems()
  })
}
```

#### POST /api/settings/export-configs/test
```typescript
interface TestExportRequest {
  configurationId: string
  dateRange: {
    from: string
    to: string
  }
  includePreview: boolean
}

export async function POST(request: NextRequest) {
  const therapistId = await authenticateTherapist(request)
  const { configurationId, dateRange, includePreview }: TestExportRequest = await request.json()

  const configuration = await db.exportConfigurations.findFirst({
    where: { id: configurationId, therapistId }
  })

  if (!configuration) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
  }

  // Generate test export
  const exportData = await generateExport(therapistId, configuration, dateRange)

  const response = {
    success: true,
    recordCount: exportData.length,
    fileSize: calculateFileSize(exportData, configuration.fileFormat),
    estimatedGenerationTime: estimateGenerationTime(exportData.length),
    preview: includePreview ? exportData.slice(0, 5) : null
  }

  return NextResponse.json(response)
}
```

## Controllers

### Settings Controller Base
```typescript
abstract class BaseSettingsController {
  protected async authenticateAndGetTherapist(request: NextRequest): Promise<string> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new ApiError('Authentication required', 401)
    }
    return session.user.id as string
  }

  protected async validateTherapistAccess(therapistId: string, resourceId?: string): Promise<void> {
    if (resourceId) {
      // Validate that the resource belongs to the therapist
      const hasAccess = await this.checkResourceOwnership(therapistId, resourceId)
      if (!hasAccess) {
        throw new ApiError('Access denied', 403)
      }
    }
  }

  protected abstract checkResourceOwnership(therapistId: string, resourceId: string): Promise<boolean>

  protected handleApiError(error: unknown): NextResponse {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Settings API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Austrian Validation Controller
```typescript
class AustrianValidationController {
  async validatePostalCode(postalCode: string): Promise<boolean> {
    // Austrian postal codes: 1xxx-9xxx (no 0xxx)
    return /^[1-9]\d{3}$/.test(postalCode)
  }

  async validateVATNumber(vatNumber: string): Promise<boolean> {
    // Austrian UID format: ATUxxxxxxxx
    if (!/^ATU\d{8}$/.test(vatNumber)) {
      return false
    }

    // Optional: Check with BMF database
    try {
      return await this.verifyVATWithBMF(vatNumber)
    } catch {
      return true // Don't fail on API errors
    }
  }

  async validateBusinessRegistration(regNumber: string): Promise<boolean> {
    // Austrian Firmenbuchnummer format: FN xxxxxx x
    return /^FN \d{6}[a-z]$/.test(regNumber)
  }

  private async verifyVATWithBMF(vatNumber: string): Promise<boolean> {
    // Placeholder for BMF UID verification API
    // This would integrate with Austrian tax authority systems
    return true
  }

  validateWKONumber(wkoNumber: string): boolean {
    // WKO membership number validation
    return /^\d{7,10}$/.test(wkoNumber)
  }

  validateSocialInsuranceNumber(svnr: string): boolean {
    // Austrian SVNR format validation
    return /^\d{10}$/.test(svnr) && this.checkSVNRChecksum(svnr)
  }

  private checkSVNRChecksum(svnr: string): boolean {
    // Implement Austrian SVNR checksum algorithm
    const digits = svnr.split('').map(Number)
    const checksum = digits.slice(0, 9).reduce((sum, digit, index) => {
      return sum + digit * (index + 1)
    }, 0)
    return (checksum % 11) === digits[9]
  }
}
```

### Geographic Controller
```typescript
class GeographicController {
  private googleMapsClient: GoogleMapsApi

  constructor() {
    this.googleMapsClient = new GoogleMapsApi(process.env.GOOGLE_MAPS_API_KEY)
  }

  async geocodeAddress(address: AddressInput): Promise<Coordinates> {
    const fullAddress = `${address.line1}, ${address.postalCode} ${address.city}, Austria`

    try {
      const response = await this.googleMapsClient.geocode({
        params: {
          address: fullAddress,
          region: 'at',
          language: 'de'
        }
      })

      if (response.data.results.length === 0) {
        throw new ApiError('Address not found', 404)
      }

      const location = response.data.results[0].geometry.location
      return { lat: location.lat, lng: location.lng }
    } catch (error) {
      // Fallback to OpenStreetMap Nominatim
      return this.geocodeWithNominatim(fullAddress)
    }
  }

  async calculateTravelDistance(
    from: Coordinates,
    to: Coordinates,
    transportMethod: TransportMethod
  ): Promise<TravelCalculation> {
    try {
      const response = await this.googleMapsClient.distancematrix({
        params: {
          origins: [`${from.lat},${from.lng}`],
          destinations: [`${to.lat},${to.lng}`],
          mode: this.mapTransportMethodToGoogleMode(transportMethod),
          language: 'de',
          region: 'at',
          units: 'metric'
        }
      })

      const element = response.data.rows[0].elements[0]

      if (element.status !== 'OK') {
        throw new Error('Route calculation failed')
      }

      return {
        distance: element.distance.value / 1000, // Convert to km
        duration: element.duration.value / 60, // Convert to minutes
        cost: this.calculateTravelCost(element.distance.value / 1000, transportMethod),
        status: 'success'
      }
    } catch (error) {
      // Fallback to Haversine calculation
      return this.calculateHaversineDistance(from, to, transportMethod)
    }
  }

  private mapTransportMethodToGoogleMode(method: TransportMethod): string {
    const mapping = {
      car: 'driving',
      public_transport: 'transit',
      bicycle: 'bicycling',
      walking: 'walking',
      motorcycle: 'driving'
    }
    return mapping[method] || 'driving'
  }

  private calculateTravelCost(distanceKm: number, method: TransportMethod): number {
    // Austrian standard rates per transport method
    const rates = {
      car: 0.42, // Standard Austrian car rate
      motorcycle: 0.24,
      bicycle: 0.38,
      walking: 0,
      public_transport: 2.5 // Average public transport cost
    }

    return distanceKm * (rates[method] || rates.car)
  }
}
```