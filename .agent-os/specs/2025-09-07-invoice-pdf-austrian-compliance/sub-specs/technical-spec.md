# Technical Specification: Austrian Invoice PDF + CSV Exports

## Architecture

### PDF Generation Pipeline
```
Request → Route Handler → Invoice Data + Therapist Profile → HTML Template → Playwright PDF → Response
```

### Key Components

**1. PDF Route Handler**
- Path: `GET /api/files/invoice/[id].pdf`
- Authentication: NextAuth session validation
- Caching: ETag + Last-Modified headers (based on invoice.updatedAt)
- Performance: Cache-Control: private, max-age=300

**2. Austrian Business Logic**
```typescript
interface AustrianInvoiceData {
  therapeut: {
    kleinunternehmer: boolean;
    vatNumber?: string;
    businessName: string;
    address: string;
  };
  invoice: {
    performanceDate: Date; // "Leistungsdatum"
    netCents: number;
    vatRate?: number; // null if KU
    vatCents: number;
    grossCents: number;
  };
}
```

**3. PDF Template Requirements**
- A4 format (210 × 297 mm)
- Professional German layout
- Conditional VAT section rendering
- Legal compliance footer text

## Implementation Details

### KU vs VAT Logic
```typescript
function computeInvoiceDisplay(invoice: Invoice, therapist: Therapist) {
  if (therapist.kleinunternehmer) {
    return {
      showVatColumn: false,
      vatAmount: 0,
      footerText: "Kleinunternehmerregelung § 6 Abs. 1 Z 27 UStG - keine Umsatzsteuer ausweisbar"
    };
  }
  
  return {
    showVatColumn: true,
    vatAmount: invoice.vatCents,
    vatRate: invoice.vatRate,
    footerText: null
  };
}
```

### Caching Strategy
- ETag: `invoice-${invoice.id}-${invoice.updatedAt.getTime()}`
- 304 responses for unchanged invoices
- Cache headers prevent sensitive data caching by proxies

### CSV Export Format

**Invoices CSV (BMD/RZL compatible)**
```csv
Datum,Belegnummer,Kunde,Leistung,Netto,USt-Satz,USt-Betrag,Brutto,Zahlart,Ort
2025-09-07,2025-001,Maria Mustermann,Klassische Massage,6000,20,1200,7200,SEPA,Praxis
```

**Cash Export CSV**
```csv
Datum,Zeit,Betrag,Zahlart,Belegnummer
2025-09-07,14:30,7200,BAR,2025-001
```

## Error Handling

### PDF Generation Failures
- Invalid invoice ID → 404 with error message
- Permission denied → 403 with audit log entry
- Puppeteer timeout → 500 with retry mechanism
- Missing therapist data → 422 with validation errors

### CSV Export Edge Cases
- Empty date range → Return empty CSV with headers
- Invalid date format → 400 with clear error message
- Large datasets → Stream response to prevent memory issues

## Performance Requirements

- PDF generation: <2 seconds p95 latency
- CSV exports: <5 seconds for 1000 invoices
- Memory usage: <100MB during PDF generation
- Concurrent requests: Support 10 simultaneous PDF generations

## Security Considerations

### Data Protection
- No PII in application logs
- PDF content never cached on client
- CSV downloads require OWNER/ACCOUNTANT role
- Audit log all sensitive data access

### Austrian GDPR Compliance
- Health data (if present) requires encryption
- Access logging for therapist profile data
- Clear data retention policies for generated PDFs
- Secure deletion of temporary files