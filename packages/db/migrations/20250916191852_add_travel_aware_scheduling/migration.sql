-- CreateTable
-- Add travel preferences to Therapist model
ALTER TABLE "Therapist" ADD COLUMN "travelServiceRadius" INTEGER;
ALTER TABLE "Therapist" ADD COLUMN "travelRatePerKm" INTEGER;
ALTER TABLE "Therapist" ADD COLUMN "defaultTravelBuffer" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Therapist" ADD COLUMN "enableTravelService" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Therapist" ADD COLUMN "maxDailyTravelKm" INTEGER;

-- Enhance Location model with Austrian address validation
ALTER TABLE "Location" ADD COLUMN "street" TEXT;
ALTER TABLE "Location" ADD COLUMN "streetNumber" TEXT;
ALTER TABLE "Location" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "Location" ADD COLUMN "city" TEXT;
ALTER TABLE "Location" ADD COLUMN "state" TEXT;
ALTER TABLE "Location" ADD COLUMN "country" TEXT DEFAULT 'Austria';
ALTER TABLE "Location" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN "geocodedAt" TIMESTAMP(3);
ALTER TABLE "Location" ADD COLUMN "isValidated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Location" ADD COLUMN "districtCode" TEXT;
ALTER TABLE "Location" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Location" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add travel-related fields to Appointment model
ALTER TABLE "Appointment" ADD COLUMN "estimatedTravelTimeMin" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "travelDistanceKm" DOUBLE PRECISION;
ALTER TABLE "Appointment" ADD COLUMN "travelCostCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "requiresTravelBuffer" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Location_postalCode_city_idx" ON "Location"("postalCode", "city");
CREATE INDEX "Appointment_therapistId_locationId_start_idx" ON "Appointment"("therapistId", "locationId", "start");