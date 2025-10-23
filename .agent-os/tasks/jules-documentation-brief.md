# 📚 Jules Documentation Task Brief

**Assigned to:** Jules (Google AI Studio Agent)
**Priority:** LOW (Non-blocking, parallel work)
**Deadline:** 5-7 days (before grant interview - October 30, 2025)
**Branch:** `docs/user-help-center` (create new branch)

---

## 🎯 MISSION OBJECTIVE

Create comprehensive, factually accurate user documentation for MyoFlow based on the **actual implemented MVP features**. This documentation will be used during the grant interview demo to show completeness and professionalism.

**Critical Rule:** Only document features that **actually exist** in the codebase. Do NOT invent features, UI elements, or workflows that aren't implemented.

---

## ✅ VERIFIED MVP FEATURES (October 2025)

These features are **confirmed implemented** in the codebase:

### 🔐 Authentication & Onboarding
- ✅ **Sign Up / Sign In** - Credentials (email/password) + Google OAuth
- ✅ **Onboarding Wizard** - 3-step setup flow (Business Info → Professional Details → Completion)
- ✅ **Profile Completion** - Tracks 12 fields, shows % complete widget on dashboard
- ✅ **Bilingual UI** - Language toggle (EN/DE) on all pages

### 👥 Client Management
- ✅ **Client CRUD** - Create, view, edit, delete clients
- ✅ **Required Fields** - Name, email, phone, **full mailing address** (street, postal, city, country)
- ✅ **Field-Level Encryption** - Health flags and medical notes (libsodium)
- ✅ **Client Notes** - Add timestamped notes to client records
- ✅ **Client List** - Searchable, sortable table with all clients

### 📅 Appointment Scheduling
- ✅ **Calendar View** - Full calendar with appointments
- ✅ **Create Appointments** - Link to client, select service, date/time, location
- ✅ **Status Tracking** - BOOKED → COMPLETED → PAID workflow
- ✅ **Multi-Location Support** - Select from therapist's locations
- ✅ **Conflict Detection** - Warns about double-bookings
- ✅ **Travel Buffers** - Automatic time buffers between different locations
- ✅ **Austrian Holidays** - Calendar respects Austrian public holidays

### 💰 Invoice Generation
- ✅ **Create Invoices** - Select client, service date, line items
- ✅ **Date Picker** - Professional date picker with max date = today (no future dates)
- ✅ **Sequential Numbering** - Austrian format YYYY-NNN (e.g., 2025-001)
- ✅ **VAT Support** - Kleinunternehmer, 10%, 13%, 20% VAT rates
- ✅ **PDF Download** - Generate Austrian-compliant PDF invoices
- ✅ **Invoice List** - View all invoices with status, client, amount

### ⚙️ Settings
- ✅ **Profile Settings** - Business name, address, email, phone, UID number, IBAN
- ✅ **Tax Compliance** - Toggle Kleinunternehmer vs VAT, threshold tracking
- ✅ **Invoice Branding** - Logo upload, thank-you message
- ✅ **System Preferences** - Language (EN/DE), timezone, currency, notification toggles
- ✅ **Travel Settings** - Base location, transport method, rates, distance limits
- ✅ **Pricing Templates** - Service rate templates (CRUD)

### 📊 Dashboard
- ✅ **Profile Completion Widget** - Shows % complete, links to settings
- ✅ **Welcome Message** - Personalized greeting
- ✅ **Quick Navigation** - Tiles for Clients, Appointments, Invoices

---

## 🇦🇹 AUSTRIAN COMPLIANCE FACTS

### Verified Tax Regulations

**Kleinunternehmer (Small Business Exemption)**
- **Threshold:** €55,000 annual gross revenue (as of 2024)
- **Legal Basis:** §6 Abs. 1 Z 27 UStG (Austrian VAT Act)
- **Requirements:**
  - Invoice must state: "Umsatzsteuerfrei gemäß §6 Abs. 1 Z 27 UStG"
  - No VAT collection or reporting
  - Automatically loses status if revenue exceeds threshold
- **MyoFlow Implementation:** Tracked via `kleinunternehmer` boolean + `annualGrossCents` field

**VAT Rates (Umsatzsteuer)**
- **10%** - Basic services (most therapy services)
- **13%** - Cultural services, specific medical services
- **20%** - Standard rate (products, consulting)
- **Legal Basis:** UStG §10
- **MyoFlow Implementation:** `VatStatus` enum with UST_10, UST_13, UST_20

**Therapist Classifications**
MyoFlow supports three official Austrian massage therapy designations:
1. **HEILMASSEUR** - Medical masseur (healthcare provider)
2. **MEDIZINISCHER_MASSEUR** - Medical massage therapist
3. **GEWERBLICHER_MASSEUR** - Commercial masseur

**RKSV (Registrierkassenpflicht) - Cash Register Obligation**
- **Threshold:** €15,000 annual revenue (NOT €17,500)
- **Requirement:** Electronic receipt system (Belegerteilungspflicht)
- **Status:** MyoFlow has schema support but **NOT fully implemented**
- **Don't document as fully functional** - mark as "Coming Soon"

---

## 📋 DOCUMENTATION TO CREATE

### 1. User Guide (`docs/user-guide/`)

Create these **6 markdown files** based on actual features:

#### `01-getting-started.md`
**Content:**
- System requirements (browsers, recommended: Chrome/Firefox)
- Sign-up process (email/password or Google OAuth)
- Onboarding wizard walkthrough (3 steps)
- Dashboard overview
- Language switching (EN ↔ DE)

**Screenshot Placeholders:**
- `[Screenshot: Sign-in page]`
- `[Screenshot: Onboarding wizard - Step 1]`
- `[Screenshot: Dashboard with profile completion widget]`

---

#### `02-client-management.md`
**Content:**
- Creating a new client (required fields: name, email, phone, address)
- Viewing client profile
- Editing client information
- Adding client notes
- Deleting clients (with confirmation dialog)
- Security note: encrypted health data

**Screenshot Placeholders:**
- `[Screenshot: Client list table]`
- `[Screenshot: New client form with address fields]`
- `[Screenshot: Client profile view]`

---

#### `03-appointment-scheduling.md`
**Content:**
- Calendar navigation
- Creating appointments (client, service, date/time, location)
- Appointment statuses (BOOKED, COMPLETED, PAID)
- Multi-location appointments
- Travel buffers (automatic time gaps between locations)
- Conflict warnings
- Austrian holiday calendar

**Screenshot Placeholders:**
- `[Screenshot: Calendar view with appointments]`
- `[Screenshot: New appointment modal]`
- `[Screenshot: Appointment detail view]`

---

#### `04-invoice-creation.md`
**Content:**
- Creating invoices (select client, service date with date picker)
- Adding invoice line items (description, quantity, unit price, VAT rate)
- Service date picker (blocks future dates)
- VAT rate selection (Kleinunternehmer, 10%, 13%, 20%)
- Sequential invoice numbering (YYYY-NNN format)
- Downloading PDF invoices
- Viewing invoice history

**Important Notes:**
- **Date validation:** Service date cannot be in the future
- **Invoice numbering:** Automatic sequential numbering per year
- **PDF generation:** Professional Austrian-compliant format

**Screenshot Placeholders:**
- `[Screenshot: New invoice form with date picker]`
- `[Screenshot: Invoice line items table]`
- `[Screenshot: Generated PDF invoice]`

---

#### `05-settings-configuration.md`
**Content:**
- Profile tab: Business info, UID number, IBAN
- Tax Compliance tab: Kleinunternehmer toggle, threshold tracking
- Invoice Branding tab: Logo upload, thank-you message
- System Preferences: Language, timezone, currency
- Travel Settings: Base location, transport method, rates
- Pricing Templates: Service rate management

**Screenshot Placeholders:**
- `[Screenshot: Settings page with tabs]`
- `[Screenshot: Profile settings form]`
- `[Screenshot: Tax compliance widget]`

---

#### `06-troubleshooting.md`
**Content:**
- **Login Issues**
  - "Sign in button is disabled" → Fill email and password, wait for validation
  - Password requirements: 8+ chars, uppercase, lowercase, number
  - Google OAuth troubleshooting

- **Invoice Date Picker**
  - "Why can't I select future dates?" → Austrian compliance requires service dates ≤ today
  - Date format differences (EN: MM/DD/YYYY, DE: DD.MM.YYYY)

- **Client Address Validation**
  - Austrian postal codes: 1000-9999 (all regions)
  - Required fields: street, postal code, city, country

- **Profile Completion**
  - "Profile shows 0% but I filled fields" → Check Settings → Profile tab for missing fields
  - Required fields for 100%: business name, address, designation, VAT status, etc.

---

### 2. Austrian Compliance Guide (`docs/compliance/austrian-tax-guide.md`)

**Content Structure:**

#### Kleinunternehmer (Small Business Exemption)
- **What it is:** Exemption from VAT collection for small businesses
- **Eligibility:** Annual revenue < €55,000
- **Legal basis:** §6 Abs. 1 Z 27 UStG
- **How it works in MyoFlow:**
  - Toggle in Settings → Tax Compliance
  - Automatic threshold tracking
  - Invoice text: "Umsatzsteuerfrei gemäß §6 Abs. 1 Z 27 UStG"
- **When to switch:** If approaching €55k threshold or expect higher revenue

#### VAT Rates (Umsatzsteuer)
- **10%** - Most therapy services (massage, physiotherapy)
- **13%** - Cultural/educational services
- **20%** - Products, consulting, standard services
- **How to select:** Choose rate when creating invoice line items
- **Invoice requirements:** Must show VAT separately on invoices

#### RKSV (Cash Register Obligation)
- **Threshold:** €15,000 annual revenue
- **Requirement:** Electronic receipt system
- **Status in MyoFlow:** ⚠️ Coming Soon - schema prepared, not yet implemented
- **Recommendation:** Consult tax advisor when approaching threshold

#### Professional Designations
- **HEILMASSEUR:** Medical masseur (Gesundheitsberufe)
- **MEDIZINISCHER_MASSEUR:** Medical massage therapist
- **GEWERBLICHER_MASSEUR:** Commercial masseur (Gewerbeordnung)
- **Importance:** Affects tax treatment and insurance billing

#### Recommended Resources
- WKO (Wirtschaftskammer Österreich): https://wko.at
- UID number registration: https://www.bmf.gv.at
- Austrian tax advisor search: https://www.ksw.or.at

---

### 3. FAQ (`docs/faq.md`)

Create 20-25 FAQs based on actual features:

**Account & Setup**
- Q: "How do I sign up?" A: Email/password or Google OAuth
- Q: "What languages are supported?" A: German (Austria) and English
- Q: "Can I change my language?" A: Yes, toggle in top-right corner of any page

**Clients**
- Q: "Why do I need client addresses?" A: Required for Austrian invoice compliance
- Q: "How is client data secured?" A: Field-level encryption with libsodium
- Q: "Can I delete a client?" A: Yes, with confirmation dialog

**Invoices**
- Q: "Why can't I select future service dates?" A: Austrian compliance - invoices must be for past services
- Q: "What invoice numbering format does MyoFlow use?" A: YYYY-NNN (e.g., 2025-001)
- Q: "How do I download invoice PDFs?" A: Click Download button on invoice detail page

**Tax & Compliance**
- Q: "What is Kleinunternehmer?" A: Small business VAT exemption (< €55k annual revenue)
- Q: "When should I use VAT rates?" A: When annual revenue > €55k or voluntarily opted in
- Q: "What's the difference between 10%, 13%, and 20% VAT?" A: Service/product type (see tax guide)

**Settings**
- Q: "Where do I add my business logo?" A: Settings → Invoice Branding → Upload Logo
- Q: "How do I set up travel rates?" A: Settings → Travel → Configure base location and rates
- Q: "What does profile completion mean?" A: Percentage of required business info fields filled

---

## 🚨 WHAT NOT TO DOCUMENT

These features are **NOT implemented** - do NOT include them:

❌ Multi-tenancy (single therapist only)
❌ ÖGK insurance integration
❌ Automated appointment reminders (schema exists, not wired up)
❌ SMS notifications (Vonage integration not active)
❌ Public mini-sites (`/s/[slug]` - not MVP)
❌ Product sales/e-commerce
❌ Affiliate program
❌ Stripe payment integration (schema exists, not active)
❌ Export configurations (schema exists, not implemented)
❌ Client intake forms (HMAC tokens not in UI)
❌ 2FA/TOTP (scaffolding only)
❌ GDPR data export tools
❌ RKSV compliance tracking (partial implementation only)

---

## 📐 DOCUMENTATION STANDARDS

### Writing Style
- **Tone:** Professional, helpful, clear
- **Audience:** Austrian therapists with basic computer skills
- **Language:** Simple, jargon-free (explain technical terms)
- **Format:** Short paragraphs, bullet points, numbered steps

### Bilingual Requirements
- **Primary language:** German (Austria) - use formal "Sie" form
- **Secondary language:** English (US/UK)
- **Create both versions** for all documents:
  - `docs/user-guide/de/01-getting-started.md`
  - `docs/user-guide/en/01-getting-started.md`

### Screenshot Placeholders
Use this format:
```markdown
[Screenshot: Brief description of what the screenshot should show]
```

Example:
```markdown
[Screenshot: Client list showing table with name, email, phone columns and "New Client" button]
```

### Technical Accuracy
- ✅ **DO:** Describe actual UI elements, buttons, forms
- ✅ **DO:** Reference real field names and labels
- ✅ **DO:** Show actual error messages from the code
- ❌ **DON'T:** Invent features that don't exist
- ❌ **DON'T:** Describe imaginary UI workflows
- ❌ **DON'T:** Promise features marked as "Coming Soon" in roadmap

---

## 📂 FILE STRUCTURE

Create this structure:

```
docs/
├── user-guide/
│   ├── en/
│   │   ├── 01-getting-started.md
│   │   ├── 02-client-management.md
│   │   ├── 03-appointment-scheduling.md
│   │   ├── 04-invoice-creation.md
│   │   ├── 05-settings-configuration.md
│   │   └── 06-troubleshooting.md
│   └── de/
│       ├── 01-erste-schritte.md
│       ├── 02-klienten-verwaltung.md
│       ├── 03-termin-planung.md
│       ├── 04-rechnung-erstellen.md
│       ├── 05-einstellungen.md
│       └── 06-fehlersuche.md
├── compliance/
│   ├── en/
│   │   └── austrian-tax-guide.md
│   └── de/
│       └── oesterreichische-steuer-leitfaden.md
└── faq/
    ├── en/
    │   └── faq.md
    └── de/
        └── haeufige-fragen.md
```

---

## ✅ ACCEPTANCE CRITERIA

Documentation is complete when:

1. ✅ All 6 user guide chapters created (EN + DE versions)
2. ✅ Austrian tax guide created (EN + DE versions)
3. ✅ FAQ with 20+ questions created (EN + DE versions)
4. ✅ All content is factually accurate (based on actual codebase features)
5. ✅ All Austrian tax regulations verified and cited correctly
6. ✅ Screenshot placeholders included for all key UI elements
7. ✅ Bilingual versions use appropriate formal language (German: "Sie")
8. ✅ No invented features or workflows
9. ✅ Clear, professional writing suitable for grant interview demo

---

## 🔍 VERIFICATION CHECKLIST

Before submitting, verify:

- [ ] Cross-referenced schema.prisma for feature accuracy
- [ ] Checked CLAUDE.md for recent UI changes
- [ ] Verified Austrian tax thresholds (€55k Kleinunternehmer, €15k RKSV)
- [ ] Confirmed therapist designations (HEILMASSEUR, MEDIZINISCHER_MASSEUR, GEWERBLICHER_MASSEUR)
- [ ] VAT rates accurate (10%, 13%, 20%)
- [ ] No documentation of unimplemented features
- [ ] All legal citations correct (§6 UStG, etc.)
- [ ] German translations use formal "Sie" form
- [ ] English translations are natural, professional

---

## 🎯 SUCCESS METRICS

**Impact on Grant Interview:**
- ✅ Shows professionalism and completeness
- ✅ Demonstrates user-focused approach
- ✅ Proves understanding of Austrian compliance
- ✅ Provides reference material during demo
- ✅ Supports "production-ready" narrative

**Timeline:**
- Start: Immediately (parallel to Codex's core workflow tasks)
- Target Completion: October 28, 2025 (2 days before grant interview)
- Review: October 29, 2025 (Claude final review)

---

## 📞 COORDINATION

**Reporting:**
- Update COORDINATION.md with progress every 2 chapters
- Flag any unclear features or missing information to Claude
- Submit PR when complete for Claude review

**Branch Strategy:**
```bash
git checkout -b docs/user-help-center
# ... create documentation ...
git add docs/
git commit -m "docs: create comprehensive user documentation suite"
git push origin docs/user-help-center
```

---

**Jules, you are CLEARED to begin documentation creation.** 📝

Focus on accuracy, clarity, and bilingual quality. When in doubt about a feature, check the schema or ask Claude. Good luck! 🚀
