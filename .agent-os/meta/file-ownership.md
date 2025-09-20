# 📁 FILE OWNERSHIP BOUNDARIES
**Session:** Language System + Settings Completion
**Updated:** September 19, 2025

## 🟦 CODEX OWNERSHIP (Language System)

### **PRIMARY FILES**
```
packages/lib/i18n/dictionaries/en.json         [EXTEND]
packages/lib/i18n/dictionaries/de.json         [EXTEND]
packages/lib/i18n/context.tsx                  [MODIFY - default language]
apps/web/app/dashboard/layout.tsx              [ADD - language toggle]
```

### **STRING REPLACEMENT FILES**
```
apps/web/app/dashboard/settings/page.tsx       [REPLACE - German strings → translation keys]
apps/web/app/dashboard/page.tsx                [REPLACE - any hardcoded strings]
apps/web/app/dashboard/calendar/page.tsx       [REPLACE - any hardcoded strings]
apps/web/app/dashboard/appointments/page.tsx   [REPLACE - any hardcoded strings]
apps/web/app/dashboard/clients/page.tsx        [REPLACE - any hardcoded strings]
apps/web/app/dashboard/invoices/page.tsx       [REPLACE - any hardcoded strings]
apps/web/app/components/Sidebar.tsx            [REPLACE - any hardcoded strings]
```

### **NEW COMPONENTS TO CREATE**
```
apps/web/src/components/ui/LanguageToggle.tsx  [CREATE - language switcher]
```

## 🟩 CLAUDE OWNERSHIP (Settings Completion)

### **PRIMARY FILES**
```
apps/web/app/dashboard/settings/page.tsx       [EXTEND - add new tabs]
apps/web/app/api/therapist/profile/route.ts    [EXTEND - API endpoints]
```

### **NEW COMPONENTS TO CREATE**
```
apps/web/src/components/settings/TravelSettings.tsx      [CREATE]
apps/web/src/components/settings/PricingSettings.tsx     [CREATE]
apps/web/src/components/settings/ComplianceSettings.tsx  [CREATE]
apps/web/src/components/settings/SystemSettings.tsx     [CREATE]
```

### **POTENTIAL API EXTENSIONS**
```
apps/web/app/api/therapist/travel-settings/route.ts      [CREATE]
apps/web/app/api/service-rate-templates/route.ts         [REVIEW/EXTEND]
```

## 🚫 CONFLICT PREVENTION

### **NO SIMULTANEOUS EDITS**
- `apps/web/app/dashboard/settings/page.tsx`
  - **Resolution:** Codex does string replacement FIRST
  - **Then:** Claude adds new tab functionality

### **COMMUNICATION CHECKPOINTS**
1. **Before starting:** Both confirm file assignments
2. **After string replacement:** Codex signals completion
3. **Before settings work:** Claude confirms base is clean
4. **Before merge:** Both test integration

## 📋 COORDINATION SIGNALS

### **Codex Completion Signal**
```markdown
## CODEX LANGUAGE CLEANUP COMPLETE ✅
- **Strings replaced:** [count] hardcoded → translation keys
- **Language toggle:** Implemented and tested
- **Default language:** Set to English
- **Dictionary updates:** [count] new keys added
- **Ready for Claude:** Settings work can begin
```

### **Claude Completion Signal**
```markdown
## CLAUDE SETTINGS TABS COMPLETE ✅
- **New tabs:** Travel, Pricing, Compliance, System
- **API integration:** Real data replacing mock data
- **Validation:** Form validation implemented
- **Testing:** All tabs functional
- **Ready for merge:** Settings work complete
```

---
**READY FOR PARALLEL EXECUTION** 🚀