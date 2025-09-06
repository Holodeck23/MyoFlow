/*
  Warnings:

  - Added the required column `updatedAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('HOLIDAY', 'VACATION', 'BREAK', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AustrianHolidayType" AS ENUM ('NATIONAL', 'REGIONAL', 'RELIGIOUS', 'COMMEMORATION');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recurrenceEnd" TIMESTAMP(3),
ADD COLUMN     "recurrenceId" TEXT,
ADD COLUMN     "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "BusinessHours" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "locationId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedTime" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "locationId" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "type" "BlockType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BlockedTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentReminder" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "AppointmentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AustrianHoliday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "AustrianHolidayType" NOT NULL,
    "year" INTEGER NOT NULL,
    "stateCode" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AustrianHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessHours_therapistId_active_idx" ON "BusinessHours"("therapistId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_therapistId_locationId_dayOfWeek_key" ON "BusinessHours"("therapistId", "locationId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "BlockedTime_therapistId_start_end_idx" ON "BlockedTime"("therapistId", "start", "end");

-- CreateIndex
CREATE INDEX "AppointmentReminder_status_scheduledFor_idx" ON "AppointmentReminder"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "AustrianHoliday_year_active_idx" ON "AustrianHoliday"("year", "active");

-- CreateIndex
CREATE INDEX "AustrianHoliday_stateCode_year_idx" ON "AustrianHoliday"("stateCode", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AustrianHoliday_date_stateCode_key" ON "AustrianHoliday"("date", "stateCode");

-- CreateIndex
CREATE INDEX "Appointment_therapistId_recurrenceId_idx" ON "Appointment"("therapistId", "recurrenceId");

-- AddForeignKey
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedTime" ADD CONSTRAINT "BlockedTime_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedTime" ADD CONSTRAINT "BlockedTime_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentReminder" ADD CONSTRAINT "AppointmentReminder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
