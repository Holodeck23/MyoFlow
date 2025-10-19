# Database Schema: Invoice PDF Austrian Compliance

## Required Schema Extensions

### Therapist Profile Extensions

```sql
-- Add Austrian compliance fields to existing Therapist model
ALTER TABLE "Therapist" ADD COLUMN "kleinunternehmer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Therapist" ADD COLUMN "vatNumber" TEXT; -- UID number for VAT-registered
ALTER TABLE "Therapist" ADD COLUMN "businessName" TEXT; -- Official business name
ALTER TABLE "Therapist" ADD COLUMN "businessAddress" TEXT; -- Full address for invoices
ALTER TABLE "Therapist" ADD COLUMN "businessPhone" TEXT; -- Contact phone
ALTER TABLE "Therapist" ADD COLUMN "businessEmail" TEXT; -- Business email for invoices

-- Annual tracking for RKSV thresholds (future feature)
ALTER TABLE "Therapist" ADD COLUMN "annualGrossCentsYtd" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Therapist" ADD COLUMN "cashGrossCentsYtd" INTEGER NOT NULL DEFAULT 0;
```

### Invoice Model Enhancements

```sql
-- Extend existing Invoice model for Austrian compliance
ALTER TABLE "Invoice" ADD COLUMN "performanceDate" TIMESTAMP; -- Leistungsdatum
ALTER TABLE "Invoice" ADD COLUMN "vatRate" INTEGER; -- 0, 10, 13, 20 (null if KU)
ALTER TABLE "Invoice" ADD COLUMN "netCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "vatCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "tender" TEXT; -- CARD, SEPA, CASH, OTHER
ALTER TABLE "Invoice" ADD COLUMN "location" TEXT; -- Praxis, Hausbesuch, etc.
ALTER TABLE "Invoice" ADD COLUMN "pdfGeneratedAt" TIMESTAMP; -- For caching
ALTER TABLE "Invoice" ADD COLUMN "pdfEtag" TEXT; -- ETag for caching

-- Add constraints
ALTER TABLE "Invoice" ADD CONSTRAINT "check_vat_rate" 
  CHECK ("vatRate" IS NULL OR "vatRate" IN (0, 10, 13, 20));
ALTER TABLE "Invoice" ADD CONSTRAINT "check_tender" 
  CHECK ("tender" IN ('CARD', 'SEPA', 'CASH', 'OTHER'));
```

### Audit Logging (Future Enhancement)

```sql
-- Audit table for sensitive operations
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL, -- READ, CREATE, UPDATE, DELETE
  "resourceType" TEXT NOT NULL, -- INVOICE, CLIENT, etc.
  "resourceId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_audit_log_user_created" ON "AuditLog"("userId", "createdAt");
CREATE INDEX "idx_audit_log_resource" ON "AuditLog"("resourceType", "resourceId");
```

## Prisma Schema Updates

```prisma
model Therapist {
  id                    String @id @default(cuid())
  userId                String @unique
  
  // Austrian business details
  kleinunternehmer      Boolean @default(false)
  vatNumber             String? // Austrian UID number
  businessName          String?
  businessAddress       String?
  businessPhone         String?
  businessEmail         String?
  
  // Annual tracking for compliance
  annualGrossCentsYtd   Int @default(0)
  cashGrossCentsYtd     Int @default(0)
  
  // Existing fields...
  user                  User @relation(fields: [userId], references: [id])
  invoices              Invoice[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model Invoice {
  id              String @id @default(cuid())
  number          String @unique
  
  // Core invoice data
  clientId        String
  therapistId     String
  serviceName     String
  serviceMinutes  Int?
  
  // Austrian compliance fields
  performanceDate DateTime? // Leistungsdatum
  netCents        Int @default(0)
  vatRate         Int? // null for Kleinunternehmer
  vatCents        Int @default(0)
  grossCents      Int @default(0)
  tender          TenderType @default(OTHER)
  location        String?
  
  // PDF generation tracking
  pdfGeneratedAt  DateTime?
  pdfEtag         String?
  
  // Status and metadata
  status          InvoiceStatus @default(DRAFT)
  notes           String?
  
  // Relations
  client          Client @relation(fields: [clientId], references: [id])
  therapist       Therapist @relation(fields: [therapistId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([therapistId, performanceDate])
  @@index([status, createdAt])
}

enum TenderType {
  CARD
  SEPA
  CASH
  OTHER
}

model AuditLog {
  id           String @id @default(cuid())
  userId       String
  action       AuditAction
  resourceType String
  resourceId   String
  ipAddress    String?
  userAgent    String?
  
  user         User @relation(fields: [userId], references: [id])
  
  createdAt    DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([resourceType, resourceId])
}

enum AuditAction {
  READ
  CREATE
  UPDATE
  DELETE
}
```

## Migration Considerations

### Data Migration Steps
1. **Backup existing invoice data** before schema changes
2. **Populate netCents/vatCents/grossCents** from existing totals
3. **Set reasonable defaults** for new required fields
4. **Calculate performanceDate** from appointment data where possible

### Backward Compatibility
- All new fields are nullable or have defaults
- Existing invoice calculations remain valid
- PDF generation gracefully handles missing data

### Performance Optimization
```sql
-- Indexes for PDF generation and CSV exports
CREATE INDEX "idx_invoice_therapist_performance" 
  ON "Invoice"("therapistId", "performanceDate");
CREATE INDEX "idx_invoice_status_created" 
  ON "Invoice"("status", "createdAt");
CREATE INDEX "idx_invoice_pdf_etag" 
  ON "Invoice"("pdfEtag") WHERE "pdfEtag" IS NOT NULL;
```