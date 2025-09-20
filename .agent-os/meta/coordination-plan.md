# 🚀 PARALLEL DEVELOPMENT COORDINATION PLAN
**Lead Developer:** Claude
**Created:** September 19, 2025
**Session:** Language System + Settings Completion

## 🎯 STRATEGIC DIVISION

### **CODEX ASSIGNMENT: Language System Cleanup** 🌐
**Branch:** `codex/language-system-cleanup`
**Complexity:** Medium (systematic string replacement)
**Timeline:** 2-3 hours
**Risk:** Low (isolated changes)

**SCOPE:**
1. **Find all hardcoded German strings** across codebase
2. **Replace with translation keys** using existing dictionary
3. **Add missing keys** to dictionaries where needed
4. **Implement language toggle** in header/layout
5. **Set English as development default**
6. **Test language switching** system-wide

**FILES TO FOCUS:**
- `apps/web/app/dashboard/settings/page.tsx` (German strings found)
- All dashboard pages with mixed language
- Layout components with hardcoded text
- Add toggle to `apps/web/app/dashboard/layout.tsx`

### **CLAUDE ASSIGNMENT: Settings Tab Completion** ⚙️
**Branch:** `claude/settings-tabs-completion`
**Complexity:** Medium (UI + API work)
**Timeline:** 3-4 hours
**Risk:** Medium (new functionality)

**SCOPE:**
1. **Travel Settings Tab** - Location config, travel rates, service radius
2. **Pricing Settings Tab** - Service rate templates management
3. **Compliance Settings Tab** - Austrian tax configuration
4. **System Settings Tab** - Language toggle, notifications, formats
5. **Wire up real API data** (replace static mock data)
6. **Add form validation** and error handling

**FILES TO FOCUS:**
- `apps/web/app/dashboard/settings/page.tsx` (add new tabs)
- `apps/web/app/api/therapist/profile/route.ts` (extend API)
- New components for each settings tab
- Form validation and state management

## 🔄 COORDINATION PROTOCOL

### **Git Worktree Strategy**
```bash
# Codex Workspace
cd /Users/ZOD/Documents/GitHub/MyoFlow-codex
git checkout main && git pull
git checkout -b codex/language-system-cleanup

# Claude Workspace
cd /Users/ZOD/Documents/GitHub/MyoFlow
git checkout main && git pull
git checkout -b claude/settings-tabs-completion
```

### **File Ownership During Development**
- **Codex owns:** All files for string replacement, i18n system, language toggle
- **Claude owns:** Settings page tabs, API extensions, new components
- **Shared coordination:** Through agents.md updates and activity log

### **Merge Strategy**
1. **Codex merges first** (language system is foundational)
2. **Claude rebases and merges** (settings work builds on language fixes)
3. **Test integration** together before marking complete

## 🚨 CRITICAL SUCCESS FACTORS

### **Before ANY Code Changes**
1. ✅ **Both agents confirm plan** in agents.md
2. ✅ **Clear file ownership** established
3. ✅ **Communication protocol** active
4. ✅ **Base branch sync** completed

### **During Development**
- **Update agents.md** with progress every 30 minutes
- **Activity log entries** at major milestones
- **No cross-contamination** of file ownership
- **Test locally** before any commits

### **Definition of Done**
- **Language system:** Consistent English default, working German toggle, no hardcoded strings
- **Settings completion:** All 4 tabs functional, real API integration, proper validation
- **Integration:** Both systems work together seamlessly
- **Testing:** All builds pass, no regressions

## 📋 COMMUNICATION TEMPLATES

### **Progress Update Template (agents.md)**
```markdown
## [Agent] Progress Update - [Time]
- **Current Task:** [Specific task]
- **Files Modified:** [List]
- **Status:** [On track/Blocked/Complete]
- **Next Step:** [What's next]
- **Coordination Needed:** [Any dependencies]
```

### **Handoff Template (Activity Log)**
```markdown
## [Agent] Session Complete - [Date]
**Branch:** [branch-name]
**Work Completed:** [Summary]
**Files Changed:** [List]
**Testing Status:** [Pass/Fail/Pending]
**Next Agent:** [Who should continue]
**Dependencies:** [What needs to happen next]
```

---

**READY FOR EXECUTION** ✅