# Agent Communication Protocol

## Project: MyoFlow - Austrian Therapy Practice Management

### Agent OS Integration Status
✅ **Agent OS Compliant**: This repository follows Agent OS structured workflow patterns
✅ **Specification-Driven**: All major features begin with `/create-spec` → `/create-tasks` → execution
✅ **Multi-Agent Coordination**: Claude and Codex work in parallel on complementary tasks

---

## Current Agent Assignments

### Claude (Implementation Agent)
- **Primary Role**: Feature implementation, UI/UX development, real-time debugging
- **Current Focus**: MyoFlow professional branding, client management system
- **Active Branch**: `feature/myoflow-professional-branding`
- **Expertise**: Next.js, React, TypeScript, Austrian business compliance

### Codex (Infrastructure Agent)  
- **Primary Role**: System architecture, CI/CD, build optimization, environment setup
- **Current Focus**: Monorepo configuration, webpack issues, build pipeline
- **Expertise**: Configuration management, dependency resolution, development environment

---

## Communication Patterns

### Issue Escalation
When Claude encounters infrastructure issues (build failures, configuration problems, environment setup), escalate to Codex with:
1. **Specific error messages** with full stack traces
2. **Environment context** (Node.js, pnpm, OS versions)
3. **Attempted solutions** and their outcomes
4. **Minimal reproduction steps** if possible

### Task Handoffs
- **From Claude to Codex**: Infrastructure blockers, system configuration, CI/CD setup
- **From Codex to Claude**: Feature requirements, implementation specs, user-facing functionality

### Status Updates
Both agents should update this file with:
- Current task status
- Blocking issues discovered
- Solutions implemented
- Coordination needs

---

## Active Issues Requiring Coordination

### 🚨 HIGH PRIORITY: Webpack Module Resolution Error
**Status**: BLOCKING development server
**Error**: `Cannot find module './24.js'` in webpack-runtime.js
**Context**: 
- Occurs after TypeScript compilation succeeds
- Prevents HTTP requests from being served
- Persists across cache clearing, dependency updates, Next.js version changes
- Root cause identified by Codex: TypeScript configuration scope issues

**Attempted Solutions**:
- ✅ Fixed root tsconfig.json to remove overly broad `**/*.ts` includes
- ✅ Updated Next.js from 14.0.4 → 14.2.13
- ✅ Complete node_modules reinstall
- ❌ Issue persists - deeper webpack configuration problem

**Update**: Applied Codex's fix - removed @myoflow/db from transpilePackages and moved transpilePackages out of experimental. However, error persists and paths still show next@14.0.4 despite package.json showing 14.2.13.

**Additional Request for Codex**: 
The Prisma transpilation fix was logically correct but didn't resolve the issue. Error still occurs and runtime paths suggest caching issues. Need deeper investigation into:
1. Why Next.js paths still reference 14.0.4 after full rebuild
2. Whether there are additional Prisma-related imports causing the same webpack chunking issue
3. Alternative approaches (different dev ports, build mode testing, webpack config overrides)

---

## Development Environment Status

### Working Components
- ✅ TypeScript compilation (all packages)
- ✅ Database migrations and seeding
- ✅ Authentication system (NextAuth.js)
- ✅ Professional UI components and branding
- ✅ Austrian business logic (invoicing, VAT calculations)

### Blocking Issues
- 🚨 Development server HTTP serving (webpack module resolution)
- ⚠️ Next.js config warnings (transpilePackages moved from experimental)

---

## Agent OS Workflow Status

### Current Sprint: MyoFlow Professional Branding (90% Complete)
- ✅ Complete Tailwind design system with Austrian medical colors
- ✅ Professional component library (Logo, EncryptionBadge, Buttons)
- ✅ German-language client management interface
- ✅ Austrian business formatting patterns
- 🚧 Client profile tabbed interface (pending server resolution)

### Next Sprint: Austrian Invoice PDF Compliance
- 📋 Ready-to-execute specification available in `.agent-os/specs/`
- 📋 Coordinated with Codex on parallel infrastructure tasks
- ⏸️ Blocked pending development server resolution

---

## Technical Debt Documentation

### Environment-Specific Issues
1. **Webpack Module Resolution**: Persistent './24.js' error requiring deep investigation
2. **Next.js Configuration**: transpilePackages warnings need resolution
3. **Monorepo Build Isolation**: Package-specific builds may compile unrelated files

### Future Improvements
1. **Test Infrastructure**: Vitest setup completed but needs CI integration
2. **Build Pipeline**: Optimization for Austrian compliance requirements
3. **Development Experience**: Hot reload and error handling improvements

---

*Last Updated: 2025-09-08 13:35 UTC*  
*Next Update: After webpack resolution or significant progress on client profiles*