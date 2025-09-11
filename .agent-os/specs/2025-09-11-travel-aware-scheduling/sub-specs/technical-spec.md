# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-11-travel-aware-scheduling/spec.md

> Created: 2025-09-11
> Version: 1.0.0

## Technical Requirements

- **Routing API Integration** - Integrate with Google Maps Directions API or OpenStreetMap routing service for Austrian address support
- **Address Geocoding System** - Convert Austrian addresses to coordinates using standardized Austrian postal code format
- **Travel Time Calculation Engine** - Real-time travel duration calculation between appointment locations with configurable transport modes
- **Geographic Data Storage** - Extend Client and Therapist models with latitude/longitude coordinates and address validation
- **Travel Preferences Configuration** - Therapist settings for base location, transport method, travel rates (€/km), and time buffers
- **Scheduling Conflict Detection** - Real-time validation during appointment creation to prevent impossible back-to-back bookings
- **Travel Cost Calculation** - Automatic distance-based cost calculation with configurable rates and optional invoice integration  
- **Calendar Geographic Views** - Map-based appointment visualization with client location clustering and route optimization
- **Austrian Address Validation** - Support for Austrian postal codes, street formats, and city/state combinations
- **Performance Optimization** - Caching of frequently calculated routes and rate limiting for external API calls

## Approach

The travel-aware scheduling system will be implemented as an enhancement to the existing appointment system, leveraging geographic APIs and extending the current Prisma data model. The solution will prioritize Austrian address standards and support multiple transport modes commonly used by mobile therapists.

## External Dependencies

- **Google Maps JavaScript API** - For address geocoding, routing calculations, and map visualization
  - **Justification:** Industry standard with comprehensive Austrian coverage and reliable routing data
- **@googlemaps/google-maps-services-js** - Node.js client for server-side API calls
  - **Justification:** Official Google client with TypeScript support for backend routing calculations
- **Austrian Postal Code Database** - Validation dataset for Austrian addresses
  - **Justification:** Ensures accurate address validation for Austrian therapy practice locations