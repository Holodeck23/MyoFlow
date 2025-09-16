# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-09-11-travel-aware-scheduling/spec.md

> Created: 2025-09-16
> Status: Ready for Implementation

## Tasks

- [ ] 1. Database Schema & Migration Setup
  - [ ] 1.1 Write tests for Prisma schema extensions (Therapist, Client, TravelCalculation models)
  - [ ] 1.2 Create Prisma migration for travel-related database changes
  - [ ] 1.3 Extend Therapist model with travel settings fields (baseLatitude, baseLongitude, transportMethod, travelRatePerKm, etc.)
  - [ ] 1.4 Add location fields to Client model (latitude, longitude)
  - [ ] 1.5 Create TravelCalculation model with caching and performance indexes
  - [ ] 1.6 Extend Appointment model with travel integration fields
  - [ ] 1.7 Create TransportMethod enum (CAR, PUBLIC_TRANSPORT, BICYCLE, WALKING)
  - [ ] 1.8 Verify all schema changes and foreign key constraints work correctly

- [ ] 2. External API Integration & Utilities
  - [ ] 2.1 Write tests for Google Maps API integration functions
  - [ ] 2.2 Set up Google Maps services client with Austrian locale configuration
  - [ ] 2.3 Implement address geocoding utility for Austrian postal codes
  - [ ] 2.4 Create route calculation utility with transport method support
  - [ ] 2.5 Implement travel cost calculation based on distance and therapist rates
  - [ ] 2.6 Add API rate limiting and caching mechanisms for route calculations
  - [ ] 2.7 Create Austrian address validation utility
  - [ ] 2.8 Verify all API integrations work with Austrian test addresses

- [ ] 3. Travel Settings API & Business Logic
  - [ ] 3.1 Write tests for travel settings API endpoints
  - [ ] 3.2 Create GET /api/travel/therapist-settings endpoint
  - [ ] 3.3 Create PUT /api/travel/therapist-settings endpoint with address geocoding
  - [ ] 3.4 Implement POST /api/travel/geocode-address endpoint
  - [ ] 3.5 Create GET /api/travel/calculate-route endpoint with caching
  - [ ] 3.6 Add travel preferences validation and Austrian address support
  - [ ] 3.7 Implement therapist base location management
  - [ ] 3.8 Verify all endpoints handle errors properly and return expected data formats

- [ ] 4. Appointment Travel Validation System
  - [ ] 4.1 Write tests for appointment travel conflict detection
  - [ ] 4.2 Create POST /api/travel/validate-appointment endpoint
  - [ ] 4.3 Implement travel time calculation between consecutive appointments
  - [ ] 4.4 Add appointment conflict detection based on travel buffers
  - [ ] 4.5 Extend appointment creation API with travel validation
  - [ ] 4.6 Create GET /api/appointments/with-travel endpoint for enhanced appointment listings
  - [ ] 4.7 Implement automatic travel buffer suggestions
  - [ ] 4.8 Verify all travel validation logic prevents impossible scheduling conflicts

- [ ] 5. Travel Settings UI & User Experience
  - [ ] 5.1 Write tests for travel settings components
  - [ ] 5.2 Create travel settings page in dashboard (/dashboard/settings/travel)
  - [ ] 5.3 Implement base location selection with Austrian address autocomplete
  - [ ] 5.4 Add transport method selection with appropriate Austrian options
  - [ ] 5.5 Create travel rate configuration (€/km) with Austrian currency formatting
  - [ ] 5.6 Implement travel buffer and distance limit settings
  - [ ] 5.7 Add travel fee billing configuration toggle
  - [ ] 5.8 Verify all settings save correctly and update appointment calculations in real-time