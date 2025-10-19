# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-09-16-repository-cleanup/spec.md

> Created: 2025-09-16
> Status: Ready for Implementation

## Tasks

- [ ] 1. Create backup branch and perform safe file deletions
  - [ ] 1.1 Create backup branch `backup/pre-cleanup-2025-09-16` from current state
  - [ ] 1.2 Delete SPRINT_1.4_SUMMARY.md (historical summary, info preserved in CLAUDE.md)
  - [ ] 1.3 Delete TESTING_AUTH.md (temporary testing notes with security risk - contains hardcoded credentials)
  - [ ] 1.5 Run pnpm build to verify no broken references
  - [ ] 1.6 Commit changes with descriptive message

- [ ] 2. Archive completed Agent OS specifications
  - [ ] 2.1 Create .agent-os/archive/ directory structure
  - [ ] 2.2 Move completed spec: 2025-09-07-therapist-profile-settings/ to archive
  - [ ] 2.3 Move completed spec: 2025-09-07-invoice-pdf-austrian-compliance/ to archive
  - [ ] 2.4 Move completed spec: 2025-09-14-austrian-medical-design-system/ to archive
  - [ ] 2.5 Update any @file references pointing to archived specs
  - [ ] 2.6 Verify Agent OS commands still function correctly

- [ ] 3. Consolidate roadmap documentation
  - [ ] 3.1 Create new consolidated ROADMAP.md file
  - [ ] 3.2 Merge content from COMPREHENSIVE_ROADMAP.md preserving key sections
  - [ ] 3.3 Merge content from TECH_ROADMAP.md maintaining technical priorities
  - [ ] 3.4 Remove duplicate information and organize chronologically
  - [ ] 3.5 Delete original COMPREHENSIVE_ROADMAP.md and TECH_ROADMAP.md files
  - [ ] 3.6 Update any internal references to point to new ROADMAP.md

- [ ] 4. Consolidate development documentation
  - [ ] 4.1 Create enhanced DEVELOPMENT.md file
  - [ ] 4.2 Merge content from existing DEVELOPMENT.md and DEVELOPMENT_CHECKLIST.md
  - [ ] 4.3 Organize into logical sections (setup, workflow, standards, checklist)
  - [ ] 4.4 Evaluate merging QUICK_START.md content into README.md or DEVELOPMENT.md
  - [ ] 4.5 Delete redundant files after content migration
  - [ ] 4.6 Verify all development processes remain documented

- [ ] 5. Final verification and cleanup completion
  - [ ] 5.1 Run full build suite (pnpm build, typecheck, lint) to ensure stability
  - [ ] 5.2 Verify Agent OS commands function with updated file structure
  - [ ] 5.3 Count final markdown files (target: 6-7 root files from original 12)
  - [ ] 5.4 Update CLAUDE.md to reflect completed cleanup if needed
  - [ ] 5.5 Test git operations and repository navigation
  - [ ] 5.6 Document cleanup results and file count reduction achieved