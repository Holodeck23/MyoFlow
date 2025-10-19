# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-09-27-appointment-reminders/spec.md

> Created: 2025-09-27
> Status: Ready for Implementation

## Tasks

- [ ] 1. **Database Schema Extensions**
  - [ ] 1.1 Write tests for AppointmentReminder model extensions
  - [ ] 1.2 Add delivery tracking fields (sentAt, deliveredAt, failureReason) to AppointmentReminder model
  - [ ] 1.3 Add email reminder preferences to Client model (emailRemindersEnabled, reminderPreference)
  - [ ] 1.4 Create Prisma migration for new fields
  - [ ] 1.5 Update database schema generation and sync
  - [ ] 1.6 Verify all tests pass

- [ ] 2. **Background Job Processing Setup**
  - [ ] 2.1 Write tests for BullMQ reminder job processing
  - [ ] 2.2 Install and configure BullMQ with Redis connection
  - [ ] 2.3 Create ReminderQueue class for job scheduling and processing
  - [ ] 2.4 Implement job scheduling on appointment creation/updates
  - [ ] 2.5 Add retry logic and failure handling for reminder jobs
  - [ ] 2.6 Create job monitoring and cleanup utilities
  - [ ] 2.7 Verify all tests pass

- [ ] 3. **Email Service Integration**
  - [ ] 3.1 Write tests for email delivery service
  - [ ] 3.2 Install and configure Nodemailer with SMTP settings
  - [ ] 3.3 Create EmailService class with delivery status tracking
  - [ ] 3.4 Implement Austrian timezone-aware sending (8:00-18:00 Vienna time)
  - [ ] 3.5 Add Austrian holiday checking to prevent weekend/holiday sends
  - [ ] 3.6 Create email delivery retry and failure logging
  - [ ] 3.7 Verify all tests pass

- [ ] 4. **German Email Templates & Confirmation System**
  - [ ] 4.1 Write tests for email template rendering and token generation
  - [ ] 4.2 Create responsive HTML email templates in German for appointment reminders
  - [ ] 4.3 Implement secure token generation for confirmation/reschedule links
  - [ ] 4.4 Build appointment confirmation API endpoint
  - [ ] 4.5 Build reschedule request API endpoint
  - [ ] 4.6 Add GDPR-compliant unsubscribe functionality
  - [ ] 4.7 Verify all tests pass

- [ ] 5. **Therapist Configuration & Client Preferences**
  - [ ] 5.1 Write tests for reminder configuration APIs
  - [ ] 5.2 Create therapist reminder settings API endpoints
  - [ ] 5.3 Build client email preference management interface
  - [ ] 5.4 Implement opt-out mechanisms and consent tracking
  - [ ] 5.5 Add reminder status monitoring for therapists
  - [ ] 5.6 Create configuration UI components for practice settings
  - [ ] 5.7 Verify all tests pass