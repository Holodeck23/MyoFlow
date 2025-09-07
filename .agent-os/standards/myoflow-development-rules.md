# MyoFlow Development Rules

## Context

MyoFlow-specific development standards that extend Agent OS best practices with surgical precision and one-branch-per-feature discipline.

## Core Development Principles

### Surgical Precision Over Bulk Replacement
- **NEVER** replace entire files or large code blocks
- Use `Edit` tool for targeted changes only  
- Preserve existing code structure and patterns
- If substantial rewriting is needed, explain why first and get approval

### One Branch = One Purpose
- Each branch addresses **exactly one** feature OR bug fix
- No "while I'm here" changes to unrelated code
- No refactoring unless that's the branch purpose
- No dependency updates unless that's the branch purpose
- **FOCUS. DISCIPLINE. SURGICAL.**

### Mandatory Testing Before Commit
Before any commit, this sequence is MANDATORY:
```bash
pnpm --filter @myoflow/web typecheck  # Must pass
pnpm --filter @myoflow/web lint       # Must pass  
pnpm --filter @myoflow/web build      # Must pass
```
**No exceptions. No shortcuts. No "it should work" commits.**

## MyoFlow-Specific Standards

### Austrian Compliance First
- German-first UX copy with professional therapy terminology
- Kleinunternehmerregelung VAT handling with proper legal notices
- GDPR Article 9 health data encryption using libsodium
- Austrian business format validation (UID numbers, phone numbers)
- Sequential invoice numbering in YYYY-NNN format

### TypeScript Strict Mode
- No `any` types unless explicitly justified in code comments
- Zod validation for all API payloads and form inputs
- Proper type definitions for Austrian business entities
- Field-level encryption types for sensitive health data

### Security Defaults
- No plaintext logs containing sensitive information
- libsodium field-level encryption for health data and business info
- Content Security Policy headers on all routes
- NextAuth.js session validation on all protected endpoints

## Branch Management Rules

### Feature Branch Workflow
- Branch naming: `feature/<spec-key>-<slug>` (e.g., `feature/therapist-profile-settings`)
- One feature per branch - no scope creep
- Clean, focused commits with conventional commit messages
- PR checklist must include security review and test coverage

### Forbidden Operations
- ❌ Bulk file replacements
- ❌ Multiple unrelated changes in one branch  
- ❌ Committing without running the test sequence
- ❌ Changing dependencies without explicit discussion
- ❌ Modifying configuration files without clear justification
- ❌ Adding new features while fixing bugs (or vice versa)
- ❌ Feature drift - implementing more than the single branch purpose

## Documentation Standards

### Factual Notes Only
- State what changed, not how awesome it is
- Include WHY decisions were made
- Document any tradeoffs or limitations
- No cheerleading language ("amazing", "perfect", "incredible")
- Example: "Added encryption to UID numbers using libsodium" not "Amazing field-level security!"

### Required Branch Documentation
- What specific problem is being solved
- What files will be modified
- What testing was performed
- Any breaking changes or migration steps
- Austrian compliance considerations if applicable

## Quality Gates

### Pre-Implementation Confirmations
Before making any change, confirm:
1. "This change is directly related to the branch purpose"
2. "I am using surgical edits, not bulk replacements"  
3. "I have identified exactly which files need modification"
4. "I understand the testing requirements before commit"

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Austrian compliance validation where applicable
- [ ] Security considerations (encryption, validation, logging)
- [ ] German-first UX copy with proper terminology
- [ ] Test coverage for new functionality
- [ ] Migration scripts for database changes
- [ ] Performance impact assessment
- [ ] Scope adherence (no unrelated changes)

## Austrian Therapy Practice Context

### Business Logic Considerations
- Therapist designations: HEILMASSEUR, MEDIZINISCHER_MASSEUR, GEWERBLICHER_MASSEUR
- VAT status handling: Kleinunternehmer vs standard VAT rates
- Service categories: MASSAGE, CONSULTING, YOGA, OTHER
- Austrian holiday system for all 9 Bundesländer
- Professional German terminology throughout UI

### Data Protection Requirements
- Health data requires Article 9 GDPR compliance
- Client notes must use field-level encryption
- Audit logging for all therapist profile changes
- Secure handling of Austrian business identifiers (UID numbers)

## Emergency Procedures

### If You Catch Yourself
- About to make bulk replacements → STOP, use surgical edits
- Changing unrelated code → STOP, stay on scope
- Skipping tests → STOP, run the mandatory sequence
- Adding cheerleading language → STOP, stick to facts

### If Scope Creep Happens
1. Acknowledge the scope drift immediately
2. Revert any unrelated changes
3. Refocus on the single branch purpose
4. Document additional issues for separate branches
5. Remember: "Feature drift" violates the one branch = one purpose rule

## Success Metrics

A successful MyoFlow development session:
- Addresses exactly one feature or bug fix
- Uses surgical edits maintaining code integrity
- Passes all tests before commit (typecheck + lint + build)
- Includes factual documentation
- Maintains Austrian compliance where applicable
- Leaves codebase more stable, not more complex
- Follows German-first UX principles

**Remember: We build Austrian therapy practice tools with spine, operate with discipline, follow best practices.**