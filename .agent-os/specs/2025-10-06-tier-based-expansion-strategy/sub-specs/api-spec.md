# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-10-06-tier-based-expansion-strategy/spec.md

## API Endpoints

### License Management

#### Upload License Document
```typescript
POST /api/therapist/license/upload

Request:
{
  licenseType: 'MASSAGE' | 'PHYSIO',
  documentFile: File, // Austrian Berufsausweis PDF/JPG
  issuedDate: string,  // ISO date
  expiryDate?: string, // ISO date (optional for perpetual licenses)
  licenseNumber: string // Austrian license ID
}

Response:
{
  success: true,
  license: {
    id: string,
    userId: string,
    licenseType: 'MASSAGE' | 'PHYSIO',
    documentUrl: string, // S3 presigned URL
    verificationStatus: 'PENDING',
    uploadedAt: string
  }
}

Errors:
- 400: Invalid file format (must be PDF/JPG, max 10MB)
- 401: Unauthorized
- 413: File too large
```

#### Get Current License Status
```typescript
GET /api/therapist/license

Response:
{
  currentLicense: {
    licenseType: 'MASSAGE' | 'PHYSIO',
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED',
    verifiedAt?: string,
    rejectionReason?: string,
    documentUrl?: string
  },
  upgradeEligible: boolean, // true if MASSAGE and can upgrade to PHYSIO
  pendingUpgrade?: {
    targetTier: 'PHYSIO',
    status: 'PENDING_VERIFICATION',
    submittedAt: string
  }
}
```

### Subscription Management

#### Get Available Tiers
```typescript
GET /api/subscription/tiers

Response:
{
  tiers: [
    {
      id: 'MASSAGE',
      name: 'Massage Therapist',
      priceMonthly: 2900, // cents (€29.00)
      priceAnnual: 29500, // cents (€295.00, 15% discount)
      features: [
        'Client management with encryption',
        'Appointment scheduling',
        'Invoice generation (Austrian VAT compliant)',
        'Travel cost calculation',
        'Basic reporting'
      ],
      restrictions: [
        'No exercise prescription',
        'No SOAP templates',
        'Single user only'
      ],
      requiredLicense: 'MASSAGE'
    },
    {
      id: 'PHYSIO',
      name: 'Physiotherapist',
      priceMonthly: 4500,
      priceAnnual: 45900,
      features: [
        'All Massage tier features',
        'Exercise prescription library',
        'SOAP note templates',
        'Outcome measurement tools',
        'Treatment plan management'
      ],
      restrictions: [
        'Single user only'
      ],
      requiredLicense: 'PHYSIO'
    },
    {
      id: 'CLINIC',
      name: 'Multi-Practitioner Clinic',
      priceMonthly: 8900,
      priceAnnual: 90700,
      features: [
        'All Physio tier features',
        'Up to 10 team members',
        'Role-based access control',
        'Consolidated billing',
        'Multi-location support',
        'Team calendar view'
      ],
      restrictions: [],
      requiredLicense: 'MASSAGE' // Clinic owner can be massage or physio
    }
  ]
}
```

#### Initiate Tier Upgrade
```typescript
POST /api/subscription/upgrade

Request:
{
  targetTier: 'PHYSIO' | 'CLINIC',
  billingCycle: 'MONTHLY' | 'ANNUAL',
  promoCode?: string
}

Response:
{
  success: true,
  upgrade: {
    fromTier: 'MASSAGE',
    toTier: 'PHYSIO',
    proratedCharge: 1600, // cents (€16.00 for remaining days in cycle)
    effectiveDate: string, // ISO date (immediate if license verified)
    requiresVerification: boolean, // true if license not yet verified
    stripePaymentIntentId: string // For payment confirmation
  }
}

Errors:
- 400: Invalid target tier
- 403: License verification required (user must upload physio license first)
- 409: Upgrade already in progress
```

#### Downgrade Tier
```typescript
POST /api/subscription/downgrade

Request:
{
  targetTier: 'MASSAGE', // Can only downgrade to MASSAGE
  confirmDataLoss: true, // User must acknowledge exercise library will be locked
  effectiveDate: 'IMMEDIATE' | 'END_OF_CYCLE'
}

Response:
{
  success: true,
  downgrade: {
    fromTier: 'PHYSIO',
    toTier: 'MASSAGE',
    creditAmount?: number, // Prorated credit if IMMEDIATE
    effectiveDate: string,
    featuresRemoved: string[], // Exercise library, SOAP templates, etc.
  }
}

Errors:
- 400: Cannot downgrade from MASSAGE (already lowest tier)
- 409: Active team members exist (must remove before downgrading from CLINIC)
```

### Feature Access Control

#### Check Feature Access
```typescript
POST /api/features/check

Request:
{
  feature: 'EXERCISE_LIBRARY' | 'SOAP_TEMPLATES' | 'MULTI_USER' | 'OUTCOME_MEASURES'
}

Response:
{
  hasAccess: boolean,
  reason?: 'TIER_REQUIRED' | 'LICENSE_REQUIRED' | 'VERIFICATION_PENDING',
  upgradeRequired?: {
    minimumTier: 'PHYSIO',
    costDifference: 1600, // Monthly difference in cents
    upgradeUrl: '/settings/subscription/upgrade'
  }
}
```

### Admin License Verification (Platform Admin Only)

#### Get Pending Verifications
```typescript
GET /api/admin/licenses/pending

Response:
{
  pendingLicenses: [
    {
      id: string,
      userId: string,
      userEmail: string,
      licenseType: 'PHYSIO',
      documentUrl: string, // S3 presigned URL
      uploadedAt: string,
      licenseNumber: string,
      issuedDate: string,
      expiryDate?: string
    }
  ]
}
```

#### Approve/Reject License
```typescript
POST /api/admin/licenses/:id/verify

Request:
{
  decision: 'APPROVE' | 'REJECT',
  rejectionReason?: string, // Required if REJECT
  notes?: string
}

Response:
{
  success: true,
  license: {
    id: string,
    verificationStatus: 'VERIFIED' | 'REJECTED',
    verifiedAt: string,
    verifiedBy: string, // Admin user ID
  },
  userNotified: boolean // Email sent to user
}
```

## Webhooks

### Stripe Subscription Events

#### customer.subscription.created
```typescript
{
  type: 'customer.subscription.created',
  data: {
    object: {
      id: string,
      customer: string,
      items: {
        data: [{
          price: {
            id: string, // Maps to tier (price_massage_monthly, etc.)
          }
        }]
      },
      status: 'active',
      current_period_end: number // Unix timestamp
    }
  }
}

Action:
- Create Subscription record in database
- Set user tier based on price ID
- Send welcome email with tier-specific onboarding
```

#### customer.subscription.updated
```typescript
Action:
- Update Subscription status
- Handle tier changes (upgrade/downgrade)
- Update feature access flags
- Send confirmation email
```

#### customer.subscription.deleted
```typescript
Action:
- Mark subscription as CANCELED
- Downgrade user to free tier (if implemented)
- Lock access to paid features
- Send cancellation confirmation email
```

## Rate Limiting

All API endpoints use token bucket rate limiting:

- **Authenticated users:** 100 requests/minute
- **Admin endpoints:** 1000 requests/minute
- **Webhook endpoints:** No limit (authenticated via Stripe signature)

## Authentication

All endpoints require:
- **Session cookie** (NextAuth.js session)
- **Admin endpoints** additionally require `user.role === 'ADMIN'`
- **Webhook endpoints** require valid Stripe signature header

## Error Response Format

```typescript
{
  error: {
    code: 'TIER_UPGRADE_REQUIRED',
    message: 'Exercise prescription requires Physiotherapist tier',
    details?: {
      currentTier: 'MASSAGE',
      requiredTier: 'PHYSIO',
      upgradeUrl: '/settings/subscription/upgrade'
    }
  }
}
```

## Versioning

API version included in URL path: `/api/v1/...`

Breaking changes will increment version. Current endpoints are v1 (implicit).
