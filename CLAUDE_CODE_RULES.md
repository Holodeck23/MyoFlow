# ⚡ CLAUDE CODE OPERATIONAL RULES

**READ THIS FIRST - EVERY SESSION**

## 🎯 CORE PRINCIPLES

### **SURGICAL PRECISION OVER BULK REPLACEMENT**
- **NEVER** replace entire files or large code blocks
- Use `Edit` tool for targeted changes only
- Preserve existing code structure and patterns
- If you need to rewrite something substantially, explain why first

### **ONE BRANCH = ONE PURPOSE**
- Each branch addresses **exactly one** feature OR bug fix
- No "while I'm here" changes to unrelated code
- No refactoring unless that's the branch purpose
- No dependency updates unless that's the branch purpose
- **FOCUS. DISCIPLINE. SURGICAL.**

### **TEST BEFORE COMMIT - ALWAYS**
Before any commit, this sequence is MANDATORY:
```bash
pnpm typecheck  # Must pass
pnpm lint       # Must pass  
pnpm build      # Must pass
```
**No exceptions. No shortcuts. No "it should work" commits.**

## 📝 DOCUMENTATION STANDARDS

### **FACTUAL NOTES ONLY**
- State what changed, not how awesome it is
- Include WHY decisions were made
- Document any tradeoffs or limitations
- No cheerleading language ("amazing", "perfect", "incredible")
- Example: "Added encryption to health flags using libsodium" not "Amazing field-level encryption!"

### **BRANCH DESCRIPTIONS MUST INCLUDE:**
- What specific problem is being solved
- What files will be modified
- What testing was performed
- Any breaking changes or migration steps

## ⚠️ CRITICAL RESTRICTIONS

### **FORBIDDEN OPERATIONS**
- ❌ Bulk file replacements
- ❌ Multiple unrelated changes in one branch
- ❌ Committing without running the test sequence
- ❌ Changing dependencies without explicit discussion
- ❌ Modifying configuration files without clear justification
- ❌ Adding new features while fixing bugs (or vice versa)

### **REQUIRED CONFIRMATIONS**
Before making any change, Claude must confirm:
1. "This change is directly related to the branch purpose"
2. "I am using surgical edits, not bulk replacements"
3. "I have identified exactly which files need modification"
4. "I understand the testing requirements before commit"

## 🔧 OPERATIONAL WORKFLOW

### **Starting Work**
1. Understand the SINGLE purpose of this branch
2. Identify the minimal set of files to change
3. Plan surgical edits, not rewrites
4. Confirm scope with user if uncertain

### **During Work**
1. Make targeted changes using `Edit` tool
2. Explain each change and its necessity
3. Stay within the defined scope
4. If additional issues are discovered, note them for separate branches

### **Before Commit**
1. Run the mandatory test sequence
2. Review all changes for scope adherence
3. Ensure no unrelated modifications snuck in
4. Write factual commit message with clear description

## 🎪 SESSION BEHAVIOR

### **EVERY SESSION STARTS WITH:**
1. Reading and acknowledging these rules
2. Understanding the current branch purpose
3. Confirming the scope of work
4. Identifying the surgical approach needed

### **TONE AND COMMUNICATION**
- Professional and focused
- Factual rather than enthusiastic
- Honest about limitations and tradeoffs
- Clear about what will and won't be changed

### **SCOPE DISCIPLINE**
If you notice unrelated issues:
- **DO NOT FIX THEM**
- Note them for future branches
- Stay laser-focused on the current objective
- Resist the urge to "improve things while you're there"

## 🚨 EMERGENCY PROCEDURES

### **IF YOU CATCH YOURSELF:**
- About to make bulk replacements → STOP, use surgical edits
- Changing unrelated code → STOP, stay on scope
- Skipping tests → STOP, run the mandatory sequence
- Adding cheerleading language → STOP, stick to facts

### **IF SCOPE CREEP HAPPENS:**
1. Acknowledge the scope drift
2. Revert any unrelated changes
3. Refocus on the single branch purpose
4. Document additional issues for separate branches

## 🎯 SUCCESS METRICS

**A successful Claude Code session:**
- Addresses exactly one feature or bug fix
- Uses surgical edits maintaining code integrity
- Passes all tests before commit
- Includes factual documentation
- Leaves codebase more stable, not more complex

**Remember: We build tools with spine, operate with discipline, follow best practices.**

---

**⚡ CLAUDE: Acknowledge these rules at the start of every session.**