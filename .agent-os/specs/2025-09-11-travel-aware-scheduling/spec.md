# Spec Requirements Document

> Spec: Travel-Aware Scheduling & Settings
> Created: 2025-09-11

## Overview

Implement travel-aware scheduling functionality that enables Austrian massage therapists to optimize their practice by considering travel time and costs between client locations. This feature will reduce scheduling conflicts, improve time management, and increase profitability by enabling smarter appointment routing and travel cost tracking.

## User Stories

### Travel-Optimized Scheduling

As a mobile massage therapist, I want the system to consider travel time between appointments when I'm scheduling, so that I can avoid impossible back-to-back bookings and optimize my daily routes.

The therapist sets up their home base location and preferred routing method (car, public transport, walking). When creating appointments, the system calculates travel time between locations and warns of conflicts. The system can suggest optimal appointment sequences and automatically add travel buffers to prevent overbooking.

### Travel Cost Tracking & Billing

As a therapist who travels to clients, I want to track travel costs and optionally bill clients for travel fees, so that I can maintain profitability on distant appointments.

The system tracks distances, calculates travel costs based on therapist preferences (€/km rate, public transport costs), and can automatically add travel fees to invoices. The therapist can see travel analytics and adjust pricing for distant clients.

### Location-Based Client Management

As a therapist serving multiple areas, I want to group clients by location and see geographic clusters on my calendar, so that I can optimize my scheduling and identify areas for growth.

The system displays client locations on a map view, groups nearby clients, and provides insights on travel efficiency. The calendar can be filtered by geographic area, and the system can suggest appointment batching for efficient routing.

## Spec Scope

1. **Travel Time Calculation Engine** - Integration with routing APIs to calculate realistic travel times between appointments
2. **Travel Preferences Management** - Therapist settings for transport method, base location, travel rates, and buffer preferences  
3. **Smart Scheduling Validation** - Real-time conflict detection and travel time warnings during appointment creation
4. **Travel Cost Tracking** - Automatic distance/cost calculation with optional client billing integration
5. **Location-Based Calendar Views** - Geographic clustering and route optimization suggestions for daily schedules

## Out of Scope

- Real-time traffic integration (use average travel times)
- Multi-day trip planning and overnight stays
- Integration with vehicle tracking or GPS devices
- Advanced route optimization algorithms (focus on pairwise travel time calculations)

## Expected Deliverable

1. Functional travel time validation that prevents impossible appointment scheduling conflicts
2. Complete travel preferences settings page with Austrian address validation and routing options
3. Enhanced appointment creation flow with travel time warnings and automatic buffer suggestions