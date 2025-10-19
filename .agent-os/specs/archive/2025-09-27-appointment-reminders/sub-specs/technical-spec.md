# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-27-appointment-reminders/spec.md

> Created: 2025-09-27
> Version: 1.0.0

## Technical Requirements

- **Background Job Processing**: Integrate BullMQ for scheduling and processing reminder jobs at 24h and 2h intervals before appointments
- **Email Service Integration**: Implement SMTP-based email delivery with delivery status tracking and retry logic for failed sends
- **Austrian Timezone Handling**: Use existing Vienna timezone configuration to schedule reminders respecting Austrian business hours (8:00-18:00)
- **German Email Templates**: Create responsive HTML email templates with Austrian therapy practice branding and German language content
- **Confirmation Link Generation**: Generate secure, time-limited tokens for appointment confirmation and rescheduling workflows
- **GDPR Consent Integration**: Extend existing Consent model to track email communication preferences and provide one-click unsubscribe
- **Austrian Holiday Awareness**: Integrate with existing AustrianHoliday model to avoid sending reminders on public holidays
- **Database Extension**: Extend AppointmentReminder model with delivery tracking fields (sentAt, deliveredAt, failureReason)
- **Client Preference Management**: Add email reminder preferences to Client model with opt-out capability
- **Audit Logging**: Use Winston structured logging for reminder delivery tracking and compliance reporting

## Approach

### 1. Background Job Architecture
- Implement BullMQ queue system with Redis backing store
- Create job processors for 24-hour and 2-hour reminder intervals
- Use cron-based scheduling to scan upcoming appointments and enqueue reminder jobs
- Implement job retry logic with exponential backoff for failed email deliveries

### 2. Email Service Layer
- Create EmailService abstraction with Nodemailer implementation
- Support for SMTP configuration with Austrian email providers
- Template rendering engine for personalized German-language content
- Delivery status tracking with webhook handling for bounce/complaint management

### 3. Database Schema Extensions
```prisma
model AppointmentReminder {
  // Extend existing model with:
  sentAt         DateTime?
  deliveredAt    DateTime?
  failureReason  String?
  retryCount     Int @default(0)
  deliveryStatus ReminderDeliveryStatus @default(PENDING)
}

model Client {
  // Add email preferences:
  emailReminders Boolean @default(true)
  reminderOptOut DateTime?
}

enum ReminderDeliveryStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
  COMPLAINED
}
```

### 4. GDPR Compliance Integration
- Extend Consent model for email communication tracking
- Implement secure unsubscribe tokens with database verification
- Audit trail for all email preference changes
- One-click unsubscribe workflow respecting Austrian privacy laws

## External Dependencies

**Nodemailer** - SMTP email delivery with Austrian provider support
- **Justification:** Reliable email delivery with delivery status tracking, supports Austrian email providers
- **Version:** ^6.9.0

**@bullmq/pro** - Advanced background job processing
- **Justification:** Robust job scheduling with retry logic, failure handling, and monitoring capabilities
- **Version:** ^7.0.0