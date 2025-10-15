# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-10-06-tier-based-expansion-strategy/spec.md

> Created: 2025-10-06
> Status: Strategic Planning Only (Not for Implementation)
> Scope: Documentation, market research, pricing validation

---

## ⚠️ IMPORTANT NOTE

This spec is **strategic planning only** - NOT for immediate implementation. The tier-based expansion is a **future roadmap item** after MVP validation. Current focus remains on **Sprint 4: Settings Completion**.

---

## Phase 1: Market Research & Validation (4 weeks)

### Task 1.1: Competitor Analysis Deep Dive
- **Priority:** High
- **Estimate:** 1 week
- **Owner:** TBD (Product/Business role)

**Subtasks:**
- [ ] Document Offisy's complete pricing structure (including hidden costs)
- [ ] Analyze feature gaps between MyoFlow MVP and Offisy
- [ ] Research other Austrian therapy management platforms (if any)
- [ ] Interview 10 current Offisy users about pain points
- [ ] Identify Offisy's weaknesses (feature bloat, pricing confusion)
- [ ] Document MyoFlow's competitive advantages

**Acceptance Criteria:**
- Comprehensive competitor analysis document
- List of 10+ validated pain points from real users
- Pricing comparison table (MyoFlow vs. Offisy vs. alternatives)

---

### Task 1.2: Target User Interviews
- **Priority:** Critical
- **Estimate:** 2 weeks
- **Owner:** TBD (Product/UX role)

**Subtasks:**
- [ ] Recruit 20 interview participants (10 massage, 5 physio, 5 clinic owners)
- [ ] Conduct structured interviews about tier-based pricing
- [ ] Validate willingness to pay (€29/€45/€89 price points)
- [ ] Test messaging: "Upgrade when you upgrade your license"
- [ ] Identify must-have vs. nice-to-have features per tier
- [ ] Document objections and concerns about tiered model

**Acceptance Criteria:**
- 20 completed interview transcripts
- Pricing validation report (accept/reject each tier price point)
- Feature prioritization matrix per tier
- List of common objections with mitigation strategies

---

### Task 1.3: Legal Compliance Verification
- **Priority:** Critical
- **Estimate:** 1 week
- **Owner:** TBD (Legal/Compliance consultant)

**Subtasks:**
- [ ] Verify Austrian MMHmG 2003 restrictions on exercise prescription
- [ ] Confirm massage therapists CANNOT prescribe exercises legally
- [ ] Document physiotherapist licensing requirements in Austria
- [ ] Research automated license verification options (Federal Health Registry API)
- [ ] Identify legal risks of feature-gating by license type
- [ ] Confirm GDPR compliance for license document storage

**Acceptance Criteria:**
- Legal opinion document from Austrian healthcare law expert
- Documentation of MMHmG 2003 exercise prescription rules
- Risk assessment report for tier-based feature gating
- GDPR compliance checklist for license uploads

---

## Phase 2: Product Strategy Documentation (2 weeks)

### Task 2.1: Feature Mapping & Tier Assignment
- **Priority:** High
- **Estimate:** 1 week
- **Owner:** Product Manager

**Subtasks:**
- [ ] List all current MyoFlow features
- [ ] Assign each feature to a tier (Massage/Physio/Clinic)
- [ ] Document rationale for each assignment (legal/value-based)
- [ ] Create feature comparison table for pricing page
- [ ] Design "locked feature" UI/UX (with upgrade CTA)
- [ ] Plan exercise library content (500+ exercises for Physio tier)

**Acceptance Criteria:**
- Complete feature-to-tier mapping spreadsheet
- Visual comparison table for pricing page
- Locked feature mockups (Figma/wireframes)
- Exercise library content plan (categories, descriptions, images)

---

### Task 2.2: Upgrade Flow Design
- **Priority:** High
- **Estimate:** 3 days
- **Owner:** UX Designer

**Subtasks:**
- [ ] Design license upload flow (document verification UI)
- [ ] Create upgrade modal with pricing comparison
- [ ] Design tier badge display in sidebar
- [ ] Mockup admin license verification interface
- [ ] Design prorated payment confirmation screen
- [ ] Create email templates (verification pending, approved, rejected)

**Acceptance Criteria:**
- Complete Figma mockups for upgrade flow
- User journey map (Massage → Physio upgrade)
- Admin verification workflow documented
- Email templates drafted (German + English)

---

### Task 2.3: Pricing Page Content
- **Priority:** Medium
- **Estimate:** 2 days
- **Owner:** Marketing/Content Writer

**Subtasks:**
- [ ] Write pricing page copy highlighting Offisy cost comparison
- [ ] Create tier benefit descriptions (features + restrictions)
- [ ] Draft FAQ section (upgrade process, license requirements, refunds)
- [ ] Write promotional launch pricing announcement
- [ ] Create referral program terms & conditions
- [ ] Draft case study: "How upgrading your license unlocks new revenue"

**Acceptance Criteria:**
- Complete pricing page copy (German + English)
- FAQ document with 20+ common questions
- Launch promotion messaging
- Referral program documentation

---

## Phase 3: Technical Planning (3 weeks)

### Task 3.1: Database Schema Design
- **Priority:** Critical
- **Estimate:** 1 week
- **Owner:** Backend Engineer

**Subtasks:**
- [ ] Design User.licenseType enum (MASSAGE/PHYSIO/ADMIN)
- [ ] Design Subscription.tier enum (MASSAGE/PHYSIO/CLINIC)
- [ ] Create VerificationStatus enum (PENDING/VERIFIED/REJECTED)
- [ ] Plan LicenseDocument table (S3 URLs, verification metadata)
- [ ] Design TeamMember table (for Clinic tier multi-user)
- [ ] Create migration strategy (existing users default to MASSAGE tier)

**Acceptance Criteria:**
- Complete Prisma schema additions
- Migration scripts with rollback capability
- Data migration plan for existing users
- Database diagram showing new relationships

**Reference:**
See `.agent-os/specs/2025-10-06-tier-based-expansion-strategy/sub-specs/database-schema.md`

---

### Task 3.2: API Endpoint Specification
- **Priority:** High
- **Estimate:** 1 week
- **Owner:** Backend Engineer

**Subtasks:**
- [ ] Design /api/therapist/license/upload endpoint
- [ ] Design /api/subscription/tiers endpoint
- [ ] Design /api/subscription/upgrade endpoint
- [ ] Design /api/subscription/downgrade endpoint
- [ ] Design /api/features/check middleware
- [ ] Design /api/admin/licenses/* endpoints (verification)

**Acceptance Criteria:**
- Complete OpenAPI/Swagger spec
- Request/response examples for each endpoint
- Error code documentation
- Rate limiting strategy

**Reference:**
See `.agent-os/specs/2025-10-06-tier-based-expansion-strategy/sub-specs/api-spec.md`

---

### Task 3.3: Stripe Integration Planning
- **Priority:** Critical
- **Estimate:** 1 week
- **Owner:** Backend Engineer

**Subtasks:**
- [ ] Create Stripe price IDs (6 total: 3 tiers × 2 billing cycles)
- [ ] Design webhook handling (subscription.created/updated/deleted)
- [ ] Plan prorated upgrade calculation logic
- [ ] Design subscription status sync (Stripe → database)
- [ ] Create test mode pricing for development
- [ ] Document refund policy and implementation

**Acceptance Criteria:**
- Stripe price IDs created (test + production)
- Webhook handler design document
- Prorated billing calculation examples
- Test plan for subscription lifecycle

---

## Phase 4: Security & Compliance (2 weeks)

### Task 4.1: License Document Security
- **Priority:** Critical
- **Estimate:** 1 week
- **Owner:** Security Engineer

**Subtasks:**
- [ ] Design S3 bucket structure for license documents (encrypted at rest)
- [ ] Implement presigned URL generation (admin access only)
- [ ] Add virus scanning for uploaded documents (ClamAV integration)
- [ ] Create audit log for license verification actions
- [ ] Design GDPR-compliant deletion workflow (user requests data removal)
- [ ] Implement document retention policy (delete after 7 years)

**Acceptance Criteria:**
- S3 bucket configured with encryption
- Virus scanning tested with malware samples
- Audit log tracks all license changes
- GDPR deletion workflow documented

---

### Task 4.2: Feature Access Control
- **Priority:** High
- **Estimate:** 3 days
- **Owner:** Backend Engineer

**Subtasks:**
- [ ] Implement middleware checking user.licenseType
- [ ] Create feature flag system (exercise library, SOAP, multi-user)
- [ ] Design error responses for unauthorized feature access
- [ ] Implement session caching (avoid DB lookup on every request)
- [ ] Create unit tests for access control logic
- [ ] Document feature-to-tier mapping in code comments

**Acceptance Criteria:**
- Feature access middleware implemented
- Tests cover all tier/feature combinations
- Clear error messages for locked features
- Performance optimization (session caching)

---

## Phase 5: Testing & Validation (2 weeks)

### Task 5.1: Beta Testing Program
- **Priority:** High
- **Estimate:** 2 weeks
- **Owner:** Product Manager

**Subtasks:**
- [ ] Recruit 10 beta testers (5 massage, 5 physio)
- [ ] Set up staging environment with tier system
- [ ] Provide test credit cards for subscription testing
- [ ] Collect feedback on upgrade flow (ease of use, clarity)
- [ ] Test license upload and verification workflow
- [ ] Measure time to first value (signup → tier activation)

**Acceptance Criteria:**
- 10 completed beta test sessions
- Feedback report with usability scores
- Bug list prioritized by severity
- Average time to upgrade documented

---

### Task 5.2: Pricing A/B Test
- **Priority:** Medium
- **Estimate:** 1 week (ongoing monitoring)
- **Owner:** Marketing

**Subtasks:**
- [ ] Set up A/B test: €29/€45/€89 vs. €27/€42/€85 pricing
- [ ] Design landing pages for each variant
- [ ] Run Facebook/Google ads targeting Upper Austrian therapists
- [ ] Measure conversion rate (landing page view → sign up)
- [ ] Analyze price sensitivity by tier
- [ ] Document optimal pricing based on test results

**Acceptance Criteria:**
- 500+ landing page views per variant
- Statistical significance achieved (p < 0.05)
- Conversion rate report per pricing variant
- Final pricing recommendation

---

## Phase 6: Go-to-Market Planning (3 weeks)

### Task 6.1: Launch Marketing Campaign
- **Priority:** High
- **Estimate:** 2 weeks
- **Owner:** Marketing Manager

**Subtasks:**
- [ ] Create launch announcement (press release + blog post)
- [ ] Design social media campaign (LinkedIn, Facebook groups)
- [ ] Reach out to Austrian massage/physio associations for partnership
- [ ] Create promotional video (tier benefits + upgrade demo)
- [ ] Set up email drip campaign for free trial users
- [ ] Plan webinar: "How tiered pricing saves Austrian therapists money"

**Acceptance Criteria:**
- Launch materials ready (press release, social posts, video)
- Partnership agreements with 2+ professional associations
- Email campaign scheduled in ActiveCampaign/Mailchimp
- Webinar registration page live

---

### Task 6.2: Customer Support Preparation
- **Priority:** Medium
- **Estimate:** 1 week
- **Owner:** Support Lead

**Subtasks:**
- [ ] Train support team on tier system (features, restrictions, upgrades)
- [ ] Create support documentation (license verification, tier changes)
- [ ] Write canned responses for common questions (upgrade process, refunds)
- [ ] Set up Intercom/Zendesk tags (tier-related inquiries)
- [ ] Create escalation path for license verification issues
- [ ] Plan live chat coverage for launch week (extended hours)

**Acceptance Criteria:**
- Support team trained (quiz scores > 90%)
- Documentation published in help center
- Canned responses created (20+ templates)
- Launch week support schedule confirmed

---

## Phase 7: Post-Launch Monitoring (Ongoing)

### Task 7.1: Metrics Dashboard
- **Priority:** High
- **Estimate:** 3 days
- **Owner:** Data Analyst

**Subtasks:**
- [ ] Track tier distribution (% of users per tier)
- [ ] Monitor upgrade conversion rate (Massage → Physio)
- [ ] Measure license verification approval rate (% approved vs. rejected)
- [ ] Track feature adoption per tier (exercise library usage, SOAP templates)
- [ ] Monitor churn rate by tier
- [ ] Create executive dashboard (MRR, ARR, tier breakdown)

**Acceptance Criteria:**
- Real-time dashboard in Metabase/Looker
- Daily email report with key metrics
- Alerts for anomalies (spike in churn, low upgrade rate)

---

### Task 7.2: Iteration Based on Data
- **Priority:** Medium
- **Estimate:** Ongoing
- **Owner:** Product Manager

**Subtasks:**
- [ ] Review user feedback monthly (tier satisfaction, feature requests)
- [ ] Adjust pricing if conversion rate < 5%
- [ ] Add new features to Physio tier based on demand
- [ ] Optimize upgrade flow if completion rate < 80%
- [ ] Test new messaging (A/B test upgrade CTAs)
- [ ] Plan next tier addition (Clinic → Enterprise)

**Acceptance Criteria:**
- Monthly product review meetings
- Quarterly pricing review
- Feature roadmap updated based on tier-specific requests

---

## Summary Timeline

**Total Duration:** 16 weeks (4 months)

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Market Research & Validation | 4 weeks | None |
| 2. Product Strategy Documentation | 2 weeks | Phase 1 complete |
| 3. Technical Planning | 3 weeks | Phase 1 complete |
| 4. Security & Compliance | 2 weeks | Phase 3 complete |
| 5. Testing & Validation | 2 weeks | Phases 3-4 complete |
| 6. Go-to-Market Planning | 3 weeks | Phase 5 complete |
| 7. Post-Launch Monitoring | Ongoing | Phase 6 complete |

**Estimated Total Effort:** 320 hours (~2 FTE for 4 months)

---

## Out of Scope (Future Considerations)

- Hairdresser/cosmetician module development
- International expansion (Germany, Switzerland)
- Enterprise tier (10+ users)
- White-label offering
- API reseller partnerships

---

## Success Metrics (12 Months Post-Launch)

- **Adoption:** 10% market penetration in Upper Austria
- **Tier Distribution:** 60% Massage, 30% Physio, 10% Clinic
- **Upgrade Rate:** 15% of Massage users upgrade to Physio within 12 months
- **Churn:** < 5% monthly churn (annual: < 60%)
- **Revenue:** €50k ARR (Year 1 conservative target)

---

**Next Steps:**
1. Validate this spec with stakeholders
2. Assign owners to Phase 1 tasks
3. Secure budget for market research (interviews, legal consultation)
4. Schedule kickoff meeting for Q1 2026 (after MVP launch stabilizes)

**REMINDER:** This is NOT for immediate implementation. Focus remains on Sprint 4 (Settings Completion) and Sprint 5-7 (MVP hardening).
