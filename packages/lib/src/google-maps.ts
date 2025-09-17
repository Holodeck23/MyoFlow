import { Client } from '@googlemaps/google-maps-services-js'

// Initialize Google Maps client
let mapsClient: Client | null = null

function getGoogleMapsClient(): Client {
  if (!mapsClient) {
    mapsClient = new Client({})
  }
  return mapsClient
}

export interface AustrianAddress {
  street?: string
  streetNumber?: string
  postalCode?: string
  city?: string
  state?: string
  country?: string
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress: string
  addressComponents: {
    street?: string
    streetNumber?: string
    postalCode?: string
    city?: string
    state?: string
    country?: string
  }
  isValidated: boolean
}

export interface TravelCalculation {
  distanceKm: number
  durationMin: number
  route?: string
  mode: 'driving' | 'walking' | 'transit'
}

/**
 * Geocode an Austrian address to get latitude/longitude coordinates
 */
export async function geocodeAustrianAddress(
  address: AustrianAddress | string
): Promise<GeocodingResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not configured, skipping geocoding')
      return null
    }

    const client = getGoogleMapsClient()

    // Format address for Austrian locale
    let addressString: string
    if (typeof address === 'string') {
      addressString = address
    } else {
      const parts = [
        address.street && address.streetNumber
          ? `${address.street} ${address.streetNumber}`
          : address.street,
        address.postalCode && address.city
          ? `${address.postalCode} ${address.city}`
          : address.city,
        address.state,
        address.country || 'Austria'
      ].filter(Boolean)

      addressString = parts.join(', ')
    }

    const response = await client.geocode({
      params: {
        address: addressString,
        region: 'at', // Bias results to Austria
        language: 'de', // German language for Austrian addresses
        key: apiKey,
      },
    })

    if (response.data.status !== 'OK' || !response.data.results.length) {
      console.warn('Geocoding failed:', response.data.status)
      return null
    }

    const result = response.data.results[0]
    const location = result.geometry.location

    // Parse address components for Austrian format
    const addressComponents: GeocodingResult['addressComponents'] = {}

    for (const component of result.address_components) {
      if (component.types.includes('street_number' as any)) {
        addressComponents.streetNumber = component.long_name
      } else if (component.types.includes('route' as any)) {
        addressComponents.street = component.long_name
      } else if (component.types.includes('postal_code' as any)) {
        addressComponents.postalCode = component.long_name
      } else if (component.types.includes('locality' as any)) {
        addressComponents.city = component.long_name
      } else if (component.types.includes('administrative_area_level_1' as any)) {
        addressComponents.state = component.long_name
      } else if (component.types.includes('country' as any)) {
        addressComponents.country = component.long_name
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      addressComponents,
      isValidated: true,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Calculate travel time and distance between two points in Austria
 */
export async function calculateTravelTime(
  origin: { latitude: number; longitude: number } | string,
  destination: { latitude: number; longitude: number } | string,
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): Promise<TravelCalculation | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not configured, using fallback calculation')
      return calculateFallbackTravel(origin, destination, mode)
    }

    const client = getGoogleMapsClient()

    // Format origins and destinations
    const originString = typeof origin === 'string'
      ? origin
      : `${origin.latitude},${origin.longitude}`
    const destinationString = typeof destination === 'string'
      ? destination
      : `${destination.latitude},${destination.longitude}`

    const response = await client.distancematrix({
      params: {
        origins: [originString],
        destinations: [destinationString],
        mode: mode as any,
        units: 'metric' as any,
        region: 'at', // Austria
        language: 'de', // German
        key: apiKey,
      },
    })

    if (response.data.status !== 'OK' || !response.data.rows.length) {
      console.warn('Distance matrix failed:', response.data.status)
      return calculateFallbackTravel(origin, destination, mode)
    }

    const element = response.data.rows[0].elements[0]

    if (element.status !== 'OK') {
      console.warn('Distance calculation failed:', element.status)
      return calculateFallbackTravel(origin, destination, mode)
    }

    return {
      distanceKm: element.distance.value / 1000, // Convert meters to kilometers
      durationMin: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
      mode,
    }
  } catch (error) {
    console.error('Travel calculation error:', error)
    return calculateFallbackTravel(origin, destination, mode)
  }
}

/**
 * Fallback travel calculation using straight-line distance
 * Used when Google Maps API is not available
 */
function calculateFallbackTravel(
  origin: { latitude: number; longitude: number } | string,
  destination: { latitude: number; longitude: number } | string,
  mode: 'driving' | 'walking' | 'transit'
): TravelCalculation | null {
  // For string addresses, we can't calculate without geocoding
  if (typeof origin === 'string' || typeof destination === 'string') {
    return null
  }

  // Calculate straight-line distance using Haversine formula
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(destination.latitude - origin.latitude)
  const dLon = toRadians(destination.longitude - origin.longitude)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.latitude)) * Math.cos(toRadians(destination.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const straightLineKm = R * c

  // Apply realistic factors for different transport modes
  let distanceKm: number
  let avgSpeedKmh: number

  switch (mode) {
    case 'driving':
      distanceKm = straightLineKm * 1.3 // Roads add ~30% to straight-line distance
      avgSpeedKmh = 40 // Average city driving speed in Austria
      break
    case 'walking':
      distanceKm = straightLineKm * 1.2 // Walking paths add ~20%
      avgSpeedKmh = 5 // Walking speed
      break
    case 'transit':
      distanceKm = straightLineKm * 1.4 // Public transport routes add ~40%
      avgSpeedKmh = 25 // Average public transport speed
      break
    default:
      distanceKm = straightLineKm * 1.3
      avgSpeedKmh = 40
  }

  const durationMin = Math.ceil((distanceKm / avgSpeedKmh) * 60)

  return {
    distanceKm: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
    durationMin,
    mode,
  }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Validate Austrian postal code format (1010-9991)
 */
export function validateAustrianPostalCode(postalCode: string): boolean {
  const austrianPostalCodeRegex = /^[1-9]\d{3}$/
  return austrianPostalCodeRegex.test(postalCode)
}

/**
 * Get Austrian state (Bundesland) from postal code
 */
export function getAustrianStateFromPostalCode(postalCode: string): string | null {
  if (!validateAustrianPostalCode(postalCode)) {
    return null
  }

  const firstDigit = parseInt(postalCode[0])

  switch (firstDigit) {
    case 1: return 'Wien'
    case 2: return 'Niederösterreich'
    case 3: return 'Niederösterreich'
    case 4: return 'Oberösterreich'
    case 5: return 'Salzburg'
    case 6: return 'Tirol'
    case 7: return 'Burgenland'
    case 8: return 'Steiermark'
    case 9: return 'Kärnten'
    default: return null
  }
}