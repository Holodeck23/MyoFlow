# Database Schema Synchronization - Deployment Guide

**Created:** 2025-09-21
**Issue Resolved:** Database Schema Synchronization Issue (Prisma client cache inconsistency)
**Priority:** High - Critical for production deployments

## Issue Background

The TaxComplianceSettings table was experiencing Prisma client cache inconsistency where:
- Database table existed with correct schema including `kleinunternehmer_start` column
- Prisma client claimed the column didn't exist
- Standard regeneration (`prisma generate`) was insufficient to resolve the issue

## Root Cause Analysis

The problem was caused by Prisma client cache becoming out of sync with the actual database schema. This can occur when:
1. Migrations are applied directly to the database without proper Prisma workflow
2. Multiple development environments with different migration states
3. Prisma client generated against outdated schema files
4. Database schema changes made outside of Prisma migration system

## Resolution Process Applied

### 1. Database Schema Verification
```bash
# Confirmed column exists in database
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow psql -d myoflow -c \
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'TaxComplianceSettings' AND column_name = 'kleinunternehmer_start';"
```

### 2. Schema Synchronization
```bash
# Pull latest database structure to Prisma schema
cd packages/db
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow npx prisma db pull
```

### 3. Client Regeneration
```bash
# Generate fresh Prisma client with updated schema
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow npx prisma generate
```

### 4. API Endpoint Restoration
- Removed try-catch workaround from `/api/settings/overview/route.ts`
- Restored `TaxComplianceSettings: true` to therapist include
- Simplified taxSettings extraction from relation

## Deployment Checklist

### Pre-Deployment Verification
- [ ] Confirm all migrations applied: `npx prisma migrate status`
- [ ] Verify schema synchronization: `npx prisma db pull`
- [ ] Regenerate client: `npx prisma generate`
- [ ] Run database integration tests: `npx vitest run src/test/tax-compliance-settings.test.ts`
- [ ] Test settings API endpoints: GET `/api/settings/overview`

### Production Deployment Steps
1. **Backup Database** (Critical)
   ```bash
   pg_dump myoflow > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Apply Migrations**
   ```bash
   DATABASE_URL=postgresql://production npx prisma migrate deploy
   ```

3. **Verify Schema Sync**
   ```bash
   DATABASE_URL=postgresql://production npx prisma db pull --force
   DATABASE_URL=postgresql://production npx prisma generate
   ```

4. **Health Check**
   - Test TaxComplianceSettings CRUD operations
   - Verify settings API responses include tax compliance data
   - Monitor application logs for Prisma-related errors

### Environment-Specific Considerations

#### Development Environment
- Always use `prisma db pull` before starting work on schema-related features
- Regenerate client after switching branches with migration changes
- Clear Prisma cache if experiencing unexplained client errors

#### Staging Environment
- Treat as production dress rehearsal
- Verify all migration dependencies are satisfied
- Test full application flow including settings pages

#### Production Environment
- Never apply migrations during peak usage hours
- Maintain database backups before any schema changes
- Monitor application performance after client regeneration
- Have rollback plan ready for rapid reversion

## Prevention Strategies

### Development Workflow
1. **Schema-First Development**: Always update schema.prisma before implementing features
2. **Migration Management**: Use `prisma migrate dev` for development changes
3. **Consistent Environments**: Ensure all developers use same database state
4. **Regular Synchronization**: Daily `prisma db pull` to catch drift early

### Monitoring and Alerts
- Set up database schema drift detection
- Monitor Prisma client connection errors
- Alert on migration status inconsistencies
- Track application errors related to missing database fields

### Rollback Procedures
If deployment fails due to schema sync issues:

1. **Immediate Rollback**
   ```bash
   # Restore previous database backup
   psql myoflow < backup_previous.sql

   # Revert to previous Prisma client
   git checkout HEAD~1 -- schema.prisma
   npx prisma generate
   ```

2. **Application Recovery**
   - Verify all API endpoints return expected responses
   - Check TaxComplianceSettings queries function correctly
   - Confirm no data loss occurred during rollback

## Testing Requirements

### Automated Tests
- Database integration tests for all new schema changes
- API endpoint tests verifying proper relation includes
- Migration rollback/replay testing in CI

### Manual Verification
- Settings page loads without errors
- Tax compliance data displays correctly
- All CRUD operations function as expected

## Future Considerations

1. **PostGIS Extension**: TaxComplianceSettings migration enables PostGIS
   - Verify production PostgreSQL supports PostGIS
   - Ensure superuser privileges available for extension creation
   - Document PostGIS setup in deployment checklist

2. **Data Migration**: Legacy JSON fields need migration
   - Plan migration from Therapist JSON fields to structured tables
   - Schedule backfill for existing tenant data
   - Validate data integrity post-migration

3. **Performance Optimization**
   - Monitor query performance with new includes
   - Consider caching strategies for settings API
   - Optimize database indexes for new schema

---

**Last Updated:** 2025-09-21
**Next Review:** After successful production deployment
**Escalation Contact:** Technical Lead, Database Administrator