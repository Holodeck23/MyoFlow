-- CreateEnum
CREATE TYPE "ReminderPreference" AS ENUM ('BOTH', 'HOURS_24_ONLY', 'HOURS_2_ONLY', 'NONE');

-- AlterTable
ALTER TABLE "AppointmentReminder" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "failureReason" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "emailRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderPreference" "ReminderPreference" NOT NULL DEFAULT 'BOTH';