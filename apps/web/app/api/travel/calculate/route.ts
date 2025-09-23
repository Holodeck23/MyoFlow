import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { geocodeAustrianAddress, calculateTravelTime, type AustrianAddress, type TravelCalculation } from '@myoflow/lib'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { origin, destination, mode = 'driving' } = body

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      )
    }

    // Test Austrian address geocoding
    let originCoords: { latitude: number; longitude: number } | null = null
    let destinationCoords: { latitude: number; longitude: number } | null = null

    // Handle different input types
    if (typeof origin === 'string' || origin.street) {
      const geocodedOrigin = await geocodeAustrianAddress(origin)
      if (geocodedOrigin) {
        originCoords = {
          latitude: geocodedOrigin.latitude,
          longitude: geocodedOrigin.longitude
        }
      }
    } else if (origin.latitude && origin.longitude) {
      originCoords = origin
    }

    if (typeof destination === 'string' || destination.street) {
      const geocodedDestination = await geocodeAustrianAddress(destination)
      if (geocodedDestination) {
        destinationCoords = {
          latitude: geocodedDestination.latitude,
          longitude: geocodedDestination.longitude
        }
      }
    } else if (destination.latitude && destination.longitude) {
      destinationCoords = destination
    }

    if (!originCoords || !destinationCoords) {
      return NextResponse.json(
        { error: 'Could not geocode addresses' },
        { status: 400 }
      )
    }

    // Calculate travel time and distance
    const travelCalculation = await calculateTravelTime(
      originCoords,
      destinationCoords,
      mode as 'driving' | 'walking' | 'transit'
    )

    if (!travelCalculation) {
      return NextResponse.json(
        { error: 'Could not calculate travel time' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      origin: originCoords,
      destination: destinationCoords,
      travel: travelCalculation,
      apiKey: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'missing'
    })

  } catch (error) {
    console.error('Travel calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}