# MyoFlow Documentation Index

**Last Updated:** October 4, 2025

Quick reference guide to all documentation in the repository.

## 📚 Start Here

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **README.md** | Project overview, features, quick start | First time setup |
| **DEVELOPMENT.md** | Complete setup guide, commands, troubleshooting | Setting up dev environment |
| **ROADMAP.md** | Current sprint plan and priorities | Understanding what's next |

## 🔧 Active Development

| Document | Purpose |
|----------|---------|
| **CLAUDE.md** | Session notes, current sprint status, handoff protocol |
| **COORDINATION.md** | Multi-agent workflow, sprint coordination, quality gates |
| **GIT_WORKFLOW.md** | Branching strategy, commit format, PR process |
| **DECISION_LOG.md** | Architecture decisions and rationale |
| **KNOWN_ISSUES.md** | Current issues, recently fixed items, development status |

## 📋 Reference Documents

| Document | Purpose |
|----------|---------|
| **CODE_QUALITY_REMEDIATION_PLAN.md** | All 11 hardening items (✅ complete) |

## 📦 Archived Planning

Located in `docs/archive/`:
- Multi-tenancy migration plans
- GDPR compliance roadmap
- Long-term implementation plans

These are **post-launch** priorities, revisited after Sprint 7.

## 🎯 Quick Navigation

### I want to...
- **Get started developing** → `DEVELOPMENT.md`
- **Understand the current sprint** → `ROADMAP.md` or `CLAUDE.md`
- **See what's been completed** → `README.md` or `KNOWN_ISSUES.md`
- **Learn the workflow** → `COORDINATION.md` or `GIT_WORKFLOW.md`
- **Understand a past decision** → `DECISION_LOG.md`
- **Plan future features** → `docs/archive/` (after Sprint 7)

## 📊 Documentation Hierarchy

```
Root Documentation (Active)
├── README.md              ← Project overview
├── DEVELOPMENT.md         ← Setup and workflow
├── ROADMAP.md            ← Sprint plan
├── CLAUDE.md             ← Session notes
├── COORDINATION.md        ← Multi-agent workflow
├── GIT_WORKFLOW.md       ← Git/PR process
├── DECISION_LOG.md       ← Architecture decisions
├── KNOWN_ISSUES.md       ← Status tracking
└── CODE_QUALITY_REMEDIATION_PLAN.md  ← Completed hardening

docs/
├── archive/              ← Future planning (post-launch)
│   ├── README.md
│   ├── MULTI_TENANCY_MIGRATION_PLAN.md
│   ├── MULTI_TENANT_SCHEMA_DESIGN.md
│   ├── GDPR_COMPLIANCE_PLAN.md
│   ├── SECURITY_HARDENING_CHECKLIST.md
│   └── IMPLEMENTATION_ROADMAP.md
└── current/              ← Additional project docs
```

## 🔄 Document Lifecycle

1. **Active** - Root-level .md files for current development
2. **Archived** - `docs/archive/` for future planning
3. **Reference** - Completed plans kept for historical context

All documents updated to reflect October 4, 2025 status (Sprint 1 complete).
