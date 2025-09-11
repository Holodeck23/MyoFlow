# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-11-travel-aware-scheduling/spec.md

> Created: 2025-09-11
> Version: 1.0.0

## Schema Changes

### Therapist Model Extensions
```prisma
model Therapist {
  // ... existing fields
  
  // Travel Settings
  baseLatitude      Float?
  baseLongitude     Float?
  baseAddress       String?
  transportMethod   TransportMethod @default(CAR)
  travelRatePerKm   Decimal?        @db.Decimal(10,2)
  defaultTravelBuffer Int?          @default(15) // minutes
  maxTravelDistance   Int?          @default(50) // kilometers
  includesTravelFees  Boolean       @default(false)
  
  // Travel tracking
  travelCalculations TravelCalculation[]
}

enum TransportMethod {
  CAR
  PUBLIC_TRANSPORT
  BICYCLE
  WALKING
}
```

### Client Model Extensions
```prisma
model Client {
  // ... existing fields
  
  // Location data
  latitude    Float?
  longitude   Float?
  
  // Calculated travel data
  travelCalculations TravelCalculation[]
}
```

### New TravelCalculation Model
```prisma
model TravelCalculation {
  id            String   @id @default(cuid())
  therapistId   String
  clientId      String?
  fromLatitude  Float
  fromLongitude Float
  toLatitude    Float
  toLongitude   Float
  
  // Calculated values
  distanceKm    Decimal  @db.Decimal(8,2)
  durationMinutes Int
  travelCostCents Int?
  transportMethod TransportMethod
  
  // Metadata
  calculatedAt  DateTime @default(now())
  isValid       Boolean  @default(true)
  
  // Relations
  therapist     Therapist @relation(fields: [therapistId], references: [id], onDelete: Cascade)
  client        Client?   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@unique([therapistId, fromLatitude, fromLongitude, toLatitude, toLongitude, transportMethod])
  @@index([therapistId, calculatedAt])
}
```

### Appointment Model Extensions
```prisma
model Appointment {
  // ... existing fields
  
  // Travel integration
  travelTimeMinutes    Int?
  travelCostCents      Int?
  hasTravelConflict    Boolean @default(false)
  travelCalculationId  String?
  
  travelCalculation    TravelCalculation? @relation(fields: [travelCalculationId], references: [id])
}
```

## Migrations

### Migration: Add Travel Features
```sql
-- Add travel settings to Therapist table
ALTER TABLE "Therapist" ADD COLUMN "baseLatitude" DOUBLE PRECISION;
ALTER TABLE "Therapist" ADD COLUMN "baseLongitude" DOUBLE PRECISION;
ALTER TABLE "Therapist" ADD COLUMN "baseAddress" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "transportMethod" TEXT NOT NULL DEFAULT 'CAR';
ALTER TABLE "Therapist" ADD COLUMN "travelRatePerKm" DECIMAL(10,2);
ALTER TABLE "Therapist" ADD COLUMN "defaultTravelBuffer" INTEGER DEFAULT 15;
ALTER TABLE "Therapist" ADD COLUMN "maxTravelDistance" INTEGER DEFAULT 50;
ALTER TABLE "Therapist" ADD COLUMN "includesTravelFees" BOOLEAN NOT NULL DEFAULT false;

-- Add location data to Client table
ALTER TABLE "Client" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Client" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Create TransportMethod enum
CREATE TYPE "TransportMethod" AS ENUM ('CAR', 'PUBLIC_TRANSPORT', 'BICYCLE', 'WALKING');
ALTER TABLE "Therapist" ALTER COLUMN "transportMethod" TYPE "TransportMethod" USING "transportMethod"::text::"TransportMethod";

-- Create TravelCalculation table
CREATE TABLE "TravelCalculation" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "clientId" TEXT,
    "fromLatitude" DOUBLE PRECISION NOT NULL,
    "fromLongitude" DOUBLE PRECISION NOT NULL,
    "toLatitude" DOUBLE PRECISION NOT NULL,
    "toLongitude" DOUBLE PRECISION NOT NULL,
    "distanceKm" DECIMAL(8,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "travelCostCents" INTEGER,
    "transportMethod" "TransportMethod" NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TravelCalculation_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "TravelCalculation" ADD CONSTRAINT "TravelCalculation_therapistId_fkey" 
    FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelCalculation" ADD CONSTRAINT "TravelCalculation_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint for caching
ALTER TABLE "TravelCalculation" ADD CONSTRAINT "TravelCalculation_unique_route" 
    UNIQUE ("therapistId", "fromLatitude", "fromLongitude", "toLatitude", "toLongitude", "transportMethod");

-- Add indexes for performance
CREATE INDEX "TravelCalculation_therapistId_calculatedAt_idx" ON "TravelCalculation"("therapistId", "calculatedAt");

-- Add travel fields to Appointment table
ALTER TABLE "Appointment" ADD COLUMN "travelTimeMinutes" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "travelCostCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "hasTravelConflict" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN "travelCalculationId" TEXT;

-- Add foreign key for travel calculation
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_travelCalculationId_fkey" 
    FOREIGN KEY ("travelCalculationId") REFERENCES "TravelCalculation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Rationale

**Travel Settings Storage:** Therapist model extensions store base location and preferences for route calculations, enabling personalized travel cost and time estimates.

**Location Data Caching:** TravelCalculation model caches route calculations to minimize external API calls and improve performance, with unique constraints preventing duplicate calculations.

**Flexible Transport Methods:** Enum supports different transport modes common in Austrian cities (car, public transport, bicycle, walking) with method-specific calculations.

**Appointment Integration:** Travel time and cost fields in Appointment model enable conflict detection and automatic travel fee billing when configured.

**Performance Optimization:** Indexes on therapist ID and calculation timestamp enable efficient querying of recent travel data and cache invalidation strategies.