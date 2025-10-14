# Spec Requirements Document

> Spec: MyoFlow Tier-Based Expansion Strategy
> Created: 2025-10-06

## Overview

Transform MyoFlow from a single-tier massage therapy platform into a modular, license-based SaaS serving Austrian massage therapists and physiotherapists with profession-specific features and one-click upgrade paths. This strategic repositioning addresses Offisy's feature bloat weakness while maintaining legal compliance with Austrian MMHmG 2003 regulations and enabling vertical market expansion through a tier system (€29/€45/€89 monthly pricing).

## User Stories

### Massage Therapist Career Progression

As a massage therapist completing physiotherapy qualifications, I want to upgrade my MyoFlow account with one click, so that I can immediately access exercise prescription features without data migration or service interruption.

**Workflow:** User completes physiotherapy certification → uploads license document in MyoFlow settings → system verifies credential → user clicks "Upgrade to Physio Tier" → exercise library, SOAP templates, and outcome measurement tools unlock instantly while preserving all existing client data and appointment history.

### Practice Owner Cost Transparency

As a therapy practice owner evaluating practice management software, I want clear all-inclusive pricing with no hidden annual fees, so that I can accurately budget operational costs and avoid Offisy's €75 compliance surcharges and mandatory annual service fees.

**Workflow:** User visits pricing page → sees transparent monthly rates (€29/€45/€89) → compares against Offisy's €423.70/year actual cost → understands exact monthly expense including ELGA integration, GDPR compliance, and RKSV cash register → makes informed purchase decision without surprise charges.

### Multi-Location Clinic Management

As a clinic owner with multiple therapists (both massage and physio), I want team coordination tools with role-based access, so that I can manage schedules, client handoffs, and billing across locations while maintaining individual practitioner compliance.

**Workflow:** Clinic owner subscribes to Tier 3 (€89/mo) → invites team members with specific licenses (massage/physio) → each team member sees only features permitted by their qualification → owner views consolidated calendar, revenue dashboard, and compliance status across all practitioners.

## Spec Scope

1. **License-Based Tier System** - Three pricing tiers (Massage €29/mo, Physio €45/mo, Clinic €89/mo) with feature access controlled by verified professional license type
2. **One-Click Upgrade Path** - Seamless tier migration when massage therapist completes physiotherapy qualification, preserving all data and unlocking restricted features
3. **Legal Compliance Architecture** - Exercise prescription, SOAP templates, and outcome measurement tools locked to physiotherapist tier only (per Austrian MMHmG 2003)
4. **All-Inclusive Pricing Model** - Monthly rates include ELGA integration (€1-2/user), infrastructure (€4-5/user), support (€2-3/user) with no hidden annual fees
5. **Modular Platform Foundation** - Technical architecture enabling future vertical expansion (e.g., hairdresser module) while maintaining profession-specific feature isolation

## Out of Scope

- Implementation of actual code/database changes (this is strategic planning only)
- Hairdresser, cosmetician, or doctor modules (future roadmap post-therapy validation)
- International markets outside Austria (focus on Upper Austria / Oberösterreich initially)
- Enterprise features beyond 10-practitioner clinics (Tier 3 serves up to 10 users)
- White-label or API reseller partnerships (direct B2B only for MVP phase)

## Expected Deliverable

1. **Complete Strategic Plan Documentation** - Tier structure, pricing rationale with cost breakdown, legal compliance requirements, competitive positioning vs Offisy, and 12-month GTM roadmap captured in spec files
2. **Updated Product Mission** - mission-lite.md revised to reflect modular tier-based strategy instead of single-tier massage therapist focus
3. **Technical Architecture Blueprint** - Feature flagging system design, license verification workflow, and database schema requirements for tier enforcement documented in sub-specs
