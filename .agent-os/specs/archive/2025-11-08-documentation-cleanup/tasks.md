# Documentation Cleanup & Refactoring - Tasks

**Created:** 2025-11-08
**Priority:** P2 - Post-Demo Cleanup
**Target:** Clean up root documentation structure
**Estimated Time:** 3-4 hours

---

## Current State Analysis

### Root Directory Documentation Files
Based on the project, these files exist in the root:
- `README.md` - Main project overview
- `CLAUDE.md` - Claude session notes (ACTIVE - updated Oct 24)
- `DEVELOPMENT.md` - Development workflow
- `GIT_WORKFLOW.md` - Git conventions
- `DECISION_LOG.md` - Technical decisions
- `COORDINATION.md` - Multi-agent communication
- `DOCS_INDEX.md` - Documentation index
- Various archived/outdated docs

### Problems Identified
1. **Too many top-level markdown files** - Clutters root directory
2. **Unclear organization** - Mix of active and archived docs
3. **Duplicate information** - Session notes scattered across files
4. **Outdated content** - Files from Sept/Oct may be stale
5. **Poor discoverability** - Hard to find relevant docs quickly

---

## Tasks

- [ ] 1. Audit Existing Documentation
  - [ ] 1.1 List all .md files in root directory
  - [ ] 1.2 Categorize by purpose (active, archive, reference, outdated)
  - [ ] 1.3 Identify duplicate/overlapping content
  - [ ] 1.4 Check last modified dates and relevance
  - [ ] 1.5 Create inventory spreadsheet/markdown table
  - [ ] 1.6 Get user approval on categorization

- [ ] 2. Design New Documentation Structure
  - [ ] 2.1 Propose new folder structure (docs/, archive/, etc.)
  - [ ] 2.2 Define which files stay in root (README, CLAUDE, etc.)
  - [ ] 2.3 Design clear naming conventions
  - [ ] 2.4 Create DOCS_INDEX.md structure with clear navigation
  - [ ] 2.5 Plan migration path for existing content
  - [ ] 2.6 Get user approval on structure

- [ ] 3. Consolidate Active Documentation
  - [ ] 3.1 Keep core files in root: README.md, CLAUDE.md, DEVELOPMENT.md
  - [ ] 3.2 Merge overlapping content (COORDINATION ↔ DEVELOPMENT)
  - [ ] 3.3 Update CLAUDE.md with current session (Nov 8, 2025)
  - [ ] 3.4 Ensure all cross-references are correct
  - [ ] 3.5 Verify internal links work
  - [ ] 3.6 Review consolidated content for accuracy

- [ ] 4. Archive Outdated Documentation
  - [ ] 4.1 Create `archive/` folder structure by date
  - [ ] 4.2 Move completed sprint docs to archive (CODE_QUALITY_REMEDIATION_PLAN, etc.)
  - [ ] 4.3 Move old specs to `.agent-os/specs/archive/`
  - [ ] 4.4 Add README to archive explaining what it contains
  - [ ] 4.5 Update any references to archived docs
  - [ ] 4.6 Test that no active code references archived files

- [ ] 5. Organize Reference Documentation
  - [ ] 5.1 Create `docs/` folder for reference materials
  - [ ] 5.2 Move technical guides to `docs/guides/`
  - [ ] 5.3 Move QA reports to `docs/qa/` (already exists)
  - [ ] 5.4 Create `docs/decisions/` for architectural decisions
  - [ ] 5.5 Update DOCS_INDEX.md with new locations
  - [ ] 5.6 Verify all documentation is discoverable

- [ ] 6. Update Navigation & Index
  - [ ] 6.1 Rewrite DOCS_INDEX.md with clear categories
  - [ ] 6.2 Add "Quick Start" section for new developers
  - [ ] 6.3 Add "For Claude/AI Agents" section with key files
  - [ ] 6.4 Update README.md to reference DOCS_INDEX.md
  - [ ] 6.5 Add breadcrumbs/navigation to major docs
  - [ ] 6.6 Test navigation flow from README → specific docs

- [ ] 7. Cleanup & Validation
  - [ ] 7.1 Remove any duplicate files
  - [ ] 7.2 Ensure consistent markdown formatting
  - [ ] 7.3 Check all internal links work (no 404s)
  - [ ] 7.4 Verify .gitignore doesn't exclude important docs
  - [ ] 7.5 Run final review of entire documentation structure
  - [ ] 7.6 Get user approval on final state

---

## Proposed New Structure

```
MyoFlow/
├── README.md                          # Main project overview (KEEP)
├── CLAUDE.md                          # Current session notes (KEEP)
├── DEVELOPMENT.md                     # Development workflow (KEEP)
├── DOCS_INDEX.md                      # Documentation navigation hub (KEEP)
│
├── docs/                              # Reference documentation
│   ├── guides/                        # How-to guides
│   │   ├── getting-started.md
│   │   ├── austrian-compliance.md
│   │   └── testing.md
│   ├── decisions/                     # Architectural decisions
│   │   └── [ADR files]
│   ├── qa/                            # QA reports (EXISTING)
│   └── api/                           # API documentation
│
├── archive/                           # Archived documentation
│   ├── 2025-09/                       # September docs
│   ├── 2025-10/                       # October docs
│   └── README.md                      # What this archive contains
│
└── .agent-os/                         # Agent OS structure (EXISTING)
    ├── specs/                         # Feature specs
    │   ├── active/                    # Current work
    │   └── archive/                   # Completed specs
    └── tasks/                         # Task tracking
```

---

## Success Criteria

**Organization:**
- ✅ Root directory has ≤ 5 .md files (README, CLAUDE, DEVELOPMENT, DOCS_INDEX, + 1)
- ✅ Clear separation between active, reference, and archived docs
- ✅ All documentation is discoverable through DOCS_INDEX.md

**Quality:**
- ✅ No duplicate information across files
- ✅ All internal links work (no broken references)
- ✅ Consistent markdown formatting throughout
- ✅ Clear purpose/audience for each document

**Usability:**
- ✅ New developer can find setup instructions in < 2 minutes
- ✅ AI agents can find context files quickly
- ✅ Historical context is preserved but not cluttering

**Maintenance:**
- ✅ Clear guidelines for where new docs should go
- ✅ Archive structure makes it easy to add future docs
- ✅ CLAUDE.md process documented for session continuity

---

## Files to Keep in Root

**Essential (Core workflow):**
1. `README.md` - Project overview, quick start
2. `CLAUDE.md` - Active session notes (critical for AI context)
3. `DEVELOPMENT.md` - Development workflow
4. `DOCS_INDEX.md` - Documentation hub

**Consider Keeping:**
5. `CONTRIBUTING.md` - If/when we open source
6. `LICENSE.md` - Legal/licensing info

**Move to docs/ or archive/:**
- `GIT_WORKFLOW.md` → `docs/guides/git-workflow.md`
- `DECISION_LOG.md` → `docs/decisions/` (split into ADR files)
- `COORDINATION.md` → Merge into DEVELOPMENT.md or archive
- `ROADMAP.md` → Merge into CLAUDE.md session notes or archive
- All sprint/bug/QA docs → `archive/2025-10/`

---

## Execution Strategy

**Lead:** Claude (planning, review, git management)
**Execution:** Claude or Codex (file moves, content merging)
**Approach:**
1. Get approval on structure first
2. Execute moves in single commit
3. Update all cross-references
4. Validate before finalizing

**Branch Strategy:**
- Create branch: `chore/documentation-cleanup`
- Single commit with all moves + updates
- PR for review before merge

---

## Notes

- This task should be done AFTER critical bug fixes
- Can be done in parallel with grant demo preparation
- Low risk - doesn't touch application code
- Improves long-term maintainability
- Makes it easier for future AI agents to find context
