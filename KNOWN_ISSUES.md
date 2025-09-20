# Known Issues - User Settings Branch

## 🐛 Critical Issues

### 1. Translation System Layout Glitches
**Status:** Critical - Severe layout shifts during language switching
**Affected:** Sidebar navigation, footer, settings page
**Symptoms:**
- Multiple UI elements shifting positions when toggling EN/DE
- Layout becomes unstable and unprofessional
- Several areas affected simultaneously

**Root Cause:**
- German text significantly longer than English equivalents
- CSS layout not accounting for dynamic text length changes
- Translation system causing reflow throughout UI

**Temporary Fix Applied:**
- Added `min-w-0 truncate` CSS classes to sidebar
- Hardcoded dummy data in Current Profile section
- Still experiencing severe glitches

**Recommended Action:**
- Move translation work to separate feature branch
- Implement proper CSS layout strategy for bilingual content
- Consider fixed-width containers or text overflow handling

### 2. Performance Issues
**Status:** Medium - Development workflow impact
**Symptoms:**
- Settings page compilation: 12.7+ seconds
- Initial page load: 5+ seconds
- Multiple background processes causing conflicts

**Impact:**
- Development velocity significantly reduced
- Testing translation changes becomes time-consuming

## 🔄 Handoff Notes

### Original Task Context
- **Primary Goal:** Implement Austrian Registrierkassenpflicht (RKSV) compliance
- **Status:** Interrupted by translation system fixes
- **Next Steps:** Resume RKSV implementation work
- **Coordination:** Hand off to Codex for completion

### Branch Status
- **Current Branch:** `user-settings-design`
- **Main Features Working:** Settings page structure, RKSV foundation
- **Can Merge:** Yes, core functionality intact despite UI glitches
- **Translation Work:** Should continue on separate branch

---
**Created:** 2025-09-19 16:35 CET
**Priority:** Address translation glitches in separate sprint
**Escalate to:** Codex for RKSV completion