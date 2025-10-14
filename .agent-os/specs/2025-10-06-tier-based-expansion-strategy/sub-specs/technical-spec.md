# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-06-tier-based-expansion-strategy/spec.md

## Technical Requirements

### Tier System Architecture

- **User License Type Field**: Add `licenseType: 'massage' | 'physio' | 'admin'` enum to User model with verification document upload
- **Subscription Tier Tracking**: Add `tier: 'massage' | 'physio' | 'clinic'` to Subscription model with billing cycle (monthly/annual)
- **Feature Access Control**: Implement middleware checking `user.licenseType` before rendering exercise features, SOAP templates, outcome measurement tools
- **One-Click Upgrade Flow**:
  - Upload license document → S3 storage with encryption
  - Manual/automated verification step (future: integrate with Austrian Federal Ministry of Health registry)
  - Update `user.licenseType` + `subscription.tier` atomically
  - Unlock features immediately without data migration

### License Verification System

- **Document Upload**: Secure S3 bucket for license certificates (Austrian Berufsausweis)
- **Verification Status**: `pending | verified | rejected` with admin review queue
- **Automated Validation** (Phase 2): OCR + pattern matching for Austrian license numbers
- **Compliance Audit Trail**: Log all license changes and tier upgrades with timestamps

### Pricing & Billing

- **Stripe Subscription Plans**:
  - `price_massage_monthly` (€29)
  - `price_physio_monthly` (€45)
  - `price_clinic_monthly` (€89)
  - Annual options with 15% discount (€295/€459/€907 yearly)
- **Feature Gating**: Webhook handling for subscription status changes (active → past_due → canceled)
- **Prorated Upgrades**: Calculate prorated charge when upgrading mid-cycle (Massage → Physio)

### Database Schema Changes

```typescript
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  licenseType           LicenseType @default(MASSAGE)
  licenseDocument       String?  // S3 URL
  licenseVerifiedAt     DateTime?
  licenseVerificationStatus VerificationStatus @default(PENDING)
}

enum LicenseType {
  MASSAGE      // Medizinischer Masseur / Heilmasseur
  PHYSIO       // Physiotherapeut
  ADMIN        // Platform admin
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}

model Subscription {
  id            String   @id @default(cuid())
  userId        String
  tier          SubscriptionTier
  status        SubscriptionStatus
  billingCycle  BillingCycle
  stripeSubscriptionId String? @unique
  currentPeriodEnd DateTime?
}

enum SubscriptionTier {
  MASSAGE   // €29/mo - core features only
  PHYSIO    // €45/mo - + exercise prescription
  CLINIC    // €89/mo - + multi-user
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}
```

### Feature Flag Implementation

```typescript
// Exercise Library (physio-only)
if (user.licenseType !== 'PHYSIO' && user.licenseType !== 'ADMIN') {
  throw new Error('Exercise prescription requires Physiotherapist license')
}

// SOAP Templates (physio-only)
const soapTemplates = await prisma.noteTemplate.findMany({
  where: {
    accessLevel: user.licenseType === 'PHYSIO' ? undefined : { not: 'PHYSIO_ONLY' }
  }
})

// Multi-user access (clinic tier only)
if (subscription.tier !== 'CLINIC' && teamMembers.length >= 2) {
  return { error: 'Multi-user access requires Clinic tier subscription' }
}
```

### UI/UX Requirements

- **Tier Badge**: Display current tier (Massage/Physio/Clinic) in sidebar with upgrade CTA
- **Locked Feature State**: Show exercise library with overlay "Upgrade to Physio Tier to unlock" for massage users
- **Upgrade Modal**: Streamlined flow - upload license → verify → payment (prorated) → instant unlock
- **Pricing Page**: Comparison table highlighting legal compliance (massage users see "Not available - requires Physio license" for exercise features)

### Performance Considerations

- **Feature Flag Caching**: Cache `user.licenseType` in session to avoid DB lookup on every request
- **License Document CDN**: Serve verification documents via CloudFront for fast admin review
- **Tier Check Optimization**: Single JOIN query to fetch `user + subscription + licenseType` on auth

### Integration Requirements

- **Stripe Webhooks**: Handle `customer.subscription.updated`, `customer.subscription.deleted` for tier downgrades
- **Austrian eID (Future)**: Integrate with Handy-Signatur for automated license verification via Federal Health Registry
- **ELGA**: Existing integration maintained across all tiers (required for Austrian compliance)

## External Dependencies

No new external dependencies required. Existing stack handles tier system:
- **Stripe**: Already integrated for payments, just add new price IDs
- **AWS S3**: Already used for document storage (invoices), extend for license documents
- **Prisma**: Schema changes only, no new ORM required
- **NextAuth**: Extend session object to include `licenseType` field
