# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-11-travel-aware-scheduling/spec.md

> Created: 2025-09-11
> Version: 1.0.0

## Endpoints

### GET /api/travel/calculate-route

**Purpose:** Calculate travel time and distance between two locations
**Parameters:** 
- `fromLat` (number): Starting latitude
- `fromLng` (number): Starting longitude  
- `toLat` (number): Destination latitude
- `toLng` (number): Destination longitude
- `transportMethod` (string): CAR | PUBLIC_TRANSPORT | BICYCLE | WALKING
**Response:** 
```json
{
  "distanceKm": 12.5,
  "durationMinutes": 18,
  "travelCostCents": 625,
  "route": {
    "polyline": "encoded_polyline_string",
    "steps": ["Turn left on...", "Continue straight..."]
  }
}
```
**Errors:** 400 (Invalid coordinates), 429 (Rate limit exceeded), 503 (Routing service unavailable)

### POST /api/travel/validate-appointment

**Purpose:** Validate if appointment time allows sufficient travel buffer from previous appointment
**Parameters:**
```json
{
  "appointmentId": "clp123abc",
  "start": "2025-09-15T10:00:00Z",
  "clientId": "clp456def",
  "previousAppointmentId": "clp789ghi"
}
```
**Response:**
```json
{
  "isValid": true,
  "travelTimeMinutes": 15,
  "bufferMinutes": 5,
  "hasConflict": false,
  "suggestion": null
}
```
**Errors:** 400 (Invalid appointment data), 404 (Client/appointment not found)

### GET /api/travel/therapist-settings

**Purpose:** Retrieve therapist travel preferences and settings
**Parameters:** None (uses session therapist ID)
**Response:**
```json
{
  "baseLatitude": 48.2082,
  "baseLongitude": 16.3738,
  "baseAddress": "Wien, Austria",
  "transportMethod": "CAR",
  "travelRatePerKm": 0.50,
  "defaultTravelBuffer": 15,
  "maxTravelDistance": 50,
  "includesTravelFees": true
}
```
**Errors:** 401 (Unauthorized), 404 (Therapist settings not found)

### PUT /api/travel/therapist-settings

**Purpose:** Update therapist travel preferences and settings
**Parameters:**
```json
{
  "baseAddress": "Wien, Austria",
  "transportMethod": "CAR",
  "travelRatePerKm": 0.50,
  "defaultTravelBuffer": 15,
  "maxTravelDistance": 50,
  "includesTravelFees": true
}
```
**Response:**
```json
{
  "success": true,
  "settings": {
    "baseLatitude": 48.2082,
    "baseLongitude": 16.3738,
    "baseAddress": "Wien, Austria",
    "transportMethod": "CAR",
    "travelRatePerKm": 0.50,
    "defaultTravelBuffer": 15,
    "maxTravelDistance": 50,
    "includesTravelFees": true
  }
}
```
**Errors:** 400 (Invalid settings data), 401 (Unauthorized)

### POST /api/travel/geocode-address

**Purpose:** Convert Austrian address to coordinates using geocoding service
**Parameters:**
```json
{
  "address": "Stephansplatz 1, 1010 Wien, Austria"
}
```
**Response:**
```json
{
  "latitude": 48.2082,
  "longitude": 16.3738,
  "formattedAddress": "Stephansplatz 1, 1010 Wien, Austria",
  "components": {
    "streetNumber": "1",
    "streetName": "Stephansplatz",
    "city": "Wien",
    "postalCode": "1010",
    "country": "Austria"
  }
}
```
**Errors:** 400 (Invalid address), 404 (Address not found), 503 (Geocoding service unavailable)

### GET /api/appointments/with-travel

**Purpose:** Get appointments with calculated travel times and route information
**Parameters:**
- `date` (string, optional): Filter by date (YYYY-MM-DD)
- `includeRoute` (boolean, optional): Include route polyline data
**Response:**
```json
{
  "appointments": [
    {
      "id": "clp123abc",
      "start": "2025-09-15T09:00:00Z",
      "end": "2025-09-15T10:00:00Z",
      "client": {
        "id": "clp456def",
        "name": "Maria Müller",
        "address": "Mariahilfer Str. 1, Wien",
        "latitude": 48.2005,
        "longitude": 16.3570
      },
      "travel": {
        "fromPrevious": {
          "durationMinutes": 12,
          "distanceKm": 8.5,
          "costCents": 425,
          "hasConflict": false
        },
        "toNext": {
          "durationMinutes": 18,
          "distanceKm": 12.3,
          "costCents": 615,
          "hasConflict": false
        }
      }
    }
  ]
}
```
**Errors:** 401 (Unauthorized), 400 (Invalid date format)

## Controllers

### TravelController
- **calculateRoute()** - Interfaces with Google Maps API to calculate travel times with caching
- **validateAppointment()** - Checks appointment conflicts based on travel time requirements  
- **getTherapistSettings()** - Retrieves travel preferences from database
- **updateTherapistSettings()** - Updates preferences with address geocoding
- **geocodeAddress()** - Converts addresses to coordinates with Austrian validation

### AppointmentController Extensions  
- **getAppointmentsWithTravel()** - Enhanced appointment listing with travel calculations
- **createAppointmentWithValidation()** - Appointment creation with travel conflict detection
- **updateAppointmentTravelData()** - Recalculate travel times when appointment changes

## Integration Points

**Google Maps Integration:** All routing calculations use Google Maps Directions API with Austrian locale settings and metric units.

**Database Caching:** Travel calculations are cached in TravelCalculation model to minimize API calls and improve performance.

**Real-time Validation:** Appointment creation and editing includes immediate travel time validation with user feedback.

**Austrian Address Support:** Geocoding prioritizes Austrian postal codes and address formats with validation against Austrian address standards.